import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types';
import logger from '../utils/logger';

// Extend Axios config to include metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://150.162.244.21:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token and log requests
api.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    const startTime = Date.now();
    config.metadata = { startTime };
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the API request
    logger.apiRequest(
      config.method?.toUpperCase() || 'UNKNOWN',
      `${config.baseURL}${config.url}`,
      config.data
    );
    
    return config;
  },
  (error) => {
    logger.error('API_REQUEST', 'Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors and log responses
api.interceptors.response.use(
  (response) => {
    const config = response.config as ExtendedAxiosRequestConfig;
    const duration = config.metadata?.startTime 
      ? Date.now() - config.metadata.startTime 
      : undefined;
    
    // Log the API response
    logger.apiResponse(
      config.method?.toUpperCase() || 'UNKNOWN',
      `${config.baseURL}${config.url}`,
      response.status,
      response.data,
      duration
    );
    
    return response;
  },
  (error) => {
    const config = error.config as ExtendedAxiosRequestConfig;
    const duration = config?.metadata?.startTime 
      ? Date.now() - config.metadata.startTime 
      : undefined;
    
    // Log the API error response
    if (error.response) {
      logger.apiResponse(
        config?.method?.toUpperCase() || 'UNKNOWN',
        `${config?.baseURL}${config?.url}`,
        error.response.status,
        error.response.data,
        duration
      );
    } else {
      logger.error('API_ERROR', 'Network or request error', {
        message: error.message,
        config: error.config,
        duration
      });
    }
    
    if (error.response?.status === 401) {
      logger.warn('AUTH', 'Unauthorized access - redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    email: string;
    profile: {
      name: string;
      age?: number;
      location?: {
        city: string;
        state: string;
        country: string;
      };
      avatar_url?: string;
    };
    is_active: boolean;
    stats: {
      games_played: number;
      games_won: number;
      games_lost: number;
      current_score: number;
    };
    created_at: string;
    last_login?: string;
  };
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  age?: number;
  city?: string;
  state?: string;
  country?: string;
}

// Helper function to convert backend user to frontend user format
function mapBackendUserToFrontend(backendUser: LoginResponse['user']): User {
  return {
    id: backendUser.id,
    name: backendUser.profile.name,
    email: backendUser.email,
    avatar: backendUser.profile.avatar_url,
    age: backendUser.profile.age,
    location: backendUser.profile.location ? {
      city: backendUser.profile.location.city,
      state: backendUser.profile.location.state,
      country: backendUser.profile.location.country,
    } : undefined,
    stats: {
      gamesPlayed: backendUser.stats.games_played,
      gamesWon: backendUser.stats.games_won,
      gamesLost: backendUser.stats.games_lost,
      rating: backendUser.stats.current_score,
    },
    createdAt: new Date(backendUser.created_at),
    lastSeen: backendUser.last_login ? new Date(backendUser.last_login) : new Date(),
  };
}

export const authAPI = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    logger.info('AUTH', 'Attempting user login', { email: credentials.email });
    try {
      const response: AxiosResponse<LoginResponse> = await api.post('/api/auth/login', credentials);
      const authResponse = {
        user: mapBackendUserToFrontend(response.data.user),
        token: response.data.access_token,
        refreshToken: '', // Backend doesn't return refresh token yet
      };
      logger.info('AUTH', 'Login successful', { userId: authResponse.user.id });
      return authResponse;
    } catch (error) {
      logger.error('AUTH', 'Login failed', { email: credentials.email, error });
      throw error;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    logger.info('AUTH', 'Attempting user registration', { email: data.email, username: data.username });
    const registerRequest: RegisterRequest = {
      username: data.username,
      email: data.email,
      password: data.password,
      name: data.name,
      age: data.age,
      city: data.location?.city || '',
      state: data.location?.state || '',
      country: data.location?.country || '',
    };

    try {
      const response: AxiosResponse<LoginResponse> = await api.post('/api/auth/register', registerRequest);
      const authResponse = {
        user: mapBackendUserToFrontend(response.data.user),
        token: response.data.access_token,
        refreshToken: '', // Backend doesn't return refresh token yet
      };
      logger.info('AUTH', 'Registration successful', { userId: authResponse.user.id });
      return authResponse;
    } catch (error) {
      logger.error('AUTH', 'Registration failed', { email: data.email, username: data.username, error });
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    logger.debug('AUTH', 'Fetching current user data');
    try {
      const response: AxiosResponse<LoginResponse['user']> = await api.get('/api/auth/me');
      const user = mapBackendUserToFrontend(response.data);
      logger.debug('AUTH', 'Current user data retrieved', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('AUTH', 'Failed to fetch current user data', error);
      throw error;
    }
  },

  async validateToken(): Promise<boolean> {
    logger.debug('AUTH', 'Validating authentication token');
    try {
      await this.getCurrentUser();
      logger.debug('AUTH', 'Token validation successful');
      return true;
    } catch (error) {
      logger.warn('AUTH', 'Token validation failed', error);
      return false;
    }
  },
};

export const gamesAPI = {
  async createGame(gameMode: string, difficulty?: string) {
    logger.info('GAME', 'Creating new game', { gameMode, difficulty });
    try {
      const response = await api.post('/api/games/create', {
        mode: gameMode,
        difficulty: difficulty
      });
      logger.info('GAME', 'Game created successfully', { gameId: response.data.id, gameMode });
      return response.data;
    } catch (error) {
      logger.error('GAME', 'Failed to create game', { gameMode, difficulty, error });
      throw error;
    }
  },

  async getGames() {
    logger.debug('GAME', 'Fetching games list');
    try {
      const response = await api.get('/api/games');
      logger.debug('GAME', 'Games list retrieved', { count: response.data?.length });
      return response.data;
    } catch (error) {
      logger.error('GAME', 'Failed to fetch games list', error);
      throw error;
    }
  },

  async getGame(gameId: string) {
    logger.debug('GAME', 'Fetching game details', { gameId });
    try {
      const response = await api.get(`/api/games/${gameId}`);
      logger.debug('GAME', 'Game details retrieved', { gameId, status: response.data?.status });
      return response.data;
    } catch (error) {
      logger.error('GAME', 'Failed to fetch game details', { gameId, error });
      throw error;
    }
  },

  async makeMove(gameId: string, position: { row: number; col: number }) {
    logger.info('GAME', 'Making move', { gameId, position });
    try {
      const response = await api.post(`/api/games/${gameId}/move`, position);
      logger.info('GAME', 'Move completed', { gameId, position, result: response.data });
      return response.data;
    } catch (error) {
      logger.error('GAME', 'Failed to make move', { gameId, position, error });
      throw error;
    }
  },

  async getActiveGames() {
    logger.debug('LOBBY', 'Fetching active games');
    try {
      const response = await api.get('/api/lobby/games');
      logger.debug('LOBBY', 'Active games retrieved', { count: response.data?.length });
      return response.data;
    } catch (error) {
      logger.error('LOBBY', 'Failed to fetch active games', error);
      throw error;
    }
  },

  async leaveGame(gameId: string) {
    logger.info('GAME', 'Leaving game', { gameId });
    try {
      const response = await api.post(`/api/games/${gameId}/leave`);
      logger.info('GAME', 'Left game successfully', { gameId });
      return response.data;
    } catch (error) {
      logger.error('GAME', 'Failed to leave game', { gameId, error });
      throw error;
    }
  },
};

export const usersAPI = {
  async getUsers() {
    logger.debug('USER', 'Fetching users list');
    try {
      const response = await api.get('/api/users');
      logger.debug('USER', 'Users list retrieved', { count: response.data?.length });
      return response.data;
    } catch (error) {
      logger.error('USER', 'Failed to fetch users list', error);
      throw error;
    }
  },

  async getUser(userId: string) {
    logger.debug('USER', 'Fetching user profile', { userId });
    try {
      const response = await api.get(`/api/users/${userId}`);
      logger.debug('USER', 'User profile retrieved', { userId });
      return response.data;
    } catch (error) {
      logger.error('USER', 'Failed to fetch user profile', { userId, error });
      throw error;
    }
  },

  async updateProfile(userData: Partial<User>) {
    logger.info('USER', 'Updating user profile', { userId: userData.id });
    try {
      const response = await api.put('/api/users/me', userData);
      logger.info('USER', 'Profile updated successfully', { userId: userData.id });
      return response.data;
    } catch (error) {
      logger.error('USER', 'Failed to update profile', { userId: userData.id, error });
      throw error;
    }
  },

  async getOnlinePlayers() {
    logger.debug('LOBBY', 'Fetching online players');
    try {
      const response = await api.get('/api/lobby/players');
      logger.debug('LOBBY', 'Online players retrieved', { count: response.data?.length });
      return response.data;
    } catch (error) {
      logger.error('LOBBY', 'Failed to fetch online players', error);
      throw error;
    }
  },

  async getGameHistory() {
    logger.debug('USER', 'Fetching game history');
    try {
      const response = await api.get('/api/users/me/games');
      logger.debug('USER', 'Game history retrieved', { count: response.data?.length });
      return response.data;
    } catch (error) {
      logger.error('USER', 'Failed to fetch game history', error);
      throw error;
    }
  },
};

export default api;
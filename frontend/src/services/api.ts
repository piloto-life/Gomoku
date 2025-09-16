import axios, { AxiosResponse } from 'axios';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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
      winRate: backendUser.stats.games_played > 0 
        ? Math.round((backendUser.stats.games_won / backendUser.stats.games_played) * 100)
        : 0,
    },
    createdAt: new Date(backendUser.created_at),
    lastSeen: backendUser.last_login ? new Date(backendUser.last_login) : new Date(),
  };
}

export const authAPI = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<LoginResponse> = await api.post('/api/auth/login', credentials);
    return {
      user: mapBackendUserToFrontend(response.data.user),
      token: response.data.access_token,
      refreshToken: '', // Backend doesn't return refresh token yet
    };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const registerRequest: RegisterRequest = {
      username: data.email.split('@')[0], // Use email prefix as username for now
      email: data.email,
      password: data.password,
      name: data.name,
      age: data.age,
      city: data.location?.city || '',
      state: data.location?.state || '',
      country: data.location?.country || '',
    };

    const response: AxiosResponse<LoginResponse> = await api.post('/api/auth/register', registerRequest);
    return {
      user: mapBackendUserToFrontend(response.data.user),
      token: response.data.access_token,
      refreshToken: '', // Backend doesn't return refresh token yet
    };
  },

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<LoginResponse['user']> = await api.get('/api/auth/me');
    return mapBackendUserToFrontend(response.data);
  },

  async validateToken(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  },
};

export const gamesAPI = {
  async createGame(gameMode: string, difficulty?: string) {
    const response = await api.post('/api/games/create', {
      mode: gameMode,
      difficulty: difficulty
    });
    return response.data;
  },

  async getGames() {
    const response = await api.get('/api/games');
    return response.data;
  },

  async getGame(gameId: string) {
    const response = await api.get(`/api/games/${gameId}`);
    return response.data;
  },

  async makeMove(gameId: string, position: { row: number; col: number }) {
    const response = await api.post(`/api/games/${gameId}/move`, position);
    return response.data;
  },
};

export const usersAPI = {
  async getUsers() {
    const response = await api.get('/api/users');
    return response.data;
  },

  async getUser(userId: string) {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  async updateProfile(userData: Partial<User>) {
    const response = await api.put('/api/users/profile', userData);
    return response.data;
  },
};

export default api;
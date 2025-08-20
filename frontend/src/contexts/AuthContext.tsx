import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthResponse }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // TODO: Validate token and get user info
      // For now, we'll use mock data
      const mockUser: User = {
        id: '1',
        name: 'Player 1',
        email: 'player1@example.com',
        stats: {
          gamesPlayed: 10,
          gamesWon: 7,
          gamesLost: 3,
          rating: 1200,
          winRate: 70,
        },
        createdAt: new Date(),
        lastSeen: new Date(),
      };
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: mockUser, token, refreshToken: '' }
      });
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      // TODO: Replace with real API call
      // const response = await authAPI.login(credentials);
      
      // Mock response for development
      const mockResponse: AuthResponse = {
        user: {
          id: '1',
          name: 'Player 1',
          email: credentials.email,
          stats: {
            gamesPlayed: 10,
            gamesWon: 7,
            gamesLost: 3,
            rating: 1200,
            winRate: 70,
          },
          createdAt: new Date(),
          lastSeen: new Date(),
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      };

      localStorage.setItem('token', mockResponse.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: mockResponse });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: 'Login failed' });
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      // TODO: Replace with real API call
      // const response = await authAPI.register(data);
      
      // Mock response for development
      const mockResponse: AuthResponse = {
        user: {
          id: '2',
          name: data.name,
          email: data.email,
          age: data.age,
          location: data.location,
          stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            rating: 1000,
            winRate: 0,
          },
          createdAt: new Date(),
          lastSeen: new Date(),
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      };

      localStorage.setItem('token', mockResponse.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: mockResponse });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: 'Registration failed' });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';
import { authAPI } from '../services/api';
import logger from '../utils/logger';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (user: User) => void;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthResponse }
  | { type: 'AUTH_FINISH_INIT' }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true, // Start as true to indicate initial loading
  isInitializing: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      logger.debug('AUTH_CONTEXT', 'Auth operation started');
      return { ...state, isLoading: true, error: null };
    case 'AUTH_FINISH_INIT':
      logger.debug('AUTH_CONTEXT', 'Auth initialization finished');
      return { ...state, isInitializing: false, isLoading: false };
    case 'AUTH_SUCCESS':
      logger.info('AUTH_CONTEXT', 'Authentication successful', { userId: action.payload.user.id });
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      logger.error('AUTH_CONTEXT', 'Authentication error', { error: action.payload });
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      logger.info('AUTH_CONTEXT', 'User logged out');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      logger.debug('AUTH_CONTEXT', 'Auth error cleared');
      return { ...state, error: null };
    case 'UPDATE_USER':
      logger.info('AUTH_CONTEXT', 'User data updated', { userId: action.payload.id });
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    logger.info('AUTH_CONTEXT', 'AuthProvider initializing', { hasToken: !!token });
    
    if (token) {
      // On startup, if a token exists, validate it by fetching the user
      logger.debug('AUTH_CONTEXT', 'Validating existing token');
      dispatch({ type: 'AUTH_START' });
      authAPI.getCurrentUser()
        .then((user) => {
          logger.info('AUTH_CONTEXT', 'Token validation successful', { userId: user.id });
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token, refreshToken: '' },
          });
        })
        .catch((error) => {
          logger.warn('AUTH_CONTEXT', 'Token validation failed, removing token', { error });
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        })
        .finally(() => {
          dispatch({ type: 'AUTH_FINISH_INIT' });
        });
    } else {
      dispatch({ type: 'AUTH_FINISH_INIT' });
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.login(credentials);
      localStorage.setItem('token', response.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: response });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.register(data);
      localStorage.setItem('token', response.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: response });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        updateUser,
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

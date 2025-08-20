// Game Types
export interface Position {
  row: number;
  col: number;
}

export interface Move {
  id: string;
  position: Position;
  playerId: string;
  timestamp: Date;
  piece: 'black' | 'white';
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  age?: number;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  isOnline: boolean;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
}

export interface GameState {
  id: string;
  board: (string | null)[][];
  currentPlayer: 'black' | 'white';
  players: {
    black: Player;
    white: Player;
  };
  moves: Move[];
  status: 'waiting' | 'active' | 'finished' | 'paused';
  winner?: 'black' | 'white' | 'draw';
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  age?: number;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    rating: number;
    winRate: number;
  };
  createdAt: Date;
  lastSeen: Date;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  age?: number;
  location?: {
    city: string;
    state: string;
    country: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'game' | 'lobby' | 'private';
}

// Lobby Types
export interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  status: 'waiting' | 'full' | 'playing';
  gameMode: 'pvp' | 'pve';
  createdAt: Date;
}

// Video/Recording Types
export interface GameRecording {
  id: string;
  gameId: string;
  url: string;
  duration: number;
  size: number;
  format: 'webm' | 'mp4';
  createdAt: Date;
  expiresAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// WebSocket Types
export interface WSMessage {
  type: 'move' | 'chat' | 'game_update' | 'player_join' | 'player_leave' | 'game_end';
  data: any;
  timestamp: Date;
}

// Theme Types
export type Theme = 'light' | 'dark';

// Game Settings
export interface GameSettings {
  theme: Theme;
  soundEnabled: boolean;
  videoChatEnabled: boolean;
  chatEnabled: boolean;
  boardSize: 19; // Gomoku standard
}

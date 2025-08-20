import React, { createContext, useContext, useReducer } from 'react';
import { GameState, Move, Position, Player, GameSettings } from '../types';

interface GameContextType {
  gameState: GameState | null;
  settings: GameSettings;
  isConnected: boolean;
  makeMove: (position: Position) => void;
  joinGame: (gameId: string) => void;
  createGame: (gameMode: 'pvp' | 'pve') => void;
  leaveGame: () => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
}

type GameAction =
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'ADD_MOVE'; payload: Move }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'RESET_GAME' };

const initialSettings: GameSettings = {
  theme: 'light',
  soundEnabled: true,
  videoChatEnabled: false,
  chatEnabled: true,
  boardSize: 19,
};

interface GameContextState {
  gameState: GameState | null;
  settings: GameSettings;
  isConnected: boolean;
}

const initialState: GameContextState = {
  gameState: null,
  settings: initialSettings,
  isConnected: false,
};

const gameReducer = (state: GameContextState, action: GameAction): GameContextState => {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'ADD_MOVE':
      if (!state.gameState) return state;
      return {
        ...state,
        gameState: {
          ...state.gameState,
          moves: [...state.gameState.moves, action.payload],
          updatedAt: new Date(),
        },
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case 'SET_CONNECTION':
      return { ...state, isConnected: action.payload };
    case 'RESET_GAME':
      return { ...state, gameState: null };
    default:
      return state;
  }
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Mock players for development
  const mockPlayer1: Player = {
    id: '1',
    name: 'Player 1',
    isOnline: true,
    rating: 1200,
    gamesPlayed: 10,
    gamesWon: 7,
  };

  const mockPlayer2: Player = {
    id: '2',
    name: 'AI Bot',
    isOnline: true,
    rating: 1000,
    gamesPlayed: 100,
    gamesWon: 60,
  };

  const createEmptyBoard = (): (string | null)[][] => {
    return Array(19).fill(null).map(() => Array(19).fill(null));
  };

  const makeMove = (position: Position) => {
    if (!state.gameState || state.gameState.status !== 'active') return;

    const { row, col } = position;
    const board = state.gameState.board;

    // Check if position is valid and empty
    if (row < 0 || row >= 19 || col < 0 || col >= 19 || board[row][col] !== null) {
      return;
    }

    const move: Move = {
      id: Date.now().toString(),
      position,
      playerId: state.gameState.currentPlayer === 'black' ? state.gameState.players.black.id : state.gameState.players.white.id,
      timestamp: new Date(),
      piece: state.gameState.currentPlayer,
    };

    // Update board
    const newBoard = board.map((row, rowIndex) =>
      row.map((cell, colIndex) =>
        rowIndex === position.row && colIndex === position.col
          ? state.gameState!.currentPlayer
          : cell
      )
    );

    // Check for win condition (simplified - just check if we have 5 in a row)
    const isWinner = checkWinCondition(newBoard, position, state.gameState.currentPlayer);

    const newGameState: GameState = {
      ...state.gameState,
      board: newBoard,
      moves: [...state.gameState.moves, move],
      currentPlayer: state.gameState.currentPlayer === 'black' ? 'white' : 'black',
      status: isWinner ? 'finished' : 'active',
      winner: isWinner ? state.gameState.currentPlayer : undefined,
      updatedAt: new Date(),
    };

    dispatch({ type: 'SET_GAME_STATE', payload: newGameState });
  };

  const checkWinCondition = (board: (string | null)[][], lastMove: Position, piece: string): boolean => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal
      [1, -1],  // anti-diagonal
    ];

    for (const [dx, dy] of directions) {
      let count = 1;
      
      // Check positive direction
      for (let i = 1; i < 5; i++) {
        const newRow = lastMove.row + dx * i;
        const newCol = lastMove.col + dy * i;
        if (newRow >= 0 && newRow < 19 && newCol >= 0 && newCol < 19 && board[newRow][newCol] === piece) {
          count++;
        } else {
          break;
        }
      }
      
      // Check negative direction
      for (let i = 1; i < 5; i++) {
        const newRow = lastMove.row - dx * i;
        const newCol = lastMove.col - dy * i;
        if (newRow >= 0 && newRow < 19 && newCol >= 0 && newCol < 19 && board[newRow][newCol] === piece) {
          count++;
        } else {
          break;
        }
      }
      
      if (count >= 5) {
        return true;
      }
    }
    
    return false;
  };

  const joinGame = (gameId: string) => {
    // TODO: Implement WebSocket connection to join game
    console.log('Joining game:', gameId);
    dispatch({ type: 'SET_CONNECTION', payload: true });
  };

  const createGame = (gameMode: 'pvp' | 'pve') => {
    const newGameState: GameState = {
      id: Date.now().toString(),
      board: createEmptyBoard(),
      currentPlayer: 'black',
      players: {
        black: mockPlayer1,
        white: gameMode === 'pve' ? mockPlayer2 : { ...mockPlayer1, id: '3', name: 'Player 2' },
      },
      moves: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'SET_GAME_STATE', payload: newGameState });
    dispatch({ type: 'SET_CONNECTION', payload: true });
  };

  const leaveGame = () => {
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_CONNECTION', payload: false });
  };

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  };

  return (
    <GameContext.Provider
      value={{
        gameState: state.gameState,
        settings: state.settings,
        isConnected: state.isConnected,
        makeMove,
        joinGame,
        createGame,
        leaveGame,
        updateSettings,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { GameState, Move, Position, Player, GameSettings } from '../types';
import { gamesAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useGameWebSocket } from '../hooks/useGameWebSocket';

interface GameContextType {
  gameState: GameState | null;
  gameMode: 'pvp-local' | 'pvp-online' | 'pve' | null;
  settings: GameSettings;
  isConnected: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  makeMove: (position: Position) => void;
  joinGame: (gameId: string) => void;
  loadGame: (gameId: string) => void;
  createGame: (gameMode: 'pvp-local' | 'pvp-online' | 'pve', difficulty?: 'easy' | 'medium' | 'hard') => Promise<void>;
  leaveGame: () => Promise<void>;
  updateSettings: (settings: Partial<GameSettings>) => void;
  setAiDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

type GameAction =
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'SET_GAME_MODE'; payload: 'pvp-local' | 'pvp-online' | 'pve' | null }
  | { type: 'ADD_MOVE'; payload: Move }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'SET_AI_DIFFICULTY'; payload: 'easy' | 'medium' | 'hard' }
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
  gameMode: 'pvp-local' | 'pvp-online' | 'pve' | null;
  settings: GameSettings;
  isConnected: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
}

const initialState: GameContextState = {
  gameState: null,
  gameMode: null,
  settings: initialSettings,
  isConnected: false,
  aiDifficulty: 'medium',
};

const gameReducer = (state: GameContextState, action: GameAction): GameContextState => {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { 
        ...state, 
        gameState: action.payload,
        gameMode: action.payload.gameMode || null
      };
    case 'SET_GAME_MODE':
      return { ...state, gameMode: action.payload };
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
    case 'SET_AI_DIFFICULTY':
      return { ...state, aiDifficulty: action.payload };
    case 'RESET_GAME':
      return { ...state, gameState: null, gameMode: null };
    default:
      return state;
  }
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { user } = useAuth();

  // Mock players for development
  const mockPlayer1: Player = {
    id: '1',
    name: 'Player 1',
    isOnline: true,
    rating: 1200,
    gamesPlayed: 10,
    gamesWon: 7,
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

    // For PvE mode, don't allow moves when it's AI's turn
    if (state.gameState.gameMode === 'pve' && 
        state.gameState.currentPlayer === 'white' && 
        state.gameState.players.white.id === 'ai') {
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
    const newBoard = board.map((row: (string | null)[], rowIndex: number) =>
      row.map((cell: string | null, colIndex: number) =>
        rowIndex === position.row && colIndex === position.col
          ? state.gameState!.currentPlayer
          : cell
      )
    );

    // Check for win condition
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

    // Handle AI move for PvE mode
    if (state.gameState.gameMode === 'pve' && 
        !isWinner && 
        newGameState.currentPlayer === 'white' && 
        newGameState.players.white.id === 'ai') {
      
      // Simulate AI thinking time
      setTimeout(() => {
        makeAIMove(newGameState);
      }, 500 + Math.random() * 1000); // Random delay between 0.5-1.5 seconds
    }

    // For online PvP, send move via WebSocket
    if (state.gameState.gameMode === 'pvp-online' && state.isConnected) {
      // TODO: Send move via WebSocket
      console.log('Sending move via WebSocket:', move);
    }
  };

  // Simple AI move logic (client-side for demo)
  const makeAIMove = (gameState: GameState) => {
    const board = gameState.board;
    const aiMoves = getAvailableMoves(board);
    
    if (aiMoves.length === 0) return;

    // Simple AI strategy based on difficulty
    let aiMove: Position;
    
    switch (state.aiDifficulty) {
      case 'easy':
        // Random move
        aiMove = aiMoves[Math.floor(Math.random() * aiMoves.length)];
        break;
        
      case 'medium':
        // Try to block or win, otherwise random
        aiMove = findStrategicMove(board, aiMoves) || aiMoves[Math.floor(Math.random() * aiMoves.length)];
        break;
        
      case 'hard':
        // More sophisticated strategy (for now, same as medium)
        aiMove = findStrategicMove(board, aiMoves) || getCenterBiasedMove(board, aiMoves);
        break;
        
      default:
        aiMove = aiMoves[Math.floor(Math.random() * aiMoves.length)];
    }

    // Make the AI move
    const aiMoveData: Move = {
      id: Date.now().toString(),
      position: aiMove,
      playerId: 'ai',
      timestamp: new Date(),
      piece: 'white',
    };

    const newBoard = board.map((row, rowIndex) =>
      row.map((cell, colIndex) =>
        rowIndex === aiMove.row && colIndex === aiMove.col ? 'white' : cell
      )
    );

    const isWinner = checkWinCondition(newBoard, aiMove, 'white');

    const updatedGameState: GameState = {
      ...gameState,
      board: newBoard,
      moves: [...gameState.moves, aiMoveData],
      currentPlayer: 'black',
      status: isWinner ? 'finished' : 'active',
      winner: isWinner ? 'white' : undefined,
      updatedAt: new Date(),
    };

    dispatch({ type: 'SET_GAME_STATE', payload: updatedGameState });
  };

  const getAvailableMoves = (board: (string | null)[][]): Position[] => {
    const moves: Position[] = [];
    for (let row = 0; row < 19; row++) {
      for (let col = 0; col < 19; col++) {
        if (board[row][col] === null) {
          moves.push({ row, col });
        }
      }
    }
    return moves;
  };

  const findStrategicMove = (board: (string | null)[][], availableMoves: Position[]): Position | null => {
    // Check for winning moves first (AI can win)
    for (const move of availableMoves) {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = 'white';
      if (checkWinCondition(testBoard, move, 'white')) {
        return move;
      }
    }

    // Check for blocking moves (prevent human from winning)
    for (const move of availableMoves) {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = 'black';
      if (checkWinCondition(testBoard, move, 'black')) {
        return move; // Block this winning move
      }
    }

    return null;
  };

  const getCenterBiasedMove = (board: (string | null)[][], availableMoves: Position[]): Position => {
    const center = 9; // Center of 19x19 board
    
    // Prefer moves closer to center
    availableMoves.sort((a, b) => {
      const distA = Math.abs(a.row - center) + Math.abs(a.col - center);
      const distB = Math.abs(b.row - center) + Math.abs(b.col - center);
      return distA - distB;
    });
    
    return availableMoves[0];
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
    // TODO: Implement join game logic with WebSocket
    console.log('Joining game:', gameId);
  };

  const loadGame = useCallback(async (gameId: string) => {
    try {
      const gameData = await gamesAPI.getGame(gameId);
      // This mapping logic can be complex, ensure it matches your backend response
      const loadedGameState: GameState = {
        id: gameData.id,
        board: gameData.board,
        currentPlayer: gameData.current_player,
        gameMode: gameData.mode,
        players: {
          black: gameData.players.black, // Assuming backend sends compatible player objects
          white: gameData.players.white,
        },
        moves: gameData.moves || [],
        status: gameData.status,
        winner: gameData.winner,
        createdAt: new Date(gameData.created_at),
        updatedAt: new Date(gameData.updated_at),
      };
      dispatch({ type: 'SET_GAME_STATE', payload: loadedGameState });
    } catch (error) {
      console.error('Failed to load game:', error);
      // Optionally, handle the error in the UI
    }
  }, []);

  const createGame = async (gameMode: 'pvp-local' | 'pvp-online' | 'pve', difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    try {
      // For online games, use the backend API
      if (gameMode === 'pvp-online' || gameMode === 'pve') {
        const gameData = await gamesAPI.createGame(gameMode, difficulty);
        
        // Convert backend game data to frontend format
        const newGameState: GameState = {
          id: gameData.id,
          board: Array(19).fill(null).map(() => Array(19).fill(null)),
          currentPlayer: 'black',
          gameMode: gameMode,
          players: {
            black: user ? { id: user.id, name: user.name, isOnline: true, rating: user.stats.rating, gamesPlayed: user.stats.gamesPlayed, gamesWon: user.stats.gamesWon } : mockPlayer1,
            white: gameMode === 'pve' ? {
              id: 'ai',
              name: `AI Bot (${difficulty})`,
              isOnline: true,
              rating: difficulty === 'easy' ? 800 : difficulty === 'medium' ? 1200 : 1600,
              gamesPlayed: 100,
              gamesWon: 60,
            } : {} as Player // The second player will join via WebSocket
          },
          moves: [],
          status: 'waiting',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        dispatch({ type: 'SET_GAME_STATE', payload: newGameState });
        return;
      }
    } catch (error) {
      console.error('Failed to create game:', error);
      // Fall back to local game creation
    }

    // Local game creation (fallback or for pvp-local)
    const aiPlayer: Player = {
      id: 'ai',
      name: `AI Bot (${difficulty})`,
      isOnline: true,
      rating: difficulty === 'easy' ? 800 : difficulty === 'medium' ? 1200 : 1600,
      gamesPlayed: 100,
      gamesWon: 60,
    };

    const player2: Player = {
      id: '2',
      name: gameMode === 'pvp-local' ? 'Player 2 (Local)' : 'Player 2 (Online)',
      isOnline: true,
      rating: 1200,
      gamesPlayed: 15,
      gamesWon: 8,
    };

    let whitePlayer: Player;
    let actualGameMode: string;

    switch (gameMode) {
      case 'pve':
        whitePlayer = aiPlayer;
        actualGameMode = 'pve';
        break;
      case 'pvp-local':
        whitePlayer = { ...player2, name: 'Player 2 (Local)' };
        actualGameMode = 'pvp-local';
        break;
      case 'pvp-online':
        whitePlayer = { ...player2, name: 'Player 2 (Online)' };
        actualGameMode = 'pvp-online';
        break;
      default:
        whitePlayer = aiPlayer;
        actualGameMode = 'pve';
    }

    const newGameState: GameState = {
      id: Date.now().toString(),
      board: createEmptyBoard(),
      currentPlayer: 'black',
      gameMode: actualGameMode as any,
      players: {
        black: mockPlayer1,
        white: whitePlayer,
      },
      moves: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'SET_GAME_STATE', payload: newGameState });
    dispatch({ type: 'SET_AI_DIFFICULTY', payload: difficulty });
    
    // Set connection status based on game mode
    if (gameMode === 'pvp-online') {
      dispatch({ type: 'SET_CONNECTION', payload: true });
      // TODO: Connect to WebSocket for online play
      console.log('Creating online game, connecting to WebSocket...');
    } else {
      dispatch({ type: 'SET_CONNECTION', payload: false });
    }
    
    console.log('Game created with mode:', gameMode, 'difficulty:', difficulty);
  };

  const setAiDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
    dispatch({ type: 'SET_AI_DIFFICULTY', payload: difficulty });
    
    // Update AI player name in game state if it exists
    if (state.gameState && state.gameState.gameMode === 'pve') {
      const updatedGameState = {
        ...state.gameState,
        players: {
          ...state.gameState.players,
          white: {
            ...state.gameState.players.white,
            name: `AI Bot (${difficulty})`,
            rating: difficulty === 'easy' ? 800 : difficulty === 'medium' ? 1200 : 1600,
          }
        }
      };
      dispatch({ type: 'SET_GAME_STATE', payload: updatedGameState });
    }
    
    console.log('AI difficulty set to:', difficulty);
  };

  const leaveGame = async () => {
    if (state.gameState && state.gameMode === 'pvp-online') {
      try {
        await gamesAPI.leaveGame(state.gameState.id);
      } catch (error) {
        console.error('Failed to notify backend of leaving game:', error);
      }
    }
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
        gameMode: state.gameMode,
        settings: state.settings,
        isConnected: state.isConnected,
        aiDifficulty: state.aiDifficulty,
        makeMove,
        joinGame,
        loadGame,
        createGame,
        leaveGame,
        updateSettings,
        setAiDifficulty,
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

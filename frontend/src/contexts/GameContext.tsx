import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { GameState, Move, Position, Player, GameSettings } from '../types';
import { gamesAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useGameWebSocket } from '../hooks/useGameWebSocket';
import logger from '../utils/logger';

interface GameContextType {
  gameState: GameState | null;
  gameMode: 'pvp-local' | 'pvp-online' | 'pve' | null;
  settings: GameSettings;
  isConnected: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  makeMove: (position: Position) => void;
  joinGame: (gameId: string) => void;
  loadGame: (gameId: string) => void;
  createGame: (
    gameMode: 'pvp-local' | 'pvp-online' | 'pve', 
    difficulty?: 'easy' | 'medium' | 'hard'
  ) => Promise<{ success: true; gameId: string; gameMode: 'pvp-local' | 'pvp-online' | 'pve'; status: GameState['status'] } | undefined>;
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

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
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

  // Enhanced AI move logic for PvE mode
  const makeAIMove = (gameState: GameState) => {
    const board = gameState.board;
    const aiMoves = getAvailableMoves(board);
    
    if (aiMoves.length === 0) {
      logger.warn('GAME', 'No available moves for AI');
      return;
    }

    // Enhanced AI strategy based on difficulty
    let aiMove: Position;
    
    logger.debug('GAME', 'AI calculating move', { 
      difficulty: state.aiDifficulty, 
      availableMoves: aiMoves.length 
    });
    
    switch (state.aiDifficulty) {
      case 'easy':
        // Random move with slight center preference
        if (Math.random() < 0.3 && aiMoves.length > 1) {
          aiMove = getCenterBiasedMove(board, aiMoves);
        } else {
          aiMove = aiMoves[Math.floor(Math.random() * aiMoves.length)];
        }
        break;
        
      case 'medium':
        // Try to win, then block, then center-biased random
        aiMove = findWinningMove(board, aiMoves, 'white') || 
                 findBlockingMove(board, aiMoves, 'black') ||
                 getCenterBiasedMove(board, aiMoves);
        break;
        
      case 'hard':
        // Advanced strategy: win > block > threat > center
        aiMove = findWinningMove(board, aiMoves, 'white') ||
                 findBlockingMove(board, aiMoves, 'black') ||
                 findThreatMove(board, aiMoves, 'white') ||
                 getCenterBiasedMove(board, aiMoves);
        break;
        
      default:
        aiMove = getCenterBiasedMove(board, aiMoves);
    }

    logger.info('GAME', 'AI making move', { 
      position: aiMove, 
      difficulty: state.aiDifficulty 
    });

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
    
    if (isWinner) {
      logger.info('GAME', 'AI won the game', { 
        difficulty: state.aiDifficulty, 
        moveCount: updatedGameState.moves.length 
      });
    }
  };

  // Helper function to find winning moves
  const findWinningMove = (board: (string | null)[][], availableMoves: Position[], piece: string): Position | null => {
    for (const move of availableMoves) {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = piece;
      if (checkWinCondition(testBoard, move, piece)) {
        return move;
      }
    }
    return null;
  };

  // Helper function to find blocking moves
  const findBlockingMove = (board: (string | null)[][], availableMoves: Position[], opponentPiece: string): Position | null => {
    for (const move of availableMoves) {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = opponentPiece;
      if (checkWinCondition(testBoard, move, opponentPiece)) {
        return move; // Block this winning move
      }
    }
    return null;
  };

  // Helper function to find threatening moves (create multiple threats)
  const findThreatMove = (board: (string | null)[][], availableMoves: Position[], piece: string): Position | null => {
    // Simple threat detection: look for moves that create 3 in a row
    for (const move of availableMoves) {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = piece;
      
      // Check if this creates a threat (3 in a row that can be extended)
      if (countConsecutive(testBoard, move, piece) >= 3) {
        return move;
      }
    }
    return null;
  };

  // Helper function to count consecutive pieces
  const countConsecutive = (board: (string | null)[][], position: Position, piece: string): number => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical  
      [1, 1],   // diagonal
      [1, -1],  // anti-diagonal
    ];

    let maxCount = 1;

    for (const [dx, dy] of directions) {
      let count = 1;
      
      // Check positive direction
      for (let i = 1; i < 5; i++) {
        const newRow = position.row + dx * i;
        const newCol = position.col + dy * i;
        if (newRow >= 0 && newRow < 19 && newCol >= 0 && newCol < 19 && board[newRow][newCol] === piece) {
          count++;
        } else {
          break;
        }
      }
      
      // Check negative direction
      for (let i = 1; i < 5; i++) {
        const newRow = position.row - dx * i;
        const newCol = position.col - dy * i;
        if (newRow >= 0 && newRow < 19 && newCol >= 0 && newCol < 19 && board[newRow][newCol] === piece) {
          count++;
        } else {
          break;
        }
      }
      
      maxCount = Math.max(maxCount, count);
    }

    return maxCount;
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

  const getCenterBiasedMove = (board: (string | null)[][], availableMoves: Position[]): Position => {
    const center = 9; // Center of 19x19 board
    
    // If center is available and no moves made yet, take it
    if (board[center][center] === null) {
      return { row: center, col: center };
    }
    
    // Prefer moves closer to center and existing pieces
    const scoredMoves = availableMoves.map(move => {
      const distanceToCenter = Math.abs(move.row - center) + Math.abs(move.col - center);
      const proximityScore = getProximityScore(board, move);
      
      // Lower distance and higher proximity is better
      return {
        move,
        score: proximityScore - (distanceToCenter * 0.1)
      };
    });
    
    // Sort by score (highest first) and return best move
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  };

  // Helper function to score move based on proximity to existing pieces
  const getProximityScore = (board: (string | null)[][], move: Position): number => {
    let score = 0;
    const radius = 2;
    
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const newRow = move.row + dr;
        const newCol = move.col + dc;
        
        if (newRow >= 0 && newRow < 19 && newCol >= 0 && newCol < 19) {
          if (board[newRow][newCol] !== null) {
            const distance = Math.abs(dr) + Math.abs(dc);
            score += 1 / (distance + 1); // Closer pieces contribute more
          }
        }
      }
    }
    
    return score;
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

  const createGame = async (
    gameMode: 'pvp-local' | 'pvp-online' | 'pve', 
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<{ success: true; gameId: string; gameMode: 'pvp-local' | 'pvp-online' | 'pve'; status: GameState['status'] } | undefined> => {
    try {
      logger.info('GAME', 'Creating game', { gameMode, difficulty });
      
      // For online games ONLY, use the backend API
      if (gameMode === 'pvp-online') {
        const gameData = await gamesAPI.createGame(gameMode, difficulty);
        logger.info('GAME', 'Backend game created successfully', { gameId: gameData.id, gameMode });
        
        // Convert backend game data to frontend format
        const newGameState: GameState = {
          id: gameData.id,
          board: Array(19).fill(null).map(() => Array(19).fill(null)),
          currentPlayer: 'black',
          gameMode: gameMode,
          players: {
            black: user ? { 
              id: user.id, 
              name: user.name, 
              isOnline: true, 
              rating: user.stats.rating, 
              gamesPlayed: user.stats.gamesPlayed, 
              gamesWon: user.stats.gamesWon 
            } : mockPlayer1,
            white: {} as Player // The second player will join via WebSocket
          },
          moves: [],
          status: 'waiting', // PvP waits for opponent
          createdAt: new Date(gameData.created_at),
          updatedAt: new Date(gameData.created_at),
        };

        dispatch({ type: 'SET_GAME_STATE', payload: newGameState });
        logger.info('GAME', 'Game state updated in context', { gameId: gameData.id });
        
        // Return game data with ID for navigation
        return { 
          success: true, 
          gameId: gameData.id, 
          gameMode,
          status: newGameState.status 
        };
      }

      // Local game creation (for pvp-local and PvE) - FIXED: All local games created client-side
      logger.info('GAME', 'Creating local game', { gameMode, difficulty });
      const gameId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const player1: Player = user ? { 
        id: user.id, 
        name: user.name, 
        isOnline: true, 
        rating: user.stats.rating, 
        gamesPlayed: user.stats.gamesPlayed, 
        gamesWon: user.stats.gamesWon 
      } : mockPlayer1;

      let player2: Player;
      
      if (gameMode === 'pve') {
        // AI player for PvE mode
        player2 = {
          id: 'ai',
          name: `AI Bot (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`,
          isOnline: true,
          rating: difficulty === 'easy' ? 800 : difficulty === 'medium' ? 1200 : 1600,
          gamesPlayed: 1000,
          gamesWon: difficulty === 'easy' ? 400 : difficulty === 'medium' ? 600 : 800,
        };
      } else {
        // Local human player for PvP Local
        player2 = {
          id: 'player2-local',
          name: 'Player 2 (Local)',
          isOnline: true,
          rating: 1200,
          gamesPlayed: 15,
          gamesWon: 8,
        };
      }

      const newGameState: GameState = {
        id: gameId,
        board: createEmptyBoard(),
        currentPlayer: 'black',
        gameMode: gameMode,
        players: {
          black: player1,
          white: player2,
        },
        moves: [],
        status: 'active', // Local games and PvE start immediately
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      dispatch({ type: 'SET_GAME_STATE', payload: newGameState });
      dispatch({ type: 'SET_CONNECTION', payload: false }); // Local games don't need connection
      
      logger.info('GAME', 'Local game created successfully', { 
        gameId, 
        gameMode, 
        difficulty: gameMode === 'pve' ? difficulty : 'N/A',
        aiPlayer: gameMode === 'pve' ? player2.name : 'N/A'
      });
      
      // Return game data with ID for navigation
      return { 
        success: true, 
        gameId: gameId, 
        gameMode: gameMode,
        status: newGameState.status 
      };
      
    } catch (error) {
      logger.error('GAME', 'Failed to create game', { gameMode, difficulty, error });
      throw error; // Re-throw to let caller handle
    }
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGameWebSocket } from '../hooks/useGameWebSocket';
import { GameState, Move, Position } from '../types';

export interface GameContextType {
  gameState: GameState | null;
  moves: Move[];
  chatMessages: any[];
  isConnected: boolean;
  error: string | null;
  makeMove: (position: Position) => boolean;
  sendChatMessage: (message: string) => boolean;
}

export const GameWebSocketContext = createContext<GameContextType | undefined>(
  undefined
);

export const useGame = () => {
  const context = useContext(GameWebSocketContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameWebSocketProvider');
  }
  return context;
};

interface GameWebSocketProviderProps {
  gameId: string;
  children: React.ReactNode;
  onGameUpdate?: (gameState: GameState) => void;
}

export const GameWebSocketProvider: React.FC<GameWebSocketProviderProps> = ({
  gameId,
  children,
  onGameUpdate
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    isConnected,
    connectionError,
    sendMove,
    sendChatMessage
  } = useGameWebSocket({
    gameId,
    onMove: (move) => {
      const newMove: Move = {
        id: Date.now().toString(),
        position: { row: move.row, col: move.col },
        playerId: move.player === 'black' ? 'player1' : 'player2',
        timestamp: new Date(),
        piece: move.player
      };
      setMoves(prev => [...prev, newMove]);
      if (gameState) {
        const newBoard = gameState.board.map((row, rowIndex) =>
          row.map((cell, colIndex) =>
            rowIndex === move.row && colIndex === move.col ? move.player : cell
          )
        );
        const updatedGameState: GameState = {
          ...gameState,
          board: newBoard,
          currentPlayer: move.next_player,
          moves: [...gameState.moves, newMove],
          updatedAt: new Date()
        };
        setGameState(updatedGameState);
        if (onGameUpdate) {
          onGameUpdate(updatedGameState);
        }
      }
    },
    onGameState: (state) => {
      const transformedState: GameState = {
        id: state.id,
        board: state.board,
        players: {
          black: {
            id: state.players?.black?.id || 'unknown',
            name: state.players?.black?.username || 'Player 1',
            isOnline: true,
            rating: 1200,
            gamesPlayed: 0,
            gamesWon: 0
          },
          white: state.players?.white ? {
            id: state.players.white.id,
            name: state.players.white.username || 'Player 2',
            isOnline: true,
            rating: 1200,
            gamesPlayed: 0,
            gamesWon: 0
          } : {
            id: 'ai',
            name: 'AI',
            isOnline: true,
            rating: 1500,
            gamesPlayed: 0,
            gamesWon: 0
          }
        },
        currentPlayer: state.current_player || 'black',
        status: state.status === 'active' ? 'active' : 'finished',
        gameMode: state.mode === 'pve' ? 'pve' : state.mode === 'pvp-online' ? 'pvp-online' : 'pvp-local',
        moves: state.moves?.map((move: any, index: number) => ({
          id: index.toString(),
          position: { row: move.row, col: move.col },
          playerId: move.player === 'black' ? state.players?.black?.id || 'unknown' : state.players?.white?.id || 'unknown',
          timestamp: new Date(move.timestamp || Date.now()),
          piece: move.player
        })) || [],
        winner: state.winner,
        createdAt: new Date(state.created_at || Date.now()),
        updatedAt: new Date(state.updated_at || Date.now())
      };
      setGameState(transformedState);
      if (onGameUpdate) {
        onGameUpdate(transformedState);
      }
    },
    onPlayerDisconnect: (playerId) => {
      setError(`Player ${playerId} disconnected`);
    },
    onChatMessage: (message) => {
      setChatMessages(prev => [...prev, message]);
    },
    onGameEnd: (data) => {
      if (gameState) {
        const updatedGameState = {
          ...gameState,
          status: 'finished' as const,
          winner: data.winner,
        };
        setGameState(updatedGameState);
        if (onGameUpdate) {
          onGameUpdate(updatedGameState);
        }
      }
      setError(`Game Over! ${data.message}`);
    },
    onError: (errorMessage) => {
      setError(errorMessage);
    }
  });

  const handleMove = (position: Position) => {
    if (!isConnected) {
      setError('Not connected to game server');
      return false;
    }
    return sendMove(position.row, position.col);
  };

  const handleChatMessage = (message: string) => {
    if (!isConnected) {
      return false;
    }
    return sendChatMessage(message);
  };

  useEffect(() => {
    if (connectionError) {
      setError(connectionError);
    } else if (isConnected) {
      setError(null);
    }
  }, [isConnected, connectionError]);

  const gameContextValue: GameContextType = {
    gameState,
    moves,
    chatMessages,
    isConnected,
    error,
    makeMove: handleMove,
    sendChatMessage: handleChatMessage
  };

  return (
    <GameWebSocketContext.Provider value={gameContextValue}>
      {children}
    </GameWebSocketContext.Provider>
  );
};

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface GameMove {
  row: number;
  col: number;
  player: 'black' | 'white';
  next_player: 'black' | 'white';
}

interface UseGameWebSocketProps {
  gameId: string;
  onMove?: (move: GameMove) => void;
  onGameState?: (state: any) => void;
  onPlayerDisconnect?: (playerId: string) => void;
  onChatMessage?: (message: any) => void;
  onError?: (error: string) => void;
}

export const useGameWebSocket = ({
  gameId,
  onMove,
  onGameState,
  onPlayerDisconnect,
  onChatMessage,
  onError
}: UseGameWebSocketProps) => {
  const { token } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!token || !gameId) {
      setConnectionError('Missing authentication token or game ID');
      return;
    }

    try {
      // Create WebSocket connection with authentication
      const wsUrl = `ws://localhost:8000/ws/game/${gameId}?token=${encodeURIComponent(token)}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log(`Connected to game ${gameId} WebSocket`);
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('WebSocket connection confirmed:', message.message);
              break;
              
            case 'game_state':
              console.log('Received game state:', message.state);
              if (onGameState) {
                onGameState(message.state);
              }
              break;
              
            case 'player_move':
              console.log('Received player move:', message.move);
              if (onMove) {
                onMove(message.move);
              }
              break;
              
            case 'chat_message':
              console.log('Received chat message:', message.data);
              if (onChatMessage) {
                onChatMessage(message.data);
              }
              break;
              
            case 'player_disconnected':
              console.log('Player disconnected:', message.data);
              if (onPlayerDisconnect) {
                onPlayerDisconnect(message.data.user_id);
              }
              break;
              
            case 'error':
              console.error('WebSocket error:', message.message);
              if (onError) {
                onError(message.message);
              }
              break;
              
            case 'pong':
              // Handle ping/pong for connection health
              break;
              
            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log(`Disconnected from game ${gameId} WebSocket:`, event.code, event.reason);
        setIsConnected(false);
        
        // Try to reconnect after a delay if it wasn't a clean close
        if (event.code !== 1000) {
          setTimeout(() => {
            if (ws.current?.readyState === WebSocket.CLOSED) {
              connect();
            }
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
        if (onError) {
          onError('Connection error');
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to create connection');
    }
  }, [gameId, token, onMove, onGameState, onPlayerDisconnect, onChatMessage, onError]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close(1000, 'User disconnect');
      ws.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMove = useCallback((row: number, col: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'move',
        row,
        col
      };
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const sendChatMessage = useCallback((message: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const chatMessage = {
        type: 'chat',
        message
      };
      ws.current.send(JSON.stringify(chatMessage));
      return true;
    }
    return false;
  }, []);

  const sendPing = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  // Auto-connect when component mounts and dependencies change
  useEffect(() => {
    if (gameId && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [gameId, token, connect, disconnect]);

  // Ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (isConnected) {
      const pingInterval = setInterval(sendPing, 30000);
      return () => clearInterval(pingInterval);
    }
  }, [isConnected, sendPing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMove,
    sendChatMessage,
    sendPing
  };
};
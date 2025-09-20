import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

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
  onGameEnd?: (data: any) => void;
  onError?: (error: string) => void;
}

export const useGameWebSocket = ({
  gameId,
  onMove,
  onGameState,
  onPlayerDisconnect,
  onChatMessage,
  onGameEnd,
  onError
}: UseGameWebSocketProps) => {
  const { token } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!token || !gameId) {
      const errorMsg = 'Missing authentication token or game ID';
      setConnectionError(errorMsg);
      logger.error('WEBSOCKET', errorMsg, { gameId, hasToken: !!token });
      return;
    }

    try {
      // Create WebSocket connection with authentication
      const wsBaseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
      const wsUrl = `${wsBaseUrl}/ws/game/${gameId}?token=${encodeURIComponent(token)}`;
      
      logger.websocketConnect(wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        logger.info('WEBSOCKET', `Connected to game ${gameId} WebSocket`, { gameId, wsUrl });
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Log received message
          logger.websocketMessage('RECEIVE', message.type, message);
          
          switch (message.type) {
            case 'connected':
              logger.info('WEBSOCKET', 'WebSocket connection confirmed', { message: message.message, gameId });
              break;
              
            case 'game_state':
              logger.debug('WEBSOCKET', 'Received game state', { gameId, state: message.state });
              if (onGameState) {
                onGameState(message.state);
              }
              break;
              
            case 'player_move':
              logger.info('WEBSOCKET', 'Received player move', { gameId, move: message.move });
              if (onMove) {
                onMove(message.move);
              }
              break;
              
            case 'chat_message':
              logger.debug('WEBSOCKET', 'Received chat message', { gameId, data: message.data });
              if (onChatMessage) {
                onChatMessage(message.data);
              }
              break;
              
            case 'player_disconnected':
              logger.warn('WEBSOCKET', 'Player disconnected', { gameId, data: message.data });
              if (onPlayerDisconnect) {
                onPlayerDisconnect(message.data.user_id);
              }
              break;
              
            case 'error':
              logger.error('WEBSOCKET', 'WebSocket error message', { gameId, message: message.message });
              if (onError) {
                onError(message.message);
              }
              break;
              
            case 'game_end':
              logger.info('WEBSOCKET', 'Received game end event', { gameId, data: message.data });
              if (onGameEnd) {
                onGameEnd(message.data);
              }
              break;

            case 'pong':
              // Handle ping/pong for connection health
              logger.debug('WEBSOCKET', 'Received pong', { gameId });
              break;
              
            default:
              logger.warn('WEBSOCKET', 'Unknown WebSocket message type', { gameId, type: message.type });
          }
        } catch (error) {
          logger.error('WEBSOCKET', 'Error parsing WebSocket message', { gameId, error, rawData: event.data });
        }
      };

      ws.current.onclose = (event) => {
        logger.warn('WEBSOCKET', `Disconnected from game ${gameId} WebSocket`, { 
          gameId, 
          code: event.code, 
          reason: event.reason,
          wasClean: event.wasClean 
        });
        setIsConnected(false);
        
        // Try to reconnect after a delay if it wasn't a clean close
        if (event.code !== 1000) {
          logger.info('WEBSOCKET', 'Attempting to reconnect in 3 seconds', { gameId });
          setTimeout(() => {
            if (ws.current?.readyState === WebSocket.CLOSED) {
              connect();
            }
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        logger.websocketError('WebSocket connection error', wsUrl);
        setConnectionError('WebSocket connection error');
        if (onError) {
          onError('Connection error');
        }
      };

    } catch (error) {
      logger.error('WEBSOCKET', 'Failed to create WebSocket connection', { gameId, error });
      setConnectionError('Failed to create connection');
    }
  }, [gameId, token, onMove, onGameState, onPlayerDisconnect, onChatMessage, onGameEnd, onError]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      logger.info('WEBSOCKET', 'Manually disconnecting WebSocket', { gameId });
      ws.current.close(1000, 'User disconnect');
      ws.current = null;
      setIsConnected(false);
    }
  }, [gameId]);

  const sendMove = useCallback((row: number, col: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'move',
        row,
        col
      };
      logger.websocketMessage('SEND', 'move', { gameId, row, col });
      ws.current.send(JSON.stringify(message));
      return true;
    } else {
      logger.warn('WEBSOCKET', 'Cannot send move - WebSocket not connected', { gameId, row, col });
      return false;
    }
  }, [gameId]);

  const sendChatMessage = useCallback((message: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const chatMessage = {
        type: 'chat',
        message
      };
      logger.websocketMessage('SEND', 'chat', { gameId, message });
      ws.current.send(JSON.stringify(chatMessage));
      return true;
    } else {
      logger.warn('WEBSOCKET', 'Cannot send chat message - WebSocket not connected', { gameId, message });
      return false;
    }
  }, [gameId]);

  const sendPing = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      logger.debug('WEBSOCKET', 'Sending ping', { gameId });
      ws.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, [gameId]);

  // Auto-connect when component mounts and dependencies change
  useEffect(() => {
    if (gameId && token) {
      logger.debug('WEBSOCKET', 'Auto-connecting WebSocket', { gameId });
      connect();
    }

    return () => {
      logger.debug('WEBSOCKET', 'Cleaning up WebSocket connection', { gameId });
      disconnect();
    };
  }, [gameId, token, connect, disconnect]);

  // Ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (isConnected) {
      logger.debug('WEBSOCKET', 'Setting up ping interval', { gameId });
      const pingInterval = setInterval(sendPing, 30000);
      return () => {
        logger.debug('WEBSOCKET', 'Clearing ping interval', { gameId });
        clearInterval(pingInterval);
      };
    }
  }, [isConnected, sendPing, gameId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logger.debug('WEBSOCKET', 'Component unmounting - disconnecting WebSocket', { gameId });
      disconnect();
    };
  }, [disconnect, gameId]);

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
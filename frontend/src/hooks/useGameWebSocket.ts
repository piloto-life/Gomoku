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
  
  // Track if component is actually being destroyed (not just StrictMode unmount)
  const isMountedRef = useRef(true);
  const isCleaningUpRef = useRef(false);

  // Keep latest handlers in a ref to avoid re-creating the connect function
  // and causing unwanted reconnects when parent re-renders.
  const handlersRef = useRef({
    onMove,
    onGameState,
    onPlayerDisconnect,
    onChatMessage,
    onGameEnd,
    onError
  });

  useEffect(() => {
    handlersRef.current = {
      onMove,
      onGameState,
      onPlayerDisconnect,
      onChatMessage,
      onGameEnd,
      onError
    };
  }, [onMove, onGameState, onPlayerDisconnect, onChatMessage, onGameEnd, onError]);

  // Flag to control whether the hook should attempt automatic reconnection
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (!token || !gameId) {
      const errorMsg = 'Missing authentication token or game ID';
      setConnectionError(errorMsg);
      logger.error('WEBSOCKET', errorMsg, { gameId, hasToken: !!token });
      return;
    }

    try {
      // Avoid creating multiple connections
      if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
        logger.debug('WEBSOCKET', 'WebSocket already connecting/connected', { gameId });
        return;
      }

      // Allow automatic reconnection unless explicitly disconnected
      shouldReconnectRef.current = true;

      // Create WebSocket connection with authentication
      const wsBaseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
      const wsUrl = `${wsBaseUrl}/ws/game/${gameId}?token=${encodeURIComponent(token)}`;
      
      logger.websocketConnect(wsUrl);
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        logger.info('WEBSOCKET', `Connected to game ${gameId} WebSocket`, { gameId, wsUrl });
        setIsConnected(true);
        setConnectionError(null);
      };

      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          // Log received message
          logger.websocketMessage('RECEIVE', message.type, message);

          // Use latest handlers from ref
          const h = handlersRef.current;

          switch (message.type) {
            case 'session_replaced':
              logger.info('WEBSOCKET', 'Session replaced by a new connection', { gameId, reason: message.reason });
              // Server indicated this session was replaced; do not attempt to reconnect
              shouldReconnectRef.current = false;
              h.onError && h.onError(message.reason || 'Session replaced by another connection');
              break;

            case 'connected':
              logger.info('WEBSOCKET', 'WebSocket connection confirmed', { message: message.message, gameId });
              break;

            case 'game_state':
              logger.debug('WEBSOCKET', 'Received game state', { gameId, state: message.state });
              h.onGameState && h.onGameState(message.state);
              break;

            case 'player_move':
              logger.info('WEBSOCKET', 'Received player move', { gameId, move: message.move });
              h.onMove && h.onMove(message.move);
              break;

            case 'chat_message':
              logger.debug('WEBSOCKET', 'Received chat message', { gameId, data: message.data });
              h.onChatMessage && h.onChatMessage(message.data);
              break;

            case 'player_disconnected':
              logger.warn('WEBSOCKET', 'Player disconnected', { gameId, data: message.data });
              h.onPlayerDisconnect && h.onPlayerDisconnect(message.data.user_id);
              break;

            case 'error':
              logger.error('WEBSOCKET', 'WebSocket error message', { gameId, message: message.message });
              h.onError && h.onError(message.message);
              break;

            case 'game_end':
              logger.info('WEBSOCKET', 'Received game end event', { gameId, data: message.data });
              h.onGameEnd && h.onGameEnd(message.data);
              break;

            case 'pong':
              logger.debug('WEBSOCKET', 'Received pong', { gameId });
              break;

            default:
              logger.warn('WEBSOCKET', 'Unknown WebSocket message type', { gameId, type: message.type });
          }
        } catch (error) {
          logger.error('WEBSOCKET', 'Error parsing WebSocket message', { gameId, error, rawData: event.data });
        }
      };

      socket.onclose = (event) => {
        logger.warn('WEBSOCKET', `Disconnected from game ${gameId} WebSocket`, { 
          gameId, 
          code: event.code, 
          reason: event.reason,
          wasClean: event.wasClean 
        });
        setIsConnected(false);

        // Try to reconnect after a delay if it wasn't a clean close and reconnection allowed
        const nonReconnectCodes = [1000, 4000];
        if (shouldReconnectRef.current && !nonReconnectCodes.includes(event.code)) {
          logger.info('WEBSOCKET', 'Attempting to reconnect in 3 seconds', { gameId });
          setTimeout(() => {
            // Only reconnect if socket is closed
            if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
              connect();
            }
          }, 3000);
        }

        // Clean up reference only if it still points to this socket
        if (ws.current === socket) {
          ws.current = null;
        }
      };

      socket.onerror = (error) => {
        logger.websocketError('WebSocket connection error', wsUrl);
        setConnectionError('WebSocket connection error');
        const h = handlersRef.current;
        h.onError && h.onError('Connection error');
      };

    } catch (error) {
      logger.error('WEBSOCKET', 'Failed to create WebSocket connection', { gameId, error });
      setConnectionError('Failed to create connection');
    }
  }, [gameId, token]);

  const disconnect = useCallback(() => {
    logger.info('WEBSOCKET', 'Manually disconnecting WebSocket', { gameId });
    // Prevent automatic reconnection when disconnect is manual
    shouldReconnectRef.current = false;

    const socket = ws.current;
    if (!socket) {
      return;
    }

    // If socket is still connecting, schedule a close once it's open to avoid
    // the browser warning "WebSocket is closed before the connection is established."
    if (socket.readyState === WebSocket.CONNECTING) {
      const originalOnOpen = socket.onopen;
      socket.onopen = (ev) => {
        try {
          socket.close(1000, 'User disconnect');
        } catch (e) {
          // ignore
        }
        if (typeof originalOnOpen === 'function') {
          // preserve 'this' as the socket when calling original handler
          originalOnOpen.call(socket, ev as any);
        }
      };
    } else {
      try {
        socket.close(1000, 'User disconnect');
      } catch (e) {
        // ignore
      }
    }

    // Do not null out ws.current here; let the onclose handler perform cleanup
    setIsConnected(false);
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
    // Cancel any pending cleanup from StrictMode unmount
    isCleaningUpRef.current = false;
    
    if (gameId && token) {
      logger.debug('WEBSOCKET', 'Auto-connecting WebSocket', { gameId });
      connect();
    }

    return () => {
      // Don't disconnect immediately - let the final cleanup effect handle it
      logger.debug('WEBSOCKET', 'Auto-connect effect cleanup', { gameId });
    };
  }, [gameId, token, connect]);

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
    isMountedRef.current = true;
    
    return () => {
      // In development with StrictMode, React unmounts/remounts components
      // We use a small delay to detect if this is a real unmount or just StrictMode
      isCleaningUpRef.current = true;
      
      setTimeout(() => {
        // If still cleaning up after 100ms, it's a real unmount
        if (isCleaningUpRef.current) {
          logger.info('WEBSOCKET', 'Component unmounting - disconnecting WebSocket', { gameId });
          isMountedRef.current = false;
          disconnect();
        }
      }, 100);
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
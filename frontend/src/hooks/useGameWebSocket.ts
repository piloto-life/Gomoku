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
  const { token, user } = useAuth(); // Pega o usuário atual para enviar o nome
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const isCleaningUpRef = useRef(false);

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

  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (!token || !gameId) {
      const errorMsg = 'Missing authentication token or game ID';
      setConnectionError(errorMsg);
      logger.error('WEBSOCKET', errorMsg, { gameId, hasToken: !!token });
      return;
    }

    try {
      if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      shouldReconnectRef.current = true;

      // Ajuste a URL se necessário, removendo /ws duplicado
      const wsBaseUrl = process.env.REACT_APP_WS_URL || 'wss://localhost:8000';
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
          logger.websocketMessage('RECEIVE', message.type, message);

          const h = handlersRef.current;

          switch (message.type) {
            case 'session_replaced':
              shouldReconnectRef.current = false;
              h.onError && h.onError(message.reason || 'Session replaced by another connection');
              break;

            case 'connected':
              break;

            case 'game_state':
              h.onGameState && h.onGameState(message.state);
              break;

            case 'player_move':
              h.onMove && h.onMove(message.move);
              break;

            case 'chat_message':
            case 'chat':
              h.onChatMessage && h.onChatMessage(message);
              break;

            case 'player_disconnected':
              const userId = message.user_id || (message.data && message.data.user_id);
              logger.warn('WEBSOCKET', 'Player disconnected', { gameId, userId });
              h.onPlayerDisconnect && h.onPlayerDisconnect(userId);
              break;

            case 'error':
              h.onError && h.onError(message.message);
              break;

            case 'game_end':
              h.onGameEnd && h.onGameEnd(message.data || message);
              break;
          }
        } catch (error) {
          logger.error('WEBSOCKET', 'Error parsing WebSocket message', { gameId, error });
        }
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        const nonReconnectCodes = [1000, 4000];
        if (shouldReconnectRef.current && !nonReconnectCodes.includes(event.code)) {
          setTimeout(() => {
            if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
              connect();
            }
          }, 3000);
        }
        if (ws.current === socket) {
          ws.current = null;
        }
      };

      socket.onerror = () => {
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
    shouldReconnectRef.current = false;
    const socket = ws.current;
    if (!socket) return;

    if (socket.readyState === WebSocket.CONNECTING) {
      socket.onopen = () => socket.close(1000, 'User disconnect');
    } else {
      socket.close(1000, 'User disconnect');
    }
    setIsConnected(false);
  }, [gameId]);

  const sendMove = useCallback((row: number, col: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = { type: 'move', row, col };
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, [gameId]);

  const sendChatMessage = useCallback((message: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const chatMessage = {
        type: 'chat',
        message: message,
        username: user?.name || user?.username || 'Jogador' // Envia o nome
      };
      ws.current.send(JSON.stringify(chatMessage));
      return true;
    }
    return false;
  }, [gameId, user]);

  const sendPing = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, [gameId]);

  useEffect(() => {
    isCleaningUpRef.current = false;
    if (gameId && token) connect();
    return () => {};
  }, [gameId, token, connect]);

  useEffect(() => {
    if (isConnected) {
      const pingInterval = setInterval(sendPing, 30000);
      return () => clearInterval(pingInterval);
    }
  }, [isConnected, sendPing, gameId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isCleaningUpRef.current = true;
      setTimeout(() => {
        if (isCleaningUpRef.current) {
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

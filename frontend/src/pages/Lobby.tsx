import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

interface OnlinePlayer {
  id: string;
  name: string;
  rating: number;
}

const Lobby: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { createGame, aiDifficulty, setAiDifficulty } = useGame();
  const navigate = useNavigate();
  const [selectedGameMode, setSelectedGameMode] = useState<'pvp-local' | 'pvp-online' | 'pve'>('pvp-local');
  const [waitingQueue, setWaitingQueue] = useState<OnlinePlayer[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const wsUrl = `ws://localhost:8000/ws/lobby/${user.id}`; // Adjust the URL to your backend
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("Connected to lobby WebSocket");
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'queue_update') {
          setWaitingQueue(message.queue);
        }
        if (message.type === 'game_start') {
          // If the user is part of the new game, navigate to the game page
          const playerIds = message.players.map((p: OnlinePlayer) => p.id);
          if (playerIds.includes(user.id)) {
            navigate(`/game/${message.game_id}`);
          }
        }
      };

      ws.current.onclose = () => {
        console.log("Disconnected from lobby WebSocket");
      };

      return () => {
        ws.current?.close();
      };
    }
  }, [isAuthenticated, user, navigate]);

  const handleJoinQueue = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'join_queue' }));
    }
  };
  
  const handleLeaveQueue = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'leave_queue' }));
    }
  };

  const isUserInQueue = waitingQueue.some(player => player.id === user?.id);

  // ... (keep the rest of your component's JSX)

  // In your JSX, replace the existing "Entrar na Fila" button with this:
  {selectedGameMode === 'pvp-online' && (
    !isUserInQueue ? (
      <button onClick={handleJoinQueue} className="btn btn-secondary">
        Entrar na Fila
      </button>
    ) : (
      <button onClick={handleLeaveQueue} className="btn btn-danger">
        Sair da Fila
      </button>
    )
  )}

  // And replace the waitingQueue.map with this, so it uses the state:
  <div className="section">
    <h2>Fila de Espera ({waitingQueue.length})</h2>
    <div className="queue-list">
      {waitingQueue.length === 0 ? (
        <p>Nenhum jogador na fila</p>
      ) : (
        waitingQueue.map((player, index) => (
          <div key={player.id} className="queue-item">
            <span className="queue-position">#{index + 1}</span>
            <span className="player-name">{player.name}</span>
            <span className="player-rating">Rating: {player.rating}</span>
          </div>
        ))
      )}
    </div>
  </div>
};

export default Lobby;
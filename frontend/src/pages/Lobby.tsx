import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

interface OnlinePlayer {
  id: string;
  name: string;
  rating: number;
  isInGame: boolean;
}

const Lobby: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { createGame, aiDifficulty, setAiDifficulty } = useGame();
  const navigate = useNavigate();
  const [selectedGameMode, setSelectedGameMode] = useState<'pvp-local' | 'pvp-online' | 'pve'>('pvp-local');

  // Mock data for development
  const [onlinePlayers] = useState<OnlinePlayer[]>([
    { id: '1', name: 'Alice', rating: 1400, isInGame: false },
    { id: '2', name: 'Bob', rating: 1250, isInGame: true },
    { id: '3', name: 'Charlie', rating: 1100, isInGame: false },
    { id: '4', name: 'Diana', rating: 1350, isInGame: false },
    { id: '5', name: 'Eduardo', rating: 980, isInGame: true },
  ]);

  const [waitingQueue] = useState<OnlinePlayer[]>([
    { id: '6', name: 'Felipe', rating: 1200, isInGame: false },
    { id: '7', name: 'Gabriela', rating: 1150, isInGame: false },
  ]);

  const handleCreateGame = () => {
    createGame(selectedGameMode, aiDifficulty);
    navigate('/game');
  };

  const handleJoinQueue = () => {
    // TODO: Implement join queue logic
    console.log('Joining queue...');
    alert('Entrando na fila de espera...');
  };

  const handleChallengePlayer = (playerId: string) => {
    // TODO: Implement player challenge logic
    console.log('Challenging player:', playerId);
    alert(`Desafiando jogador ${playerId}...`);
  };

  if (!isAuthenticated) {
    return (
      <div className="lobby-page">
        <div className="auth-required">
          <h2>Login Necessário</h2>
          <p>Você precisa estar logado para acessar o lobby.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-page">
      <div className="lobby-container">
        <h1>Lobby do Gomoku</h1>

        <div className="lobby-sections">
          {/* Quick Game Section */}
          <div className="section">
            <h2>Jogo Rápido</h2>
            <div className="quick-game">
              <div className="game-mode-selector">
                <label>
                  <input
                    type="radio"
                    value="pvp-local"
                    checked={selectedGameMode === 'pvp-local'}
                    onChange={(e) => setSelectedGameMode(e.target.value as 'pvp-local' | 'pvp-online' | 'pve')}
                  />
                  2 Jogadores (Local)
                </label>
                <label>
                  <input
                    type="radio"
                    value="pvp-online"
                    checked={selectedGameMode === 'pvp-online'}
                    onChange={(e) => setSelectedGameMode(e.target.value as 'pvp-local' | 'pvp-online' | 'pve')}
                  />
                  Jogador vs Jogador (Online)
                </label>
                <label>
                  <input
                    type="radio"
                    value="pve"
                    checked={selectedGameMode === 'pve'}
                    onChange={(e) => setSelectedGameMode(e.target.value as 'pvp-local' | 'pvp-online' | 'pve')}
                  />
                  Jogador vs IA
                </label>
              </div>
              
              {/* AI Difficulty Selector - only show for PvE */}
              {selectedGameMode === 'pve' && (
                <div className="ai-difficulty-selector">
                  <h4>Dificuldade da IA:</h4>
                  <div className="difficulty-options">
                    <label>
                      <input
                        type="radio"
                        value="easy"
                        checked={aiDifficulty === 'easy'}
                        onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      />
                      Fácil
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="medium"
                        checked={aiDifficulty === 'medium'}
                        onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      />
                      Médio
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="hard"
                        checked={aiDifficulty === 'hard'}
                        onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      />
                      Difícil
                    </label>
                  </div>
                </div>
              )}
              
              <button onClick={handleCreateGame} className="btn btn-primary">
                {selectedGameMode === 'pve' 
                  ? `Jogar contra IA (${aiDifficulty})` 
                  : selectedGameMode === 'pvp-local' 
                    ? 'Jogar Local (2 Jogadores)' 
                    : 'Criar Sala Online'
                }
              </button>
              
              {selectedGameMode === 'pvp-online' && (
                <button onClick={handleJoinQueue} className="btn btn-secondary">
                  Entrar na Fila
                </button>
              )}
            </div>
          </div>

          {/* Online Players */}
          <div className="section">
            <h2>Jogadores Online ({onlinePlayers.length})</h2>
            <div className="players-list">
              {onlinePlayers.map((player) => (
                <div key={player.id} className={`player-card ${player.isInGame ? 'in-game' : ''}`}>
                  <div className="player-info">
                    <span className="player-name">{player.name}</span>
                    <span className="player-rating">Rating: {player.rating}</span>
                    <span className={`player-status ${player.isInGame ? 'in-game' : 'available'}`}>
                      {player.isInGame ? 'Em jogo' : 'Disponível'}
                    </span>
                  </div>
                  {!player.isInGame && player.id !== user?.id && (
                    <button 
                      onClick={() => handleChallengePlayer(player.id)}
                      className="btn btn-small"
                    >
                      Desafiar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Queue */}
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

          {/* Chat */}
          <div className="section">
            <h2>Chat do Lobby</h2>
            <div className="chat-container">
              <div className="chat-messages">
                <div className="message">
                  <strong>Sistema:</strong> Bem-vindo ao lobby!
                </div>
                <div className="message">
                  <strong>Alice:</strong> Alguém quer jogar?
                </div>
                <div className="message">
                  <strong>Charlie:</strong> Vamos lá!
                </div>
              </div>
              <div className="chat-input">
                <input 
                  type="text" 
                  placeholder="Digite sua mensagem..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      // TODO: Implement chat message sending
                      console.log('Sending message:', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button className="btn btn-small">Enviar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;

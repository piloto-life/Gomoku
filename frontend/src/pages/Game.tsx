import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import GameBoard from '../components/GameBoard';
import GameInfo from '../components/GameInfo';
import GameChat from '../components/GameChat';

const Game: React.FC = () => {
  const { gameState, isConnected, leaveGame } = useGame();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLeaveGame = () => {
    leaveGame();
    navigate('/lobby');
  };

  if (!isAuthenticated) {
    return (
      <div className="game-page">
        <div className="auth-required">
          <h2>Login Necessário</h2>
          <p>Você precisa estar logado para jogar.</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="game-page">
        <div className="no-game">
          <h2>Nenhum jogo ativo</h2>
          <p>Crie um novo jogo ou entre em uma partida existente.</p>
          <button 
            onClick={() => navigate('/lobby')}
            className="btn btn-primary"
          >
            Ir para o Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-container">
        <div className="game-header">
          <h1>Partida de Gomoku</h1>
          <div className="game-controls">
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
            </span>
            <button onClick={handleLeaveGame} className="btn btn-secondary">
              Sair do Jogo
            </button>
          </div>
        </div>

        <div className="game-layout">
          <div className="game-sidebar">
            <GameInfo gameState={gameState} />
            <GameChat gameId={gameState.id} />
          </div>
          
          <div className="game-main">
            <GameBoard gameState={gameState} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;

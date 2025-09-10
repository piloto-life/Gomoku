import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import GameBoard from '../components/GameBoard';
import GameInfo from '../components/GameInfo';
import GameChat from '../components/GameChat';

const Game: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { gameState, gameMode, loadGame, leaveGame } = useGame();

  useEffect(() => {
    if (gameId) {
      loadGame(gameId);
    }
  }, [gameId, loadGame]);

  const handleLeaveGame = async () => {
    if (gameId) {
      await leaveGame();
      navigate('/lobby');
    }
  };

  if (!gameState) {
    return (
      <div className="game-loading">
        <div>Carregando jogo...</div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>Gomoku - {gameMode === 'pve' ? 'Contra IA' : gameMode === 'pvp-local' ? '2 Jogadores Local' : 'Online'}</h1>
        <button onClick={handleLeaveGame} className="btn btn-secondary">
          Voltar ao Lobby
        </button>
      </div>
      
      <div className="game-layout">
        <div className="game-board-section">
          <GameBoard gameState={gameState} />
        </div>
        
        <div className="game-sidebar">
          <GameInfo gameState={gameState} />
          {gameMode === 'pvp-online' && (
            <div className="game-chat-section">
              <GameChat gameId={gameId || ''} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;
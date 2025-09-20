import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame as useGameFromRoot } from '../contexts/GameContext';
import { GameWebSocketProvider, useGame } from '../contexts/GameWebSocketContext';
import { usePageLogger } from '../hooks/useNavigationLogger';
import GameBoard from '../components/GameBoard';
import GameInfo from '../components/GameInfo';
import GameChat from '../components/GameChat';
import logger from '../utils/logger';

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();

  // Log page access
  usePageLogger('Game');

  useEffect(() => {
    logger.info('GAME_PAGE', 'Game page accessed', { gameId });
  }, [gameId]);

  if (!gameId) {
    logger.info('GAME_PAGE', 'No game ID provided, redirecting to lobby');
    // Redirect to lobby instead of showing error
    window.location.href = '/lobby';
    return <div>Redirecionando para o lobby...</div>;
  }

  return (
    <GameWebSocketProvider gameId={gameId}>
      <Game />
    </GameWebSocketProvider>
  );
};

const Game: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { loadGame, leaveGame } = useGameFromRoot();
  const { gameState, isConnected, error, makeMove } = useGame();

  useEffect(() => {
    if (gameId) {
      logger.info('GAME', 'Loading game data', { gameId });
      loadGame(gameId);
    }
  }, [gameId, loadGame]);

  const handleLeaveGame = async () => {
    logger.userAction('LEAVE_GAME_CLICKED', 'Game', { gameId });
    try {
      await leaveGame();
      logger.info('GAME', 'Successfully left game', { gameId });
      navigate('/lobby');
    } catch (error) {
      logger.error('GAME', 'Failed to leave game', { gameId, error });
    }
  };

  if (!gameState) {
    return (
      <div className="game-loading">
        <div>Carregando jogo...</div>
      </div>
    );
  }

  if (error) {
    logger.error('GAME', 'Game error displayed', { gameId, error });
    return (
      <div className="game-error">
        <div>Erro: {error}</div>
        <button onClick={() => navigate('/lobby')}>Voltar ao Lobby</button>
      </div>
    );
  }

  if (!isConnected) {
    logger.warn('GAME', 'Game not connected to WebSocket', { gameId });
    return (
      <div className="game-connecting">
        <div>Conectando ao jogo...</div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>Gomoku - {gameState.gameMode}</h1>
        <button onClick={handleLeaveGame} className="btn btn-secondary">
          Voltar ao Lobby
        </button>
        {error && <div className="error-message">{error}</div>}
        <div>Status: {isConnected ? 'Conectado' : 'Desconectado'}</div>
      </div>
      
      <div className="game-layout">
        <div className="game-board-section">
          <GameBoard gameState={gameState} onMove={(position) => makeMove(position)} />
        </div>
        
        <div className="game-sidebar">
          <GameInfo gameState={gameState} />
          {gameState.gameMode === 'pvp-online' && (
            <div className="game-chat-section">
              <GameChat gameId={gameId || ''} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
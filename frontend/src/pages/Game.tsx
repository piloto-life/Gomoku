import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame as useGameFromRoot } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { GameWebSocketProvider, useGame } from '../contexts/GameWebSocketContext';
import { usePageLogger } from '../hooks/useNavigationLogger';
import GameBoard from '../components/GameBoard';
import GameInfo from '../components/GameInfo';
import GameChat from '../components/GameChat';
import logger from '../utils/logger';
import GameEndModal from '../components/GameEndModal';

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

  // Check if it's a local game (local games have IDs starting with "local-")
  const isLocalGame = gameId.startsWith('local-');
  
  logger.info('GAME_PAGE', 'Game type determined', { gameId, isLocalGame });

  // For local games, don't use WebSocket provider
  if (isLocalGame) {
    return <LocalGameComponent />;
  }

  // For online games, use WebSocket provider
  return (
    <GameWebSocketProvider gameId={gameId}>
      <OnlineGameComponent />
    </GameWebSocketProvider>
  );
};

// Local Game Component (uses GameContext)
const LocalGameComponent: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { gameState, loadGame, leaveGame, makeMove } = useGameFromRoot();
  const { updateUser } = useAuth();
  
  // Local games are always "connected" and have no connection errors
  const isConnected = true;
  const error = null;
  const [isReconnecting] = useState(false); // Always false for local games
  const [showEndModal, setShowEndModal] = useState(false);
  const [endMessage, setEndMessage] = useState('');
  const [winnerName, setWinnerName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (gameId) {
      logger.info('GAME', 'Loading local game data', { gameId });
      loadGame(gameId);
    }
  }, [gameId, loadGame]);

  // Detect end of game and show modal
  useEffect(() => {
    if (gameState && gameState.status === 'finished') {
      let msg = '';
      let winner = undefined;
      if (gameState.winner === 'black' || gameState.winner === 'white') {
        const winnerColor = gameState.winner;
        const winnerPlayer = gameState.players[winnerColor];
        winner = winnerPlayer?.name || winnerColor;
        msg = `Vitória de ${winner}!`;
      } else {
        msg = 'Empate!';
      }
      setWinnerName(winner);
      setEndMessage(msg);
      setShowEndModal(true);
    } else {
      setShowEndModal(false);
    }
  }, [gameState]);

  const handleLeaveGame = async () => {
    if (gameId) {
      await leaveGame();
      navigate('/lobby');
    }
  };

  const handleReturnToLobby = async () => {
    setShowEndModal(false);
    // Update user stats
    try {
      const updatedUser = await authAPI.getCurrentUser();
      updateUser(updatedUser);
    } catch (e) {
      // ignore
    }
    handleLeaveGame();
  };

  const handlePlayAgain = () => {
    setShowEndModal(false);
    navigate('/lobby');
  };

  // Render the game UI (same as original Game component)
  if (!gameState) {
    return (
      <div className="game-loading">
        <div>Carregando jogo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-error">
        <div>Erro: {error}</div>
        <button onClick={() => navigate('/lobby')}>Voltar ao Lobby</button>
      </div>
    );
  }

  // For local games, we don't show "connecting" state
  if (!isConnected && !gameId?.startsWith('local-')) {
    return (
      <div className="game-connecting">
        <div>{isReconnecting ? 'Reconectando ao jogo...' : 'Conectando ao jogo...'}</div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {showEndModal && (
        <GameEndModal 
          isOpen={showEndModal}
          message={endMessage}
          winner={winnerName}
          onPlayAgain={handlePlayAgain}
          onReturnToLobby={handleReturnToLobby}
        />
      )}

      <div className="game-header">
        <h1>Gomoku - {gameState.gameMode}</h1>
        <button onClick={handleLeaveGame} className="btn btn-secondary">
          Sair do Jogo
        </button>
      </div>

      <div className="game-content">
        <div className="game-main">
          <GameBoard gameState={gameState} onMove={makeMove} />
          <GameInfo gameState={gameState} />
        </div>
        
        {gameState.gameMode === 'pvp-online' && (
          <div className="game-sidebar">
          </div>
        )}
      </div>
    </div>
  );
};

// Online Game Component (uses GameWebSocketContext)  
const OnlineGameComponent: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { loadGame, leaveGame } = useGameFromRoot();
  const { updateUser } = useAuth();
  const { gameState, isConnected, error, makeMove } = useGame();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endMessage, setEndMessage] = useState('');
  const [winnerName, setWinnerName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (gameId) {
      logger.info('GAME', 'Loading online game data', { gameId });
      loadGame(gameId);
    }
  }, [gameId, loadGame]);

  // Feedback visual de reconexão e recarregamento do estado
  useEffect(() => {
    if (!isConnected) {
      setIsReconnecting(true);
    } else {
      if (isReconnecting && gameId) {
        // Recarrega o estado do jogo ao reconectar
        loadGame(gameId);
      }
      setIsReconnecting(false);
    }
  }, [isConnected, gameId, loadGame, isReconnecting]);

  // Detect end of game and show modal
  useEffect(() => {
    if (gameState && gameState.status === 'finished') {
      let msg = '';
      let winner = undefined;
      if (gameState.winner === 'black' || gameState.winner === 'white') {
        const winnerColor = gameState.winner;
        const winnerPlayer = gameState.players[winnerColor];
        winner = winnerPlayer?.name || winnerColor;
        msg = `Vitória de ${winner}!`;
      } else {
        msg = 'Empate!';
      }
      setWinnerName(winner);
      setEndMessage(msg);
      setShowEndModal(true);
    } else {
      setShowEndModal(false);
    }
  }, [gameState]);

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


  const handleReturnToLobby = async () => {
    setShowEndModal(false);
    // Atualiza ranking/histórico do usuário
    try {
      const updatedUser = await authAPI.getCurrentUser();
      updateUser(updatedUser);
    } catch (e) {
      // ignore
    }
    handleLeaveGame();
  };

  const handlePlayAgain = () => {
    setShowEndModal(false);
    navigate('/lobby');
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
        <div>{isReconnecting ? 'Reconectando ao jogo...' : 'Conectando ao jogo...'}</div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <GameEndModal
        isOpen={showEndModal}
        winner={winnerName}
        message={endMessage}
        onReturnToLobby={handleReturnToLobby}
        onPlayAgain={handlePlayAgain}
      />
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
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame as useGameFromRoot } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, gamesAPI } from '../services/api';
import { GameWebSocketProvider, useGame } from '../contexts/GameWebSocketContext';
import { usePageLogger } from '../hooks/useNavigationLogger';
import GameBoard from '../components/GameBoard';
import GameInfo from '../components/GameInfo';
import GameChat from '../components/GameChat';
import ScreenRecorder from '../components/ScreenRecorder';
import logger from '../utils/logger';
import GameEndModal from '../components/GameEndModal';
import { GameState } from '../types';

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [initialGameState, setInitialGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  usePageLogger('Game');

  useEffect(() => {
    if (gameId && !gameId.startsWith('local-')) {
      gamesAPI.getGame(gameId)
        .then((game: GameState) => {
          setInitialGameState(game);
          setIsLoading(false);
        })
        .catch((error: any) => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [gameId]);

  if (!gameId) {
    window.location.href = '/lobby';
    return <div>Redirecionando para o lobby...</div>;
  }

  const isLocalGame = gameId.startsWith('local-');
  
  if (isLocalGame) {
    return <LocalGameComponent />;
  }

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Carregando jogo...</p>
      </div>
    );
  }

  return (
    <GameWebSocketProvider gameId={gameId} initialGameState={initialGameState}>
      <OnlineGameComponent />
    </GameWebSocketProvider>
  );
};

const LocalGameComponent: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { gameState, loadGame, leaveGame, makeMove } = useGameFromRoot();
  const { updateUser } = useAuth();
  
  const isConnected = true;
  const error = null;
  const [isReconnecting] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endMessage, setEndMessage] = useState('');
  const [winnerName, setWinnerName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (gameId) {
      loadGame(gameId);
    }
  }, [gameId, loadGame]);

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
    try {
      if (gameState && gameState.id && gameState.id.startsWith('local-') && gameState.status === 'finished') {
        const payload = {
          id: gameState.id,
          mode: gameState.gameMode,
          board: gameState.board,
          moves: gameState.moves,
          players: {
            black: {
              id: gameState.players.black?.id,
              username: gameState.players.black?.name
            },
            white: {
              id: gameState.players.white?.id,
              username: gameState.players.white?.name
            }
          },
          status: gameState.status,
          winner: gameState.winner,
          created_at: gameState.createdAt ? gameState.createdAt.toISOString() : undefined,
          updated_at: gameState.updatedAt ? gameState.updatedAt.toISOString() : undefined
        };

        try {
          await gamesAPI.saveGame(payload);
        } catch (saveErr) {
        }
      }
    } catch (err) {
    }

    try {
      const updatedUser = await authAPI.getCurrentUser();
      updateUser(updatedUser);
    } catch (e) {
    }

    handleLeaveGame();
  };

  const handlePlayAgain = () => {
    setShowEndModal(false);
    navigate('/lobby');
  };

  // Função auxiliar para baixar o vídeo localmente
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!gameState) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Carregando jogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-error">
        <div className="error-icon">⚠️</div>
        <h3>Erro na Partida</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/lobby')}>
          Voltar ao Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="game-page">
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
          <h2 className="game-title">Gomoku - {gameState.gameMode === 'pvp-local' ? 'Local' : gameState.gameMode === 'pve' ? 'VS Computador' : 'Online'}</h2>
          <div className="game-controls">
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            <button onClick={handleLeaveGame} className="btn btn-danger btn-sm">
              Sair do Jogo
            </button>
          </div>
        </div>

        <div className="game-layout">
          <div className="game-main">
            <GameBoard gameState={gameState} onMove={makeMove} />
          </div>
          
          <div className="game-sidebar">
            <GameInfo gameState={gameState} />
            <ScreenRecorder 
              isInGame={true} 
              onRecordingStart={() => logger.info('GAME', 'Recording started')}
              onRecordingStop={(blob) => {
                logger.info('GAME', 'Recording stopped', { size: blob.size });
                const filename = `gomoku-local-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.webm`;
                downloadBlob(blob, filename);
              }}
              onRecordingError={(err) => logger.error('GAME', 'Recording error', { error: err })}
            />
            {gameState.gameMode === 'pvp-online' && (
              <GameChat gameId={gameId || ''} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
      loadGame(gameId);
    }
  }, [gameId, loadGame]);

  useEffect(() => {
    if (!isConnected) {
      setIsReconnecting(true);
    } else {
      if (isReconnecting && gameId) {
        loadGame(gameId);
      }
      setIsReconnecting(false);
    }
  }, [isConnected, gameId, loadGame, isReconnecting]);

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
    try {
      await leaveGame();
      navigate('/lobby');
    } catch (error) {
    }
  };

  const handleReturnToLobby = async () => {
    setShowEndModal(false);
    try {
      const updatedUser = await authAPI.getCurrentUser();
      updateUser(updatedUser);
    } catch (e) {
    }
    handleLeaveGame();
  };

  const handlePlayAgain = () => {
    setShowEndModal(false);
    navigate('/lobby');
  };

  // Função auxiliar para baixar o vídeo localmente
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!gameState) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Carregando jogo...</p>
      </div>
    );
  }

  if (error) {
    const isGameOver = error.includes('Game Over') || error.includes('wins') || error.includes('venceu');
    
    if (isGameOver) {
      return (
        <div className="game-success-modal">
          <div className="success-content">
            <div className="success-icon">🎉</div>
            <h2 className="success-title">{error}</h2>
            <p className="success-message">Partida finalizada com sucesso!</p>
            <button className="btn btn-primary" onClick={() => navigate('/lobby')}>
              Voltar ao Lobby
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="game-error">
        <div className="error-icon">⚠️</div>
        <h3>Erro na Partida</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/lobby')}>
          Voltar ao Lobby
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">{isReconnecting ? 'Reconectando ao jogo...' : 'Conectando ao jogo...'}</p>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-container">
        <GameEndModal
          isOpen={showEndModal}
          winner={winnerName}
          message={endMessage}
          onReturnToLobby={handleReturnToLobby}
          onPlayAgain={handlePlayAgain}
        />
        
        <div className="game-header">
          <h2 className="game-title">Gomoku - {gameState.gameMode === 'pvp-online' ? 'Online' : gameState.gameMode}</h2>
          <div className="game-controls">
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            <button onClick={handleLeaveGame} className="btn btn-danger btn-sm">
              Sair do Jogo
            </button>
          </div>
        </div>
        
        <div className="game-layout">
          <div className="game-main">
            <GameBoard gameState={gameState} onMove={(position) => makeMove(position)} />
          </div>
          <div className="game-sidebar">
            <GameInfo gameState={gameState} />
            <ScreenRecorder 
              isInGame={true}
              onRecordingStart={() => logger.info('GAME', 'Recording started')}
              onRecordingStop={(blob) => {
                logger.info('GAME', 'Recording stopped', { size: blob.size });
                const filename = `gomoku-online-${gameId}-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.webm`;
                downloadBlob(blob, filename);
              }}
              onRecordingError={(err) => logger.error('GAME', 'Recording error', { error: err })}
            />
            {gameState.gameMode === 'pvp-online' && (
              <GameChat gameId={gameId || ''} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;

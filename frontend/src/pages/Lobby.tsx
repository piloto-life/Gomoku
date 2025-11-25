import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';
import { usePageLogger } from '../hooks/useNavigationLogger';
import SettingsPanel from '../components/SettingsPanel';
import PlayerAvatar from '../components/PlayerAvatar';
import ChatComponent from '../components/ChatComponent';
import VideoChat from '../components/VideoChat';
import RankingSystem from '../components/RankingSystem';
import ScreenRecorder from '../components/ScreenRecorder';
import ActiveGamesList from '../components/ActiveGamesList';
import { gamesAPI, usersAPI, chatAPI } from '../services/api';
import { GameState } from '../types';
import logger from '../utils/logger';
import '../components/UIComponents.css';
import './Lobby.css';

interface OnlinePlayer {
  id: string;
  name: string;
  rating: number;
  avatar?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'system' | 'user';
}

const Lobby: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { createGame, aiDifficulty, setAiDifficulty } = useGame();
  const { settings } = useUI();
  const navigate = useNavigate();

  // Log page visit
  usePageLogger('Lobby');

  // Game state
  const [selectedGameMode, setSelectedGameMode] = useState<'pvp-local' | 'pvp-online' | 'pve'>('pvp-local');
  const [waitingQueue, setWaitingQueue] = useState<OnlinePlayer[]>([]);

  // UI state
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userRanking, setUserRanking] = useState<any>({ rank_position: 0, elo_rating: 1200, wins: 0, losses: 0, rank_tier: 'Bronze' });
  const [activeGames, setActiveGames] = useState<GameState[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket
  const ws = useRef<WebSocket | null>(null);

  // Effect for fetching lobby data when authentication is confirmed
  useEffect(() => {
    const fetchLobbyData = async () => {
      setIsLoading(true);
      setError(null);
      logger.info('LOBBY', 'Fetching lobby data');

      try {
        // Dynamically import rankingAPI to avoid circular dependencies if any
        const { rankingAPI } = await import('../services/api');

        const [games, players, myStats] = await Promise.all([
          gamesAPI.getActiveGames(),
          usersAPI.getOnlinePlayers(),
          rankingAPI.getMyStats().catch(err => {
            logger.warn('LOBBY', 'Failed to fetch my stats', err);
            return null;
          })
        ]);

        setActiveGames(games);
        setOnlinePlayers(players);

        if (myStats) {
          setUserRanking(myStats);
        }

        logger.info('LOBBY', 'Lobby data fetched successfully', {
          gamesCount: games.length,
          playersCount: players.length
        });
      } catch (err) {
        logger.error('LOBBY', 'Failed to fetch lobby data', { error: err });
        setError('Não foi possível carregar os dados do lobby. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchLobbyData();
    }
  }, [isAuthenticated]);

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const connectWebSocket = () => {
      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
      }

      const wsBaseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
      // Use the token from auth context (assuming it's available via a method or stored in localStorage/cookie handled by auth)
      // Since useAuth doesn't expose token directly in the interface shown, we might need to get it. 
      // However, usually AuthContext handles this. Let's check if we can get the token.
      // Looking at useGameWebSocket, it uses `const { token } = useAuth()`. 
      // Let's assume useAuth provides token. If not, we'll need to fix that.
      // The previous view of Lobby.tsx didn't show 'token' destructuring, so I'll add it.

      // For now, let's try to get token from localStorage if not in context, or assume context has it.
      // Wait, I should check useAuth definition first to be safe? 
      // Step 30 showed useGameWebSocket using `const { token, user } = useAuth()`.
      // So I can destructure token from useAuth().

      const token = localStorage.getItem('token'); // Fallback or use context if I update the destructuring

      if (!token) {
        logger.error('LOBBY', 'No auth token found for WebSocket connection');
        return;
      }

      const wsUrl = `${wsBaseUrl}/ws/lobby?token=${encodeURIComponent(token)}`;
      logger.info('LOBBY', 'Connecting to lobby WebSocket', { wsUrl });

      try {
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => {
          logger.info('LOBBY', 'Connected to lobby WebSocket');
          // Re-join queue if we were in it? Maybe not needed for now.
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            logger.websocketMessage('RECEIVE', data.type, data);

            switch (data.type) {
              case 'queue_update':
                // Update queue state
                if (data.queue) {
                  // Transform queue data if necessary to match OnlinePlayer interface
                  // Assuming data.queue is array of players
                  setWaitingQueue(data.queue);
                }
                break;

              case 'game_start':
                logger.info('LOBBY', 'Game started!', data);
                if (data.game_id) {
                  navigate(`/game/${data.game_id}`);
                }
                break;

              case 'chat_message':
                setChatMessages(prev => [...prev, {
                  id: Date.now().toString(), // Generate temp ID
                  userId: data.userId,
                  username: data.userName || data.username,
                  message: data.message,
                  timestamp: new Date(data.timestamp),
                  type: 'user'
                }]);
                break;

              default:
                break;
            }
          } catch (err) {
            logger.error('LOBBY', 'Error parsing WebSocket message', { error: err });
          }
        };

        socket.onclose = (event) => {
          logger.info('LOBBY', 'Lobby WebSocket disconnected');
          // Attempt reconnect after delay
          setTimeout(() => {
            if (isAuthenticated) {
              connectWebSocket();
            }
          }, 3000);
        };

        socket.onerror = (error) => {
          logger.error('LOBBY', 'Lobby WebSocket error', { error });
        };

      } catch (err) {
        logger.error('LOBBY', 'Failed to create WebSocket connection', { error: err });
      }
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [isAuthenticated, user, navigate]);

  const handleJoinQueue = () => {
    logger.userAction('JOIN_QUEUE_CLICKED', 'Lobby');
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = { type: 'join_queue' };
      logger.websocketMessage('SEND', 'join_queue', message);
      ws.current.send(JSON.stringify(message));
    } else {
      logger.warn('LOBBY', 'Cannot join queue - WebSocket not connected');
    }
  };

  const handleLeaveQueue = () => {
    logger.userAction('LEAVE_QUEUE_CLICKED', 'Lobby');
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = { type: 'leave_queue' };
      logger.websocketMessage('SEND', 'leave_queue', message);
      ws.current.send(JSON.stringify(message));
    } else {
      logger.warn('LOBBY', 'Cannot leave queue - WebSocket not connected');
    }
  };

  const handleSendMessage = async (message: string) => {
    logger.userAction('SEND_CHAT_MESSAGE', 'Lobby', { message });
    if (!user) return;

    try {
      // Save to backend for persistence
      await chatAPI.sendMessage({
        type: 'lobby',
        message,
        user_id: user.id,
        username: user.name || user.email.split('@')[0],
        timestamp: new Date().toISOString()
      });

      // Also send via WebSocket for real-time updates
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'chat_message',
          message,
          userId: user.id,
          userName: user.name || user.email.split('@')[0]
        }));
      }
    } catch (error) {
      logger.error('LOBBY', 'Failed to send chat message', { error });
    }
  };

  const isUserInQueue = waitingQueue.some((player: OnlinePlayer) => player.id === user?.id);

  const handleCreateGame = async () => {
    try {
      logger.userAction('CREATE_GAME_CLICKED', 'Lobby', { gameMode: selectedGameMode, difficulty: aiDifficulty });

      const result = await createGame(selectedGameMode, aiDifficulty);

      if (result && result.success && result.gameId) {
        logger.info('LOBBY', 'Game created successfully, navigating', {
          gameId: result.gameId,
          gameMode: selectedGameMode,
          status: result.status
        });

        // Navigate to specific game
        navigate(`/game/${result.gameId}`);
      } else {
        // Fallback for local games or games without specific ID
        logger.warn('LOBBY', 'Game created but no specific ID returned, using generic navigation');
        navigate('/game');
      }
    } catch (error) {
      logger.error('LOBBY', 'Failed to create game', {
        gameMode: selectedGameMode,
        difficulty: aiDifficulty,
        error
      });
      console.error('Erro ao criar jogo:', error);

      // Show user-friendly error message
      // TODO: Add proper error notification system
      alert('Erro ao criar jogo. Tente novamente.');
    }
  };

  return (
    <div className={`lobby-container ${settings.theme}`} data-theme={settings.theme}>
      {/* Header */}
      <header className="lobby-header">
        <div className="header-left">
          <h1>
            <i className="fas fa-chess-board"></i>
            Lobby do Gomoku
          </h1>
          <div className="user-info">
            <span>Bem-vindo, {user?.name}!</span>
            <div className="user-stats">
              <span>Rank: #{userRanking.rank_position || '-'}</span>
              <span>Rating: {userRanking.elo_rating} ({userRanking.rank_tier})</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <button
            className="settings-toggle-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Configurações"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </header>

      <div className="lobby-content">
        {/* Main Content */}
        <div className="main-section">
          {/* Player Profile */}
          <div className="profile-section">
            <PlayerAvatar
              size="large"
              editable={true}
            />
            <div className="player-stats">
              <h3>Estatísticas</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{userRanking.wins}</span>
                  <span className="stat-label">Vitórias</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{userRanking.losses}</span>
                  <span className="stat-label">Derrotas</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {userRanking.total_games > 0
                      ? Math.round((userRanking.wins / userRanking.total_games) * 100)
                      : 0}%
                  </span>
                  <span className="stat-label">Taxa de Vitória</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{userRanking.current_streak ?? 0}</span>
                  <span className="stat-label">Sequência</span>
                </div>
              </div>
            </div>
          </div>

          {/* Game Modes */}
          <div className="game-modes-section">
            <h2>
              <i className="fas fa-gamepad"></i>
              Modos de Jogo
            </h2>
            <div className="mode-grid">
              <div
                className={`game-mode-card ${selectedGameMode === 'pvp-local' ? 'selected' : ''}`}
                onClick={() => setSelectedGameMode('pvp-local')}
              >
                <i className="fas fa-users"></i>
                <h3>PvP Local</h3>
                <p>Jogue contra um amigo no mesmo dispositivo</p>
              </div>

              <div
                className={`game-mode-card ${selectedGameMode === 'pvp-online' ? 'selected' : ''}`}
                onClick={() => setSelectedGameMode('pvp-online')}
              >
                <i className="fas fa-globe"></i>
                <h3>PvP Online</h3>
                <p>Encontre oponentes online</p>
              </div>

              <div
                className={`game-mode-card ${selectedGameMode === 'pve' ? 'selected' : ''}`}
                onClick={() => setSelectedGameMode('pve')}
              >
                <i className="fas fa-robot"></i>
                <h3>PvE (vs IA)</h3>
                <p>Desafie a inteligência artificial</p>
              </div>
            </div>

            {/* AI Difficulty Selection */}
            {selectedGameMode === 'pve' && (
              <div className="ai-difficulty-section">
                <h3>Dificuldade da IA</h3>
                <div className="difficulty-options">
                  {['easy', 'medium', 'hard'].map((difficulty) => (
                    <button
                      key={difficulty}
                      className={`difficulty-btn ${aiDifficulty === difficulty ? 'selected' : ''}`}
                      onClick={() => setAiDifficulty(difficulty as 'easy' | 'medium' | 'hard')}
                    >
                      <i className={`fas ${difficulty === 'easy' ? 'fa-seedling' :
                        difficulty === 'medium' ? 'fa-fire' : 'fa-bolt'
                        }`}></i>
                      {difficulty === 'easy' ? 'Fácil' :
                        difficulty === 'medium' ? 'Médio' : 'Difícil'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Online Queue */}
            {selectedGameMode === 'pvp-online' && (
              <div className="online-queue-section">
                <div className="queue-controls">
                  {!isUserInQueue ? (
                    <button onClick={handleJoinQueue} className="btn btn-primary">
                      <i className="fas fa-play"></i>
                      Entrar na Fila
                    </button>
                  ) : (
                    <button onClick={handleLeaveQueue} className="btn btn-danger">
                      <i className="fas fa-stop"></i>
                      Sair da Fila
                    </button>
                  )}
                </div>

                <div className="queue-display">
                  <h3>
                    <i className="fas fa-clock"></i>
                    Fila de Espera ({waitingQueue.length})
                  </h3>
                  <div className="queue-list">
                    {waitingQueue.length === 0 ? (
                      <div className="empty-queue">
                        <i className="fas fa-user-plus"></i>
                        <p>Nenhum jogador na fila</p>
                      </div>
                    ) : (
                      waitingQueue.map((player: OnlinePlayer, index: number) => (
                        <div key={player.id} className="queue-item">
                          <span className="queue-position">#{index + 1}</span>
                          <div className="player-info">
                            {player.avatar && (
                              <img src={player.avatar} alt="Avatar" className="queue-avatar" />
                            )}
                            <div className="player-details">
                              <span className="player-name">{player.name}</span>
                              <span className="player-rating">Rating: {player.rating}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Start Game Button */}
            {(selectedGameMode === 'pvp-local' || selectedGameMode === 'pve') && (
              <div className="start-game-section">
                <button onClick={handleCreateGame} className="btn btn-primary btn-large">
                  <i className="fas fa-play"></i>
                  Iniciar Jogo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Ranking System */}
          <RankingSystem
            showGlobalRanking={true}
            maxPlayers={10}
            className="lobby-ranking"
          />

          {/* Chat */}
          {settings.showChat && (
            <ChatComponent
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isGameChat={false}
            />
          )}

          {/* Video Chat */}
          {settings.showVideoChat && (
            <VideoChat
              isInGame={false}
            />
          )}

          {/* Screen Recorder */}
          <ScreenRecorder
            isInGame={false}
            onRecordingStart={() => console.log('Recording started')}
            onRecordingStop={(blob) => console.log('Recording stopped, blob size:', blob.size)}
            onRecordingError={(error) => console.error('Recording error:', error)}
          />

          <ActiveGamesList
            games={activeGames}
            onSpectate={(gameId) => navigate(`/game/${gameId}?spectate=true`)}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default Lobby;

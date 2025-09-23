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
import { gamesAPI, usersAPI } from '../services/api';
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
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userRanking, setUserRanking] = useState({ rank: 0, rating: 1200, wins: 0, losses: 0 });
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
        const [games, players] = await Promise.all([
          gamesAPI.getActiveGames(),
          usersAPI.getOnlinePlayers(),
        ]);
        setActiveGames(games);
        setOnlinePlayers(players);
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

  // Effect for establishing WebSocket connection once user data is available
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      if (!token) {
        logger.error('LOBBY', 'No token available for WebSocket connection');
        return;
      }

  const wsBaseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
  const wsUrl = `${wsBaseUrl}/ws/lobby?token=${encodeURIComponent(token)}`;
      
      logger.websocketConnect(wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        logger.info('WEBSOCKET', 'Connected to lobby WebSocket');
      };
      
      ws.current.onerror = (error) => {
        logger.websocketError('Lobby WebSocket error', wsUrl);
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          logger.websocketMessage('RECEIVE', message.type, message);
          
          switch (message.type) {
            case 'player_joined':
              usersAPI.getOnlinePlayers().then(setOnlinePlayers);
              break;
            case 'player_left':
              usersAPI.getOnlinePlayers().then(setOnlinePlayers);
              break;
            case 'online_players':
              if (Array.isArray(message.players)) {
                setOnlinePlayers(message.players);
              }
              break;
            case 'game_created':
              gamesAPI.getActiveGames().then(setActiveGames);
              break;
            case 'queue_update':
              setWaitingQueue(message.queue);
              break;
            case 'game_start':
              logger.info('WEBSOCKET', 'Game start message received', { message });
              
              // Enhanced robust parsing for game_start message
              let playerIds: string[] = [];
              let shouldNavigate = false;
              
              // Method 1: Direct players array with id field
              if (message.players && Array.isArray(message.players)) {
                try {
                  playerIds = message.players
                    .filter((p: any) => p && typeof p === 'object')
                    .map((p: any) => p.id || p.user_id || p.userId)
                    .filter((id: any) => id); // Remove null/undefined values
                    
                  logger.debug('WEBSOCKET', 'Extracted player IDs from players array', { playerIds });
                } catch (err) {
                  logger.warn('WEBSOCKET', 'Error parsing players array', { error: err, players: message.players });
                }
              }
              
              // Method 2: Alternative player_ids field
              if (playerIds.length === 0 && message.player_ids && Array.isArray(message.player_ids)) {
                playerIds = message.player_ids.filter((id: any) => id);
                logger.debug('WEBSOCKET', 'Extracted player IDs from player_ids array', { playerIds });
              }
              
              // Method 3: Check if current user is mentioned directly
              if (playerIds.length === 0 && message.game_id && user?.id) {
                // Look for user ID in various possible message fields
                const messageStr = JSON.stringify(message).toLowerCase();
                const userIdStr = user.id.toLowerCase();
                
                if (messageStr.includes(userIdStr)) {
                  logger.info('WEBSOCKET', 'User ID found in message content, assuming participation', { 
                    gameId: message.game_id, 
                    userId: user.id 
                  });
                  shouldNavigate = true;
                } else {
                  logger.warn('WEBSOCKET', 'User ID not found in game_start message', { 
                    message, 
                    userId: user.id 
                  });
                }
              }
              
              // Decide whether to navigate
              if (playerIds.includes(user?.id || '')) {
                logger.info('WEBSOCKET', 'User confirmed in player list, navigating', { 
                  gameId: message.game_id, 
                  userId: user.id, 
                  playerIds 
                });
                shouldNavigate = true;
              } else if (shouldNavigate) {
                logger.info('WEBSOCKET', 'User participation detected via content match, navigating', { 
                  gameId: message.game_id, 
                  userId: user.id 
                });
              } else if (playerIds.length === 0 && message.game_id) {
                logger.warn('WEBSOCKET', 'No player information found, but game_id present - attempting navigation', { 
                  gameId: message.game_id, 
                  userId: user.id 
                });
                shouldNavigate = true;
              } else {
                logger.info('WEBSOCKET', 'User not participating in this game', { 
                  gameId: message.game_id, 
                  userId: user.id, 
                  playerIds 
                });
              }
              
              if (shouldNavigate && message.game_id) {
                navigate(`/game/${message.game_id}`);
              }
              break;
            case 'chat_message':
              const newMessage: ChatMessage = {
                id: Date.now().toString(),
                userId: message.userId,
                username: message.userName,
                message: message.message,
                timestamp: new Date(message.timestamp),
                type: 'user'
              };
              setChatMessages(prev => [...prev, newMessage]);
              break;
            case 'user_stats':
              setUserRanking(message.stats);
              break;
          }
        } catch (error) {
          logger.error('WEBSOCKET', 'Error parsing lobby WebSocket message', { error, data: event.data });
        }
      };

      ws.current.onclose = (event) => {
        logger.warn('WEBSOCKET', 'Disconnected from lobby WebSocket', { code: event.code, reason: event.reason });
      };

      return () => {
        if (ws.current) {
          logger.info('WEBSOCKET', 'Closing lobby WebSocket connection');
          ws.current.close();
        }
      };
    }
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

  const handleSendMessage = (message: string) => {
    logger.userAction('SEND_CHAT_MESSAGE', 'Lobby', { message });
    if (ws.current?.readyState === WebSocket.OPEN && user) {
      ws.current.send(JSON.stringify({
        type: 'chat_message',
        message,
        userId: user.id,
        userName: user.name
      }));
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

  if (!isAuthenticated) {
    return (
      <div className="lobby-container error-state">
        <div className="error-content">
          <i className="fas fa-lock icon-large"></i>
          <h1>Acesso Restrito</h1>
          <p>Você precisa fazer login para acessar o lobby</p>
          <button onClick={() => navigate('/login')} className="btn btn-primary">
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

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
              <span>Rank: #{userRanking.rank}</span>
              <span>Rating: {userRanking.rating}</span>
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
                    {userRanking.wins + userRanking.losses > 0 
                      ? Math.round((userRanking.wins / (userRanking.wins + userRanking.losses)) * 100)
                      : 0}%
                  </span>
                  <span className="stat-label">Taxa de Vitória</span>
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
                      <i className={`fas ${
                        difficulty === 'easy' ? 'fa-seedling' : 
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

          <div className="online-players-list">
            <h3>Jogadores Online</h3>
            {isLoading ? (
              <p>Carregando...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : (
              <ul className="online-players-ul">
                {onlinePlayers.length === 0 ? (
                  <li className="empty-online-player">Nenhum jogador online</li>
                ) : (
                  onlinePlayers.map((player) => (
                    <li key={player.id} className="online-player-item">
                      {player.avatar ? (
                        <img src={player.avatar} alt="Avatar" className="online-player-avatar" />
                      ) : (
                        <span className="online-player-avatar-placeholder">
                          <i className="fas fa-user-circle"></i>
                        </span>
                      )}
                      <span className="online-player-name">{player.name}</span>
                      {typeof player.rating === 'number' && (
                        <span className="online-player-rating">({player.rating})</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

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
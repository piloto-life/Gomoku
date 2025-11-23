import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { addRankingUpdatedListener } from '../services/events';

interface PlayerRank {
  id: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  winRate: number;
  avatar?: string;
  rank: number;
}

interface RankingSystemProps {
  showGlobalRanking?: boolean;
  maxPlayers?: number;
  className?: string;
}

const RankingSystem: React.FC<RankingSystemProps> = ({
  showGlobalRanking = true,
  maxPlayers = 10,
  className = ''
}) => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<PlayerRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<PlayerRank | null>(null);
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch leaderboard via central `api` (adds baseURL and auth headers)
      const leaderboardResponse = await api.get('/api/ranking/leaderboard', {
        params: { limit: maxPlayers, min_games: 0 }
      });
      const leaderboardData = leaderboardResponse.data;

      // Transform backend data to frontend format
      const transformedRankings: PlayerRank[] = leaderboardData.players.map((player: any, index: number) => ({
        id: player.user_id,
        name: player.username,
        rating: player.elo_rating,
        wins: player.wins,
        losses: player.losses,
        winRate: player.win_rate * 100, // Convert to percentage
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`,
        rank: index + 1
      }));

      setRankings(transformedRankings);

      // Fetch current user's stats if logged in
      if (user) {
        try {
          const myStatsResponse = await api.get('/api/ranking/me');
          const myStats = myStatsResponse.data;
          const userRankData: PlayerRank = {
            id: myStats.user_id,
            name: myStats.username,
            rating: myStats.elo_rating,
            wins: myStats.wins,
            losses: myStats.losses,
            winRate: myStats.win_rate * 100,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${myStats.username}`,
            rank: myStats.rank_position || 0
          };
          setUserRank(userRankData);
        } catch (e) {
          // ignore user stats fetch errors
        }
      }
    } catch (error) {
      console.error('Erro ao buscar rankings:', error);
    } finally {
      setLoading(false);
    }
  }, [user, maxPlayers]);

  useEffect(() => {
    fetchRankings();
  }, [timeFrame, fetchRankings]);

  // Listen for external requests to refresh rankings (e.g., after saving a game)
  useEffect(() => {
    const listener = () => {
      fetchRankings();
    };
    const cleanup = addRankingUpdatedListener(listener);
    return cleanup;
  }, [fetchRankings]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <i className="fas fa-crown rank-icon gold"></i>;
      case 2:
        return <i className="fas fa-medal rank-icon silver"></i>;
      case 3:
        return <i className="fas fa-medal rank-icon bronze"></i>;
      default:
        return <span className="rank-number">#{rank}</span>;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 2000) return 'rating-master';
    if (rating >= 1800) return 'rating-expert';
    if (rating >= 1600) return 'rating-advanced';
    if (rating >= 1400) return 'rating-intermediate';
    return 'rating-beginner';
  };

  if (loading) {
    return (
      <div className={`ranking-system ${className}`}>
        <div className="ranking-header">
          <h3>
            <i className="fas fa-trophy"></i>
            Ranking
          </h3>
        </div>
        <div className="ranking-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Carregando rankings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`ranking-system ${className}`}>
      <div className="ranking-header">
        <h3>
          <i className="fas fa-trophy"></i>
          {showGlobalRanking ? 'Ranking Global' : 'Top Jogadores'}
        </h3>

        <div className="timeframe-selector">
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as any)}
            className="timeframe-select"
          >
            <option value="daily">Hoje</option>
            <option value="weekly">Esta Semana</option>
            <option value="monthly">Este Mês</option>
            <option value="all">Todos os Tempos</option>
          </select>
        </div>
      </div>

      {/* User's Current Rank */}
      {userRank && showGlobalRanking && (
        <div className="user-rank-display">
          <div className="user-rank-item">
            <div className="rank-position">
              {getRankIcon(userRank.rank)}
            </div>
            <div className="player-info">
              {userRank.avatar && (
                <img src={userRank.avatar} alt="Seu avatar" className="player-avatar" />
              )}
              <div className="player-details">
                <span className="player-name">Sua Posição</span>
                <div className="player-stats">
                  <span className={`rating ${getRatingColor(userRank.rating)}`}>
                    {userRank.rating}
                  </span>
                  <span className="win-rate">{userRank.winRate.toFixed(1)}% vitórias</span>
                </div>
              </div>
            </div>
            <div className="rank-badge">
              <span className="games-count">{userRank.wins + userRank.losses} jogos</span>
            </div>
          </div>
        </div>
      )}

      {/* Rankings List */}
      <div className="rankings-list">
        {rankings.map((player) => (
          <div
            key={player.id}
            className={`ranking-item ${player.id === user?.id ? 'current-user' : ''}`}
          >
            <div className="rank-position">
              {getRankIcon(player.rank)}
            </div>

            <div className="player-info">
              {player.avatar && (
                <img src={player.avatar} alt={`${player.name} avatar`} className="player-avatar" />
              )}
              <div className="player-details">
                <span className="player-name">
                  {player.name}
                  {player.id === user?.id && <span className="you-indicator">(Você)</span>}
                </span>
                <div className="player-stats">
                  <span className={`rating ${getRatingColor(player.rating)}`}>
                    {player.rating}
                  </span>
                  <span className="win-rate">{player.winRate.toFixed(1)}% vitórias</span>
                </div>
              </div>
            </div>

            <div className="rank-details">
              <div className="games-summary">
                <div className="wins-losses">
                  <span className="wins">{player.wins}V</span>
                  <span className="losses">{player.losses}D</span>
                </div>
                <span className="games-count">{player.wins + player.losses} jogos</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rating Legend */}
      <div className="rating-legend">
        <h4>Categorias de Rating</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="rating rating-master">2000+</span>
            <span>Mestre</span>
          </div>
          <div className="legend-item">
            <span className="rating rating-expert">1800+</span>
            <span>Expert</span>
          </div>
          <div className="legend-item">
            <span className="rating rating-advanced">1600+</span>
            <span>Avançado</span>
          </div>
          <div className="legend-item">
            <span className="rating rating-intermediate">1400+</span>
            <span>Intermediário</span>
          </div>
          <div className="legend-item">
            <span className="rating rating-beginner">1400-</span>
            <span>Iniciante</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingSystem;
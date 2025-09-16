import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
      // Simulação de dados - em produção viria da API
      const mockRankings: PlayerRank[] = [
        {
          id: '1',
          name: 'João Silva',
          rating: 2150,
          wins: 45,
          losses: 12,
          winRate: 78.9,
          rank: 1,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao'
        },
        {
          id: '2',
          name: 'Maria Santos',
          rating: 2089,
          wins: 38,
          losses: 15,
          winRate: 71.7,
          rank: 2,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'
        },
        {
          id: '3',
          name: 'Pedro Costa',
          rating: 1987,
          wins: 34,
          losses: 18,
          winRate: 65.4,
          rank: 3
        },
        {
          id: '4',
          name: 'Ana Oliveira',
          rating: 1923,
          wins: 29,
          losses: 16,
          winRate: 64.4,
          rank: 4
        },
        {
          id: '5',
          name: 'Carlos Lima',
          rating: 1876,
          wins: 25,
          losses: 19,
          winRate: 56.8,
          rank: 5
        },
        {
          id: user?.id || '6',
          name: user?.name || 'Você',
          rating: 1654,
          wins: 18,
          losses: 22,
          winRate: 45.0,
          rank: 8
        }
      ];

      // Simular busca por ranking específico do usuário
      if (user) {
        const currentUser = mockRankings.find(p => p.id === user.id);
        if (currentUser) {
          setUserRank(currentUser);
        }
      }

      setRankings(mockRankings.slice(0, maxPlayers));
    } catch (error) {
      console.error('Erro ao buscar rankings:', error);
    } finally {
      setLoading(false);
    }
  }, [user, maxPlayers]);

  useEffect(() => {
    fetchRankings();
  }, [timeFrame, fetchRankings]);

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
                  <span className="win-rate">{userRank.winRate}% vitórias</span>
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
                  <span className="win-rate">{player.winRate}% vitórias</span>
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
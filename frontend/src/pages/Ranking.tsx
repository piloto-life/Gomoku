import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Ranking.css';

interface PlayerStats {
  user_id: string;
  username: string;
  elo_rating: number;
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
  win_rate: number;
  current_streak: number;
  best_streak: number;
  rank_position: number;
  rank_tier: string;
  avg_moves_per_game: number;
  fastest_win?: number;
}

interface MatchHistory {
  id: string;
  game_id: string;
  player1_username: string;
  player2_username: string;
  winner_id?: string;
  result: string;
  total_moves: number;
  played_at: string;
  player1_elo_change: number;
  player2_elo_change: number;
}

const Ranking: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [myStats, setMyStats] = useState<PlayerStats | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'my-stats' | 'history'>('leaderboard');

  const tiers = [
    { name: 'all', label: 'Todos', color: '#888' },
    { name: 'Bronze', label: 'Bronze', color: '#cd7f32' },
    { name: 'Prata', label: 'Prata', color: '#c0c0c0' },
    { name: 'Ouro', label: 'Ouro', color: '#ffd700' },
    { name: 'Platina', label: 'Platina', color: '#e5e4e2' },
    { name: 'Diamante', label: 'Diamante', color: '#b9f2ff' },
    { name: 'Mestre', label: 'Mestre', color: '#ff6b6b' }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLeaderboard(),
        user ? loadMyStats() : Promise.resolve(),
        user ? loadMatchHistory() : Promise.resolve()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const tierParam = selectedTier !== 'all' ? `&tier=${selectedTier}` : '';
      const response = await fetch(`/api/ranking/leaderboard?limit=100${tierParam}`);
      const data = await response.json();
      setLeaderboard(data.players || []);
    } catch (error) {
      console.error('Erro ao carregar leaderboard:', error);
    }
  };

  const loadMyStats = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ranking/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMyStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar minhas estatísticas:', error);
    }
  };

  const loadMatchHistory = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ranking/history?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMatchHistory(data.matches || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTier, user]);

  const getTierColor = (tier: string): string => {
    const tierInfo = tiers.find(t => t.name === tier);
    return tierInfo?.color || '#888';
  };

  const getTierIcon = (tier: string): string => {
    const icons: { [key: string]: string } = {
      'Bronze': '🥉',
      'Prata': '🥈',
      'Ouro': '🥇',
      'Platina': '💎',
      'Diamante': '💠',
      'Mestre': '👑'
    };
    return icons[tier] || '⭐';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderLeaderboard = () => (
    <div className="leaderboard-container">
      <div className="tier-filters">
        {tiers.map(tier => (
          <button
            key={tier.name}
            className={`tier-filter ${selectedTier === tier.name ? 'active' : ''}`}
            style={{
              borderColor: selectedTier === tier.name ? tier.color : 'transparent',
              color: selectedTier === tier.name ? tier.color : 'inherit'
            }}
            onClick={() => setSelectedTier(tier.name)}
          >
            {tier.label}
          </button>
        ))}
      </div>

      <div className="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Jogador</th>
              <th>Tier</th>
              <th>ELO</th>
              <th>V/D/E</th>
              <th>Win Rate</th>
              <th>Sequência</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => (
              <tr
                key={player.user_id}
                className={`leaderboard-row ${player.user_id === user?.id ? 'my-row' : ''}`}
              >
                <td className="rank-position">
                  {index < 3 ? (
                    <span className={`medal medal-${index + 1}`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    player.rank_position
                  )}
                </td>
                <td className="player-name">
                  {player.username}
                  {player.user_id === user?.id && <span className="you-badge">Você</span>}
                </td>
                <td>
                  <span
                    className="tier-badge"
                    style={{ color: getTierColor(player.rank_tier) }}
                  >
                    {getTierIcon(player.rank_tier)} {player.rank_tier}
                  </span>
                </td>
                <td className="elo-rating">{player.elo_rating}</td>
                <td className="wld-stats">
                  <span className="wins">{player.wins}</span>/
                  <span className="losses">{player.losses}</span>/
                  <span className="draws">{player.draws}</span>
                </td>
                <td className="win-rate">
                  <div className="win-rate-bar">
                    <div
                      className="win-rate-fill"
                      style={{ width: `${player.win_rate * 100}%` }}
                    ></div>
                    <span className="win-rate-text">
                      {(player.win_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className={`streak ${player.current_streak >= 0 ? 'positive' : 'negative'}`}>
                  {player.current_streak > 0 && '+'}
                  {player.current_streak}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leaderboard.length === 0 && (
          <div className="empty-state">
            <p>Nenhum jogador encontrado neste tier</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMyStats = () => {
    if (!user) {
      return (
        <div className="empty-state">
          <p>Faça login para ver suas estatísticas</p>
        </div>
      );
    }

    if (!myStats) {
      return <div className="loading">Carregando estatísticas...</div>;
    }

    return (
      <div className="my-stats-container">
        <div className="stats-overview">
          <div className="stat-card main-stat">
            <div className="stat-icon" style={{ color: getTierColor(myStats.rank_tier) }}>
              {getTierIcon(myStats.rank_tier)}
            </div>
            <div className="stat-content">
              <div className="stat-label">Tier Atual</div>
              <div className="stat-value" style={{ color: getTierColor(myStats.rank_tier) }}>
                {myStats.rank_tier}
              </div>
            </div>
          </div>

          <div className="stat-card main-stat">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-label">Rating ELO</div>
              <div className="stat-value">{myStats.elo_rating}</div>
            </div>
          </div>

          <div className="stat-card main-stat">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">Posição</div>
              <div className="stat-value">#{myStats.rank_position || '?'}</div>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Partidas Jogadas</div>
            <div className="stat-value">{myStats.total_games}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Vitórias</div>
            <div className="stat-value wins">{myStats.wins}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Derrotas</div>
            <div className="stat-value losses">{myStats.losses}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Empates</div>
            <div className="stat-value draws">{myStats.draws}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Win Rate</div>
            <div className="stat-value">{(myStats.win_rate * 100).toFixed(1)}%</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Sequência Atual</div>
            <div className={`stat-value ${myStats.current_streak >= 0 ? 'wins' : 'losses'}`}>
              {myStats.current_streak > 0 && '+'}{myStats.current_streak}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Melhor Sequência</div>
            <div className="stat-value wins">+{myStats.best_streak}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Média de Jogadas</div>
            <div className="stat-value">{myStats.avg_moves_per_game.toFixed(1)}</div>
          </div>

          {myStats.fastest_win && (
            <div className="stat-card">
              <div className="stat-label">Vitória Mais Rápida</div>
              <div className="stat-value wins">{myStats.fastest_win} jogadas</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (!user) {
      return (
        <div className="empty-state">
          <p>Faça login para ver seu histórico</p>
        </div>
      );
    }

    return (
      <div className="history-container">
        <h3>Histórico de Partidas</h3>
        <div className="history-list">
          {matchHistory.map((match) => {
            const isPlayer1 = match.player1_username === user?.username;
            const won = match.winner_id === user?.id;
            const draw = match.result === 'draw';
            const eloChange = isPlayer1 ? match.player1_elo_change : match.player2_elo_change;

            return (
              <div key={match.id} className={`history-item ${won ? 'won' : draw ? 'draw' : 'lost'}`}>
                <div className="match-result">
                  <span className="result-icon">
                    {won ? '✅' : draw ? '🤝' : '❌'}
                  </span>
                  <span className="result-text">
                    {won ? 'Vitória' : draw ? 'Empate' : 'Derrota'}
                  </span>
                </div>

                <div className="match-info">
                  <div className="players">
                    <span className={isPlayer1 ? 'me' : ''}>
                      {match.player1_username}
                    </span>
                    <span className="vs">vs</span>
                    <span className={!isPlayer1 ? 'me' : ''}>
                      {match.player2_username}
                    </span>
                  </div>
                  <div className="match-details">
                    <span>{match.total_moves} jogadas</span>
                    <span>•</span>
                    <span>{formatDate(match.played_at)}</span>
                  </div>
                </div>

                <div className={`elo-change ${eloChange >= 0 ? 'positive' : 'negative'}`}>
                  {eloChange > 0 ? '+' : ''}{eloChange} ELO
                </div>
              </div>
            );
          })}
        </div>

        {matchHistory.length === 0 && (
          <div className="empty-state">
            <p>Nenhuma partida jogada ainda</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ranking-page">
      <div className="ranking-header">
        <h1>🏆 Ranking Global</h1>
        <p>Sistema de classificação baseado em ELO</p>
      </div>

      <div className="ranking-tabs">
        <button
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          📊 Leaderboard
        </button>
        <button
          className={`tab ${activeTab === 'my-stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-stats')}
        >
          📈 Minhas Estatísticas
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 Histórico
        </button>
      </div>

      <div className="ranking-content">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Carregando dados...</p>
          </div>
        ) : (
          <>
            {activeTab === 'leaderboard' && renderLeaderboard()}
            {activeTab === 'my-stats' && renderMyStats()}
            {activeTab === 'history' && renderHistory()}
          </>
        )}
      </div>
    </div>
  );
};

export default Ranking;

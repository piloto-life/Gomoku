import React from 'react';
import { GameState } from '../types';

interface ActiveGamesListProps {
  games: GameState[];
  onSpectate: (gameId: string) => void;
  isLoading: boolean;
  error: string | null;
}

const ActiveGamesList: React.FC<ActiveGamesListProps> = ({ games, onSpectate, isLoading, error }) => {
  if (isLoading) {
    return <p>Carregando jogos ativos...</p>;
  }

  if (error) {
    return <p className="error-message">Não foi possível carregar os jogos.</p>;
  }

  if (!games.length) {
    return <p>Nenhum jogo ativo no momento.</p>;
  }

  return (
    <div className="active-games-list">
      <h3>Active Games</h3>
      <ul>
        {games.map((game) => (
          <li key={game.id}>
            <span>
              {game.players.black.name} vs {game.players.white.name}
            </span>
            <button onClick={() => onSpectate(game.id)} className="btn btn-secondary">
              Spectate
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActiveGamesList;

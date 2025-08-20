import React from 'react';
import { GameState } from '../types';

interface GameInfoProps {
  gameState: GameState;
}

const GameInfo: React.FC<GameInfoProps> = ({ gameState }) => {
  const getCurrentPlayerName = () => {
    return gameState.currentPlayer === 'black' 
      ? gameState.players.black.name 
      : gameState.players.white.name;
  };

  const getGameStatusText = () => {
    switch (gameState.status) {
      case 'waiting':
        return 'Aguardando jogadores...';
      case 'active':
        return `Turno de ${getCurrentPlayerName()}`;
      case 'finished':
        if (gameState.winner === 'draw') {
          return 'Empate!';
        }
        const winnerName = gameState.winner === 'black' 
          ? gameState.players.black.name 
          : gameState.players.white.name;
        return `${winnerName} venceu!`;
      case 'paused':
        return 'Jogo pausado';
      default:
        return 'Status desconhecido';
    }
  };

  return (
    <div className="game-info">
      <h3>Informações da Partida</h3>
      
      <div className="game-status">
        <div className={`status-indicator ${gameState.status}`}>
          {getGameStatusText()}
        </div>
      </div>

      <div className="players-section">
        <h4>Jogadores</h4>
        
        <div className="player-info">
          <div className={`player ${gameState.currentPlayer === 'black' ? 'active' : ''}`}>
            <div className="player-piece">⚫</div>
            <div className="player-details">
              <div className="player-name">{gameState.players.black.name}</div>
              <div className="player-stats">
                Rating: {gameState.players.black.rating}
              </div>
            </div>
          </div>
          
          <div className={`player ${gameState.currentPlayer === 'white' ? 'active' : ''}`}>
            <div className="player-piece">⚪</div>
            <div className="player-details">
              <div className="player-name">{gameState.players.white.name}</div>
              <div className="player-stats">
                Rating: {gameState.players.white.rating}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="game-stats">
        <h4>Estatísticas</h4>
        <div className="stat">
          <span>Movimentos:</span>
          <span>{gameState.moves.length}</span>
        </div>
        <div className="stat">
          <span>Iniciado em:</span>
          <span>{new Date(gameState.createdAt).toLocaleTimeString('pt-BR')}</span>
        </div>
        <div className="stat">
          <span>Duração:</span>
          <span>
            {Math.floor((new Date().getTime() - new Date(gameState.createdAt).getTime()) / 60000)} min
          </span>
        </div>
      </div>

      <div className="last-moves">
        <h4>Últimos Movimentos</h4>
        <div className="moves-list">
          {gameState.moves.slice(-5).reverse().map((move, index) => (
            <div key={move.id} className="move-item">
              <span className="move-number">
                {gameState.moves.length - index}
              </span>
              <span className="move-piece">
                {move.piece === 'black' ? '⚫' : '⚪'}
              </span>
              <span className="move-position">
                {String.fromCharCode(65 + move.position.col)}{move.position.row + 1}
              </span>
            </div>
          ))}
          {gameState.moves.length === 0 && (
            <div className="no-moves">Nenhum movimento ainda</div>
          )}
        </div>
      </div>

      {gameState.status === 'finished' && (
        <div className="game-result">
          <h4>Resultado</h4>
          <div className="result-text">
            {gameState.winner === 'draw' ? (
              'Empate!'
            ) : (
              <>
                <span className="winner">
                  {gameState.winner === 'black' ? '⚫' : '⚪'} 
                  {gameState.winner === 'black' 
                    ? gameState.players.black.name 
                    : gameState.players.white.name
                  }
                </span>
                <span> venceu!</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameInfo;

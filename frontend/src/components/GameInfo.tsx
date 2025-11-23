import React from 'react';
import { GameState } from '../types';
import { useGame } from '../contexts/GameContext';
import PlayerAvatar from './PlayerAvatar';

interface GameInfoProps {
  gameState: GameState;
}

const GameInfo: React.FC<GameInfoProps> = ({ gameState }) => {
  const { aiDifficulty, setAiDifficulty } = useGame();

  const black = gameState.players.black;
  const white = gameState.players.white;

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
        const currentPlayerName = getCurrentPlayerName();
        const isAI = gameState.gameMode === 'pve' && 
                     gameState.currentPlayer === 'white' && 
                     gameState.players.white.id === 'ai';
        
        if (gameState.gameMode === 'pvp-local') {
          return `Turno do Jogador ${gameState.currentPlayer === 'black' ? '1 (⚫)' : '2 (⚪)'}`;
        }
        
        return isAI ? `IA está pensando...` : `Turno de ${currentPlayerName}`;
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

  const isAIGame = gameState.gameMode === 'pve';

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
            <PlayerAvatar size="small" avatarUrl={black.avatar} name={black.name} alt={black.name || 'Black player'} fallbackToAuth={false} />
            <div className="player-details">
              <div className="player-name">
                {black.id === 'ai' ? 'AI' : (black.name && black.name.trim() !== '' ? black.name : <em>Aguardando jogador</em>)}
              </div>
              <div className="player-stats">
                {typeof black.rating === 'number' && black.rating > 0 && <span>Rating: {black.rating}</span>}
              </div>
            </div>
          </div>
          <div className={`player ${gameState.currentPlayer === 'white' ? 'active' : ''}`}>
            <div className="player-piece">⚪</div>
            <PlayerAvatar size="small" avatarUrl={white.avatar} name={white.name} alt={white.name || 'White player'} fallbackToAuth={false} />
            <div className="player-details">
              <div className="player-name">
                {white.id === 'ai' ? 'AI' : (white.name && white.name.trim() !== '' ? white.name : <em>Aguardando jogador</em>)}
              </div>
              <div className="player-stats">
                {typeof white.rating === 'number' && white.rating > 0 && <span>Rating: {white.rating}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Control Section - only show for PvE games */}
      {isAIGame && gameState.status !== 'finished' && (
        <div className="ai-control-section">
          <h4>Configurações da IA</h4>
          <div className="ai-difficulty-controls">
            <label>Dificuldade:</label>
            <select 
              value={aiDifficulty} 
              onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="difficulty-select"
            >
              <option value="easy">Fácil</option>
              <option value="medium">Médio</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
          <div className="ai-info">
            <div className="ai-status">
              {gameState.currentPlayer === 'white' && gameState.players.white.id === 'ai' 
                ? '🤖 IA está pensando...' 
                : '⏳ Aguardando seu movimento'
              }
            </div>
          </div>
        </div>
      )}

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

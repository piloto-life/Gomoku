import React from 'react';
import { GameState, Position } from '../types';
import { useGame } from '../contexts/GameContext';

interface GameBoardProps {
  gameState: GameState;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  const { makeMove } = useGame();

  const handleCellClick = (row: number, col: number) => {
    if (gameState.status !== 'active') return;
    
    // Para modo local (2 jogadores), permitir qualquer jogada
    if (gameState.gameMode === 'pvp-local') {
      const position: Position = { row, col };
      makeMove(position);
      return;
    }
    
    // Para modo PvE, não permitir jogadas quando é a vez da IA
    if (gameState.gameMode === 'pve' && 
        gameState.currentPlayer === 'white' && 
        gameState.players.white.id === 'ai') {
      return;
    }
    
    // Para modo online, verificar se é a vez do jogador atual
    if (gameState.gameMode === 'pvp-online') {
      // TODO: Adicionar verificação de turno para jogador online
    }
    
    const position: Position = { row, col };
    makeMove(position);
  };

  const renderCell = (row: number, col: number) => {
    const cellValue = gameState.board[row][col];
    const isEmpty = cellValue === null;
    
    return (
      <div
        key={`${row}-${col}`}
        className={`board-cell ${isEmpty ? 'empty' : 'occupied'} ${cellValue || ''}`}
        onClick={() => handleCellClick(row, col)}
      >
        {cellValue === 'black' && <div className="piece black">⚫</div>}
        {cellValue === 'white' && <div className="piece white">⚪</div>}
        {isEmpty && <div className="intersection">+</div>}
      </div>
    );
  };

  return (
    <div className="game-board-container">
      <div className="board-coordinates">
        <div className="coord-row top">
          {Array.from({ length: 19 }, (_, i) => (
            <span key={i} className="coord-label">
              {String.fromCharCode(65 + i)}
            </span>
          ))}
        </div>
      </div>
      
      <div className="board-with-coords">
        <div className="coord-column left">
          {Array.from({ length: 19 }, (_, i) => (
            <span key={i} className="coord-label">
              {i + 1}
            </span>
          ))}
        </div>
        
        <div className="game-board">
          {gameState.board.map((row, rowIndex) =>
            row.map((_, colIndex) => renderCell(rowIndex, colIndex))
          )}
        </div>
        
        <div className="coord-column right">
          {Array.from({ length: 19 }, (_, i) => (
            <span key={i} className="coord-label">
              {i + 1}
            </span>
          ))}
        </div>
      </div>
      
      <div className="board-coordinates">
        <div className="coord-row bottom">
          {Array.from({ length: 19 }, (_, i) => (
            <span key={i} className="coord-label">
              {String.fromCharCode(65 + i)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;

import React from 'react';
import { GameState, Position } from '../types';
import logger from '../utils/logger';

interface GameBoardProps {
  gameState: GameState;
  onMove: (position: Position) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onMove }) => {
  React.useEffect(() => {
    logger.componentMount('GameBoard', { gameId: gameState.id, status: gameState.status });
    
    return () => {
      logger.componentUnmount('GameBoard');
    };
  }, [gameState.id, gameState.status]);

  const handleCellClick = (row: number, col: number) => {
    if (gameState.status !== 'active') {
      logger.warn('GAME_BOARD', 'Attempted move on inactive game', { 
        gameId: gameState.id, 
        status: gameState.status, 
        position: { row, col } 
      });
      return;
    }
    
    const cellValue = gameState.board[row][col];
    if (cellValue !== null) {
      logger.warn('GAME_BOARD', 'Attempted move on occupied cell', { 
        gameId: gameState.id, 
        position: { row, col }, 
        cellValue 
      });
      return;
    }
    
    logger.userAction('CELL_CLICKED', 'GameBoard', { 
      gameId: gameState.id, 
      position: { row, col },
      currentPlayer: gameState.currentPlayer 
    });
    
    onMove({ row, col });
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
            row.map((_, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`} onClick={() => handleCellClick(rowIndex, colIndex)}>
                {renderCell(rowIndex, colIndex)}
              </div>
            ))
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

import React, { useState, useRef, useCallback } from 'react';
import { GameState, Position } from '../types';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

interface GameBoardProps {
  gameState: GameState;
  onMove: (position: Position) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onMove }) => {
  const { user } = useAuth();
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const lastMoveTimeRef = useRef<number>(0);
  
  React.useEffect(() => {
    logger.componentMount('GameBoard', { gameId: gameState.id, status: gameState.status });
    
    return () => {
      logger.componentUnmount('GameBoard');
    };
  }, [gameState.id, gameState.status]);

  // Verifica se é o turno do jogador atual
  const isMyTurn = useCallback(() => {
    if (!user || gameState.status !== 'active') return false;
    
    // Para jogos locais, sempre permitir
    if (gameState.gameMode === 'pvp-local') return true;
    
    // Para PvE, só permitir se for turno do jogador humano (preto)
    if (gameState.gameMode === 'pve') {
      return gameState.currentPlayer === 'black';
    }
    
    // Para jogos online, verificar se o jogador atual é quem deve jogar
    if (gameState.gameMode === 'pvp-online') {
      const currentPlayerData = gameState.currentPlayer === 'black' 
        ? gameState.players.black 
        : gameState.players.white;
      
      return currentPlayerData.id === user.id;
    }
    
    return false;
  }, [user, gameState.status, gameState.gameMode, gameState.currentPlayer, gameState.players]);

  const handleCellClick = (row: number, col: number) => {
    // Debounce: evitar cliques múltiplos em menos de 200ms
    const now = Date.now();
    if (now - lastMoveTimeRef.current < 200) {
      logger.debug('GAME_BOARD', 'Click ignored (debounce)', { timeSinceLastMove: now - lastMoveTimeRef.current });
      return;
    }
    
    // Verificar se jogo está ativo
    if (gameState.status !== 'active') {
      logger.warn('GAME_BOARD', 'Attempted move on inactive game', { 
        gameId: gameState.id, 
        status: gameState.status, 
        position: { row, col } 
      });
      return;
    }
    
    // Verificar se é o turno do jogador
    if (!isMyTurn()) {
      logger.warn('GAME_BOARD', 'Not your turn', { 
        gameId: gameState.id, 
        currentPlayer: gameState.currentPlayer,
        userId: user?.id
      });
      return;
    }
    
    // Verificar se já está processando uma jogada
    if (isProcessingMove) {
      logger.debug('GAME_BOARD', 'Move already being processed');
      return;
    }
    
    // Verificar se célula está vazia
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
    
    // Marcar que está processando e atualizar timestamp
    setIsProcessingMove(true);
    lastMoveTimeRef.current = now;
    
    // Fazer a jogada
    onMove({ row, col });
    
    // Resetar flag após um pequeno delay
    setTimeout(() => setIsProcessingMove(false), 300);
  };

  const renderCell = (row: number, col: number) => {
    const cellValue = gameState.board[row][col];
    const isEmpty = cellValue === null;
    const canClick = isEmpty && isMyTurn() && !isProcessingMove && gameState.status === 'active';
    
    return (
      <div
        key={`${row}-${col}`}
        className={`board-cell ${isEmpty ? 'empty' : 'occupied'} ${cellValue || ''} ${canClick ? 'clickable' : 'disabled'}`}
        onClick={() => handleCellClick(row, col)}
        style={{ cursor: canClick ? 'pointer' : 'not-allowed' }}
      >
        {cellValue === 'black' && <div className="piece black">⚫</div>}
        {cellValue === 'white' && <div className="piece white">⚪</div>}
        {isEmpty && canClick && <div className="intersection hover-indicator">+</div>}
        {isEmpty && !canClick && <div className="intersection">+</div>}
      </div>
    );
  };

  return (
    <div className={`game-board-container ${isMyTurn() ? 'my-turn' : 'opponent-turn'} ${isProcessingMove ? 'processing' : ''}`}>
      {/* Indicador de turno */}
      <div className={`turn-indicator ${gameState.currentPlayer}`}>
        {isMyTurn() ? (
          <span className="my-turn-text">
            ✓ Seu turno - Jogando com {gameState.currentPlayer === 'black' ? '⚫' : '⚪'}
          </span>
        ) : (
          <span className="opponent-turn-text">
            ⏳ Aguardando {gameState.currentPlayer === 'black' ? '⚫' : '⚪'}...
          </span>
        )}
      </div>
      
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

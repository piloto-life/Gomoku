import React, { useState, useRef, useCallback, useEffect } from 'react';
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

  const rowsCount = gameState.board?.length ?? 15;
  const colsCount = (gameState.board && gameState.board[0]) ? gameState.board[0].length : rowsCount;
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const [leftWidth, setLeftWidth] = useState<number>(0);
  const [rightWidth, setRightWidth] = useState<number>(0);
  const [boardWidth, setBoardWidth] = useState<number | undefined>(undefined);
  const [boardHeight, setBoardHeight] = useState<number | undefined>(undefined);
  const [cellSize, setCellSize] = useState<number>(32);

  useEffect(() => {
    const containerEl = containerRef.current;
    const leftEl = leftRef.current;
    const rightEl = rightRef.current;
    const boardEl = boardRef.current;
    if (!containerEl) return;

    // Use ResizeObserver if available to measure container and legend sizes
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        const cRect = containerEl.getBoundingClientRect();
        setContainerWidth(cRect.width);
        setBoardHeight(boardEl ? boardEl.getBoundingClientRect().height : undefined);
        setLeftWidth(leftEl ? leftEl.getBoundingClientRect().width : 0);
        setRightWidth(rightEl ? rightEl.getBoundingClientRect().width : 0);
      });
      ro.observe(containerEl);
      if (leftEl) ro.observe(leftEl);
      if (rightEl) ro.observe(rightEl);
      if (boardEl) ro.observe(boardEl);

      // initial measurement
      const cRect = containerEl.getBoundingClientRect();
      setContainerWidth(cRect.width);
      setBoardHeight(boardEl ? boardEl.getBoundingClientRect().height : undefined);
      setLeftWidth(leftEl ? leftEl.getBoundingClientRect().width : 0);
      setRightWidth(rightEl ? rightEl.getBoundingClientRect().width : 0);

      return () => ro.disconnect();
    }

    // Fallback: window resize
    const update = () => {
      const cRect = containerEl.getBoundingClientRect();
      setContainerWidth(cRect.width);
      setBoardHeight(boardEl ? boardEl.getBoundingClientRect().height : undefined);
      setLeftWidth(leftEl ? leftEl.getBoundingClientRect().width : 0);
      setRightWidth(rightEl ? rightEl.getBoundingClientRect().width : 0);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [colsCount, rowsCount]);

  // Compute cell size (px) based on measured container width and legend widths
  useEffect(() => {
    const boardEl = boardRef.current;
    if (!colsCount) return;

    // Determine gap (grid gap) from board element if available
    const styles = boardEl ? window.getComputedStyle(boardEl) : null;
    const gapRaw = styles ? (styles.getPropertyValue('gap') || styles.getPropertyValue('grid-gap') || '1px') : '1px';
    const gapPx = parseFloat(gapRaw) || 1;

    let availableBoardPx: number | undefined = undefined;

    if (typeof containerWidth === 'number') {
      // Subtract left and right legends (if present) to compute center column width
      const left = leftWidth || 0;
      const right = rightWidth || 0;
      // small safety subtract for paddings/gutters
      const safety = 8;
      availableBoardPx = Math.max(0, containerWidth - left - right - safety);
    } else if (boardEl) {
      // Fallback: measure board element directly
      availableBoardPx = boardEl.getBoundingClientRect().width;
    }

    if (!availableBoardPx) return;

    const rawCell = Math.floor((availableBoardPx - (colsCount - 1) * gapPx) / colsCount);
    const minCell = 12;
    const maxCell = 48;
    const size = Math.max(minCell, Math.min(rawCell, maxCell));
    setCellSize(size);

    // Also set an explicit boardWidth (center column) so legends and coord rows can align
    const computedBoardWidth = colsCount * size + (colsCount - 1) * gapPx;
    setBoardWidth(Math.floor(computedBoardWidth));
  }, [containerWidth, leftWidth, rightWidth, colsCount]);

  return (
    <div
      ref={containerRef}
      className={`game-board-container ${isMyTurn() ? 'my-turn' : 'opponent-turn'} ${isProcessingMove ? 'processing' : ''}`}
      style={{ ['--cell-size' as any]: `${cellSize}px` } as React.CSSProperties}
    >
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
      
      <div className="board-coordinates" style={{ ['--cols' as any]: colsCount.toString(), ['--board-width' as any]: boardWidth ? `${boardWidth}px` : undefined } as React.CSSProperties}>
        <div className="coord-row top">
          {Array.from({ length: colsCount }, (_, i) => (
            <span key={i} className="coord-label">
              {String.fromCharCode(65 + i).toUpperCase()}
            </span>
          ))}
        </div>
      </div>
      
      <div className="board-with-coords" style={{ ['--cols' as any]: colsCount.toString(), ['--rows' as any]: rowsCount.toString(), ['--board-width' as any]: boardWidth ? `${boardWidth}px` : undefined } as React.CSSProperties}>
        <div ref={leftRef} className="coord-column left">
          {Array.from({ length: rowsCount }, (_, i) => (
            <span key={i} className="coord-label">
              {i + 1}
            </span>
          ))}
        </div>

        <div className="game-board" ref={boardRef} style={{ ['--cols' as any]: colsCount.toString() } as React.CSSProperties}>
          {gameState.board.map((row, rowIndex) =>
            row.map((_, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`} onClick={() => handleCellClick(rowIndex, colIndex)}>
                {renderCell(rowIndex, colIndex)}
              </div>
            ))
          )}
        </div>

        <div ref={rightRef} className="coord-column right">
          {Array.from({ length: rowsCount }, (_, i) => (
            <span key={i} className="coord-label">
              {i + 1}
            </span>
          ))}
        </div>
      </div>
      
      <div className="board-coordinates" style={{ ['--cols' as any]: colsCount.toString(), ['--board-width' as any]: boardWidth ? `${boardWidth}px` : undefined, ['--board-height' as any]: boardHeight ? `${boardHeight}px` : undefined } as React.CSSProperties}>
        <div className="coord-row bottom">
          {Array.from({ length: colsCount }, (_, i) => (
            <span key={i} className="coord-label">
              {String.fromCharCode(65 + i).toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;

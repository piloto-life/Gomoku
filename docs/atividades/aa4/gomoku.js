/**
 * =====================================================
 * GOMOKU - JAVASCRIPT GAME LOGIC
 * Projeto Web UFSC - INE5646
 * =====================================================
 */

/**
 * =====================================================
 * CONFIGURAÇÕES E CONSTANTES
 * ===================================================== 
 */
const BOARD_SIZE = 19;
const WIN_CONDITION = 5;
const PLAYERS = {
  BLACK: 'black',
  WHITE: 'white'
};

/**
 * =====================================================
 * ESTADO DO JOGO
 * =====================================================
 */
class GameState {
  constructor() {
    this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    this.currentPlayer = PLAYERS.BLACK;
    this.gameActive = true;
    this.moves = [];
    this.moveCount = 0;
    this.gameStartTime = null;
    this.gameTimer = null;
    this.winner = null;
    this.winningSequence = [];
  }

  reset() {
    this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    this.currentPlayer = PLAYERS.BLACK;
    this.gameActive = true;
    this.moves = [];
    this.moveCount = 0;
    this.gameStartTime = Date.now();
    this.winner = null;
    this.winningSequence = [];
    this.startTimer();
  }

  startTimer() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    
    this.gameTimer = setInterval(() => {
      if (this.gameActive) {
        this.updateGameTime();
      }
    }, 1000);
  }

  updateGameTime() {
    const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timeElement = document.getElementById('game-time');
    if (timeElement) {
      timeElement.textContent = timeString;
    }
  }

  makeMove(row, col) {
    if (!this.gameActive || this.board[row][col] !== null) {
      return false;
    }

    this.board[row][col] = this.currentPlayer;
    this.moves.push({ row, col, player: this.currentPlayer });
    this.moveCount++;

    // Verificar vitória
    if (this.checkWin(row, col)) {
      this.gameActive = false;
      this.winner = this.currentPlayer;
      clearInterval(this.gameTimer);
      return true;
    }

    // Verificar empate
    if (this.moveCount >= BOARD_SIZE * BOARD_SIZE) {
      this.gameActive = false;
      this.winner = 'draw';
      clearInterval(this.gameTimer);
      return true;
    }

    // Alternar jogador
    this.currentPlayer = this.currentPlayer === PLAYERS.BLACK ? PLAYERS.WHITE : PLAYERS.BLACK;
    return true;
  }

  checkWin(row, col) {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal principal
      [1, -1]   // diagonal secundária
    ];

    for (const [dx, dy] of directions) {
      const sequence = this.getSequence(row, col, dx, dy);
      if (sequence.length >= WIN_CONDITION) {
        this.winningSequence = sequence;
        return true;
      }
    }

    return false;
  }

  getSequence(row, col, dx, dy) {
    const player = this.board[row][col];
    const sequence = [{ row, col }];

    // Verificar direção positiva
    let r = row + dx;
    let c = col + dy;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.board[r][c] === player) {
      sequence.push({ row: r, col: c });
      r += dx;
      c += dy;
    }

    // Verificar direção negativa
    r = row - dx;
    c = col - dy;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.board[r][c] === player) {
      sequence.unshift({ row: r, col: c });
      r -= dx;
      c -= dy;
    }

    return sequence;
  }

  undoLastMove() {
    if (this.moves.length === 0 || !this.gameActive) return false;

    const lastMove = this.moves.pop();
    this.board[lastMove.row][lastMove.col] = null;
    this.moveCount--;
    this.currentPlayer = lastMove.player;
    
    return true;
  }
}

/**
 * =====================================================
 * GERENCIADOR DO JOGO
 * =====================================================
 */
class GomokuGame {
  constructor() {
    this.gameState = new GameState();
    this.boardElement = null;
    this.cells = [];
    this.soundEnabled = true;
    this.init();
  }

  init() {
    this.setupDOM();
    this.setupEventListeners();
    this.createBoard();
    this.resetGame();
  }

  setupDOM() {
    this.boardElement = document.getElementById('game-board');
    
    // Verificar se os elementos existem
    if (!this.boardElement) {
      console.error('Elemento do tabuleiro não encontrado');
      return;
    }
  }

  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', this.toggleTheme.bind(this));
    }

    // Smooth scrolling para links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        this.resetGame();
      } else if (e.key === 'z' && e.ctrlKey) {
        e.preventDefault();
        this.undoMove();
      }
    });
  }

  createBoard() {
    if (!this.boardElement) return;

    this.boardElement.innerHTML = '';
    this.cells = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      this.cells[row] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = document.createElement('button');
        cell.className = 'board-cell';
        cell.setAttribute('data-row', row);
        cell.setAttribute('data-col', col);
        cell.setAttribute('aria-label', `Célula ${this.getCoordinateLabel(row, col)}`);
        
        cell.addEventListener('click', () => this.handleCellClick(row, col));
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleCellClick(row, col);
          }
        });

        this.boardElement.appendChild(cell);
        this.cells[row][col] = cell;
      }
    }
  }

  getCoordinateLabel(row, col) {
    const letter = String.fromCharCode(65 + col); // A-S
    const number = row + 1; // 1-19
    return `${letter}${number}`;
  }

  handleCellClick(row, col) {
    if (!this.gameState.gameActive || this.gameState.board[row][col] !== null) {
      return;
    }

    const moveSuccessful = this.gameState.makeMove(row, col);
    
    if (moveSuccessful) {
      this.updateBoard();
      this.updateUI();
      this.addMoveToHistory(row, col);

      if (this.gameState.winner) {
        setTimeout(() => this.showGameResult(), 500);
      }
    }
  }

  updateBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = this.cells[row][col];
        const piece = this.gameState.board[row][col];
        
        // Limpar célula
        cell.innerHTML = '';
        cell.classList.remove('occupied');
        
        if (piece) {
          cell.classList.add('occupied');
          const pieceElement = document.createElement('div');
          pieceElement.className = `piece ${piece}`;
          
          // Verificar se faz parte da sequência vencedora
          const isWinning = this.gameState.winningSequence.some(
            pos => pos.row === row && pos.col === col
          );
          
          if (isWinning) {
            pieceElement.classList.add('winning');
          }
          
          cell.appendChild(pieceElement);
        }
      }
    }
  }

  updateUI() {
    // Atualizar indicador de turno
    const playerTurnElement = document.getElementById('player-turn');
    if (playerTurnElement) {
      playerTurnElement.textContent = this.gameState.currentPlayer === PLAYERS.BLACK ? 'Preto' : 'Branco';
    }

    // Atualizar status dos jogadores
    this.updatePlayerStatus();

    // Atualizar contador de movimentos
    const moveCountElement = document.getElementById('move-count');
    if (moveCountElement) {
      moveCountElement.textContent = this.gameState.moveCount;
    }
  }

  updatePlayerStatus() {
    const player1Status = document.getElementById('player1-status');
    const player2Status = document.getElementById('player2-status');
    
    if (player1Status && player2Status) {
      if (this.gameState.currentPlayer === PLAYERS.BLACK) {
        player1Status.textContent = 'Sua vez';
        player1Status.className = 'player-status active';
        player2Status.textContent = 'Aguardando';
        player2Status.className = 'player-status';
      } else {
        player1Status.textContent = 'Aguardando';
        player1Status.className = 'player-status';
        player2Status.textContent = 'Sua vez';
        player2Status.className = 'player-status active';
      }
    }

    // Atualizar classes dos jogadores
    const blackPlayer = document.querySelector('.player-black');
    const whitePlayer = document.querySelector('.player-white');
    
    if (blackPlayer && whitePlayer) {
      blackPlayer.classList.toggle('active', this.gameState.currentPlayer === PLAYERS.BLACK);
      whitePlayer.classList.toggle('active', this.gameState.currentPlayer === PLAYERS.WHITE);
    }
  }

  addMoveToHistory(row, col) {
    const movesList = document.getElementById('moves-list');
    if (!movesList) return;

    const coordinate = this.getCoordinateLabel(row, col);
    const player = this.gameState.currentPlayer === PLAYERS.BLACK ? 'Preto' : 'Branco';
    const moveText = `${this.gameState.moveCount}. ${player} em ${coordinate}`;

    const listItem = document.createElement('li');
    listItem.textContent = moveText;
    
    movesList.appendChild(listItem);
    
    // Manter apenas os últimos 10 movimentos visíveis
    while (movesList.children.length > 10) {
      movesList.removeChild(movesList.firstChild);
    }
    
    // Scroll para o último movimento
    movesList.scrollTop = movesList.scrollHeight;
  }

  showGameResult() {
    const modal = document.getElementById('game-result-modal');
    const title = document.getElementById('result-title');
    const message = document.getElementById('result-message');
    
    if (!modal || !title || !message) return;

    if (this.gameState.winner === 'draw') {
      title.textContent = 'Empate!';
      message.textContent = 'O tabuleiro está cheio. Nenhum jogador conseguiu formar 5 em linha.';
    } else {
      const winnerName = this.gameState.winner === PLAYERS.BLACK ? 'Jogador Preto' : 'Jogador Branco';
      title.textContent = 'Vitória!';
      message.textContent = `${winnerName} venceu formando 5 peças em linha!`;
    }

    modal.classList.remove('hidden');
    
    // Focar no botão de novo jogo
    const newGameBtn = modal.querySelector('.btn-primary');
    if (newGameBtn) {
      newGameBtn.focus();
    }
  }

  closeModal() {
    const modal = document.getElementById('game-result-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  resetGame() {
    this.gameState.reset();
    this.updateBoard();
    this.updateUI();
    this.closeModal();
    
    // Limpar histórico de movimentos
    const movesList = document.getElementById('moves-list');
    if (movesList) {
      movesList.innerHTML = '<li>Jogo iniciado</li>';
    }
    
    // Focar no centro do tabuleiro
    const centerCell = this.cells[9][9];
    if (centerCell) {
      centerCell.focus();
    }
  }

  undoMove() {
    if (this.gameState.undoLastMove()) {
      this.updateBoard();
      this.updateUI();
      
      // Remover último movimento do histórico
      const movesList = document.getElementById('moves-list');
      if (movesList && movesList.children.length > 1) {
        movesList.removeChild(movesList.lastChild);
      }
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('gomoku-theme', newTheme);
    
    // Animar a transição
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setTimeout(() => {
      document.body.style.transition = '';
    }, 300);
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('gomoku-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Detectar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }
}

/**
 * =====================================================
 * FUNÇÕES GLOBAIS
 * =====================================================
 */
let game = null;

function startGame() {
  const gameSection = document.getElementById('game');
  if (gameSection) {
    gameSection.scrollIntoView({ behavior: 'smooth' });
  }
  
  if (game) {
    game.resetGame();
  }
}

function resetGame() {
  if (game) {
    game.resetGame();
  }
}

function undoMove() {
  if (game) {
    game.undoMove();
  }
}

function showRules() {
  const rulesSection = document.getElementById('rules');
  if (rulesSection) {
    rulesSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function closeModal() {
  if (game) {
    game.closeModal();
  }
}

/**
 * =====================================================
 * UTILITÁRIOS
 * =====================================================
 */
function showNotification(message, type = 'info') {
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Estilos inline para a notificação
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 24px',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '500',
    zIndex: '9999',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease',
    maxWidth: '300px'
  });
  
  // Cores por tipo
  const colors = {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };
  
  notification.style.backgroundColor = colors[type] || colors.info;
  
  document.body.appendChild(notification);
  
  // Animar entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Remover após 3 segundos
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * =====================================================
 * INICIALIZAÇÃO
 * =====================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  // Carregar tema salvo
  const savedTheme = localStorage.getItem('gomoku-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    // Detectar preferência do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
  
  // Inicializar jogo
  game = new GomokuGame();
  
  // Adicionar listener para mudança de preferência de tema do sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('gomoku-theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
  
  // Adicionar listener para visibilidade da página
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game && game.gameState.gameTimer) {
      // Pausar timer quando a página não está visível
      clearInterval(game.gameState.gameTimer);
    } else if (!document.hidden && game && game.gameState.gameActive) {
      // Retomar timer quando a página fica visível novamente
      game.gameState.startTimer();
    }
  });
  
  // Adicionar handler para fechar modal com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('game-result-modal');
      if (modal && !modal.classList.contains('hidden')) {
        closeModal();
      }
    }
  });
  
  // Mostrar notificação de boas-vindas
  setTimeout(() => {
    showNotification('Bem-vindo ao Gomoku UFSC! Use Ctrl+R para novo jogo e Ctrl+Z para desfazer.', 'info');
  }, 1000);
});

/**
 * =====================================================
 * SERVICE WORKER (OPCIONAL - PARA PWA)
 * =====================================================
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Registrar service worker apenas se existir
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered: ', registration);
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

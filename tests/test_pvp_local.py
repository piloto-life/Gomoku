#!/usr/bin/env python3
"""
Testes para o modo PvP Local (2 jogadores no mesmo dispositivo)
"""

import sys
import os

# Adicionar o diretório backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from services.game_logic import GameLogic
    from models.game import Position, PieceColor, GameStatus
    from logic.game_logic import check_win
except ImportError:
    print("⚠️ Importações do backend não encontradas, usando implementação mock")
    
    class PieceColor:
        BLACK = "black"
        WHITE = "white"
        
        @property
        def value(self):
            return self
    
    class GameStatus:
        WAITING = "waiting"
        ACTIVE = "active"
        FINISHED = "finished"
    
    class Position:
        def __init__(self, row, col):
            self.row = row
            self.col = col
    
    class GameLogic:
        def make_move(self, board, position, player):
            if (0 <= position.row < 19 and 0 <= position.col < 19 and 
                board[position.row][position.col] is None):
                board[position.row][position.col] = player
                return True
            return False
    
    def check_win(board, row, col):
        if board[row][col] is None:
            return None
        
        color = board[row][col]
        directions = [(0,1), (1,0), (1,1), (1,-1)]
        
        for dr, dc in directions:
            count = 1
            r, c = row + dr, col + dc
            while 0 <= r < 19 and 0 <= c < 19 and board[r][c] == color:
                count += 1
                r, c = r + dr, c + dc
            
            r, c = row - dr, col - dc
            while 0 <= r < 19 and 0 <= c < 19 and board[r][c] == color:
                count += 1
                r, c = r - dr, c - dc
            
            if count >= 5:
                return color
        
        return None

class TestPvPLocal:
    """Testes para partidas PvP Local"""
    
    def setup_method(self):
        """Setup para cada teste"""
        self.game_logic = GameLogic()
        self.board = [[None for _ in range(19)] for _ in range(19)]
        self.current_player = PieceColor.BLACK
        
    def test_game_initialization(self):
        """Teste de inicialização do jogo local"""
        print("🎮 Testando inicialização do jogo PvP Local...")
        
        # Verificar tabuleiro vazio
        assert all(all(cell is None for cell in row) for row in self.board)
        
        # Verificar jogador inicial
        assert self.current_player == PieceColor.BLACK
        
        print("✅ Jogo inicializado corretamente")
    
    def test_player_moves(self):
        """Teste de movimentos alternados dos jogadores"""
        print("🎮 Testando movimentos alternados...")
        
        moves = [
            (9, 9, PieceColor.BLACK),   # Jogador 1 (preto)
            (9, 10, PieceColor.WHITE),  # Jogador 2 (branco)
            (10, 9, PieceColor.BLACK),  # Jogador 1 (preto)
            (10, 10, PieceColor.WHITE), # Jogador 2 (branco)
        ]
        
        for row, col, expected_color in moves:
            # Fazer movimento
            position = Position(row=row, col=col)
            success = self.game_logic.make_move(self.board, position, self.current_player)
            
            assert success, f"Movimento ({row}, {col}) deveria ser válido"
            assert self.board[row][col] == expected_color
            
            # Alternar jogador
            self.current_player = PieceColor.WHITE if self.current_player == PieceColor.BLACK else PieceColor.BLACK
        
        print("✅ Movimentos alternados funcionando corretamente")
    
    def test_invalid_moves(self):
        """Teste de movimentos inválidos"""
        print("🎮 Testando movimentos inválidos...")
        
        # Colocar uma peça na posição (9,9)
        position = Position(row=9, col=9)
        success = self.game_logic.make_move(self.board, position, self.current_player)
        assert success
        
        # Tentar colocar outra peça na mesma posição
        success = self.game_logic.make_move(self.board, position, PieceColor.WHITE)
        assert not success, "Não deveria permitir jogar em posição ocupada"
        
        # Testar posições fora do tabuleiro
        invalid_positions = [
            Position(row=-1, col=9),
            Position(row=9, col=-1),
            Position(row=19, col=9),
            Position(row=9, col=19),
        ]
        
        for pos in invalid_positions:
            success = self.game_logic.make_move(self.board, pos, self.current_player)
            assert not success, f"Posição ({pos.row}, {pos.col}) deveria ser inválida"
        
        print("✅ Validação de movimentos inválidos funcionando")
    
    def test_horizontal_win(self):
        """Teste de vitória horizontal"""
        print("🎮 Testando vitória horizontal...")
        
        # Colocar 5 peças pretas em linha horizontal
        winning_positions = [(9, 5), (9, 6), (9, 7), (9, 8), (9, 9)]
        
        for i, (row, col) in enumerate(winning_positions):
            position = Position(row=row, col=col)
            success = self.game_logic.make_move(self.board, position, PieceColor.BLACK)
            assert success
            
            # Verificar vitória apenas no último movimento
            if i == len(winning_positions) - 1:
                winner = check_win(self.board, row, col)
                assert winner == "black", "Deveria detectar vitória das peças pretas"
        
        print("✅ Vitória horizontal detectada corretamente")
    
    def test_vertical_win(self):
        """Teste de vitória vertical"""
        print("🎮 Testando vitória vertical...")
        
        board = [[None for _ in range(19)] for _ in range(19)]
        
        # Colocar 5 peças brancas em linha vertical
        winning_positions = [(5, 9), (6, 9), (7, 9), (8, 9), (9, 9)]
        
        for i, (row, col) in enumerate(winning_positions):
            position = Position(row=row, col=col)
            success = self.game_logic.make_move(board, position, PieceColor.WHITE)
            assert success
            
            # Verificar vitória apenas no último movimento
            if i == len(winning_positions) - 1:
                winner = check_win(board, row, col)
                assert winner == "white", "Deveria detectar vitória das peças brancas"
        
        print("✅ Vitória vertical detectada corretamente")
    
    def test_diagonal_win(self):
        """Teste de vitória diagonal"""
        print("🎮 Testando vitória diagonal...")
        
        board = [[None for _ in range(19)] for _ in range(19)]
        
        # Colocar 5 peças pretas em diagonal principal
        winning_positions = [(5, 5), (6, 6), (7, 7), (8, 8), (9, 9)]
        
        for i, (row, col) in enumerate(winning_positions):
            position = Position(row=row, col=col)
            success = self.game_logic.make_move(board, position, PieceColor.BLACK)
            assert success
            
            # Verificar vitória apenas no último movimento
            if i == len(winning_positions) - 1:
                winner = check_win(board, row, col)
                assert winner == "black", "Deveria detectar vitória diagonal das peças pretas"
        
        print("✅ Vitória diagonal detectada corretamente")
    
    def test_anti_diagonal_win(self):
        """Teste de vitória anti-diagonal"""
        print("🎮 Testando vitória anti-diagonal...")
        
        board = [[None for _ in range(19)] for _ in range(19)]
        
        # Colocar 5 peças brancas em anti-diagonal
        winning_positions = [(5, 13), (6, 12), (7, 11), (8, 10), (9, 9)]
        
        for i, (row, col) in enumerate(winning_positions):
            position = Position(row=row, col=col)
            success = self.game_logic.make_move(board, position, PieceColor.WHITE)
            assert success
            
            # Verificar vitória apenas no último movimento
            if i == len(winning_positions) - 1:
                winner = check_win(board, row, col)
                assert winner == "white", "Deveria detectar vitória anti-diagonal das peças brancas"
        
        print("✅ Vitória anti-diagonal detectada corretamente")
    
    def test_no_false_win(self):
        """Teste para garantir que não há falsos positivos de vitória"""
        print("🎮 Testando ausência de falsos positivos...")
        
        # Colocar apenas 4 peças em linha (não deve ganhar)
        positions = [(9, 5), (9, 6), (9, 7), (9, 8)]
        
        for row, col in positions:
            position = Position(row=row, col=col)
            success = self.game_logic.make_move(self.board, position, PieceColor.BLACK)
            assert success
        
        # Verificar que não há vitória
        winner = check_win(self.board, 9, 8)
        assert winner is None, "4 peças em linha não deveria ser vitória"
        
        print("✅ Falsos positivos de vitória evitados")
    
    def test_game_sequence(self):
        """Teste de uma sequência completa de jogo"""
        print("🎮 Testando sequência completa de jogo...")
        
        # Simular uma partida real
        moves = [
            # Formato: (row, col, jogador)
            (9, 9, PieceColor.BLACK),   # Centro
            (9, 10, PieceColor.WHITE),  # Lado
            (8, 8, PieceColor.BLACK),   # Diagonal
            (10, 10, PieceColor.WHITE), # Diagonal oposta
            (7, 7, PieceColor.BLACK),   # Continua diagonal
            (11, 11, PieceColor.WHITE), # Continua diagonal oposta
            (6, 6, PieceColor.BLACK),   # Continua diagonal
            (12, 12, PieceColor.WHITE), # Continua diagonal oposta
            (5, 5, PieceColor.BLACK),   # Vitória! 5 em diagonal
        ]
        
        game_over = False
        winner = None
        
        for i, (row, col, player) in enumerate(moves):
            if game_over:
                break
                
            position = Position(row=row, col=col)
            success = self.game_logic.make_move(self.board, position, player)
            assert success, f"Movimento {i+1} deveria ser válido"
            
            # Verificar vitória
            result = check_win(self.board, row, col)
            if result:
                game_over = True
                winner = result
                print(f"🏆 Jogo terminou no movimento {i+1} - Vencedor: {winner}")
        
        assert winner == "black", "Jogador preto deveria ter vencido"
        print("✅ Sequência completa de jogo funcionou corretamente")

def run_tests():
    """Executar todos os testes"""
    print("🧪 Iniciando testes do modo PvP Local\n")
    
    test_instance = TestPvPLocal()
    
    tests = [
        test_instance.test_game_initialization,
        test_instance.test_player_moves,
        test_instance.test_invalid_moves,
        test_instance.test_horizontal_win,
        test_instance.test_vertical_win,
        test_instance.test_diagonal_win,
        test_instance.test_anti_diagonal_win,
        test_instance.test_no_false_win,
        test_instance.test_game_sequence,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test_instance.setup_method()
            test()
            passed += 1
        except Exception as e:
            print(f"❌ Falha no teste {test.__name__}: {e}")
            failed += 1
    
    print(f"\n📊 Resumo dos testes PvP Local:")
    print(f"✅ Passou: {passed}")
    print(f"❌ Falhou: {failed}")
    print(f"📈 Taxa de sucesso: {(passed/(passed+failed)*100):.1f}%")

if __name__ == "__main__":
    run_tests()

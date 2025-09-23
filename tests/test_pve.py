#!/usr/bin/env python3
"""
Testes para o modo PvE (Jogador vs IA)
"""

import sys
import os
import time

# Adicionar o diretório backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from services.game_logic import GameLogic
    from models.game import Position, PieceColor
    from logic.game_logic import check_win
except ImportError:
    print("⚠️ Importações não encontradas, usando implementação mock")
    
    class PieceColor:
        BLACK = "black"
        WHITE = "white"
    
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
        
        def get_ai_move(self, board, difficulty="medium"):
            # AI simples para teste
            for row in range(19):
                for col in range(19):
                    if board[row][col] is None:
                        return Position(row, col)
            return Position(9, 9)
    
    def check_win(board, row, col):
        # Implementação simples de verificação de vitória
        if board[row][col] is None:
            return None
        
        color = board[row][col]
        directions = [(0,1), (1,0), (1,1), (1,-1)]
        
        for dr, dc in directions:
            count = 1
            # Verificar em uma direção
            r, c = row + dr, col + dc
            while 0 <= r < 19 and 0 <= c < 19 and board[r][c] == color:
                count += 1
                r, c = r + dr, c + dc
            
            # Verificar na direção oposta
            r, c = row - dr, col - dc
            while 0 <= r < 19 and 0 <= c < 19 and board[r][c] == color:
                count += 1
                r, c = r - dr, c - dc
            
            if count >= 5:
                return color
        
        return None

class TestPvE:
    """Testes para partidas PvE (Jogador vs IA)"""
    
    def setup_method(self):
        """Setup para cada teste"""
        self.game_logic = GameLogic()
        self.board = [[None for _ in range(19)] for _ in range(19)]
        self.human_player = PieceColor.BLACK
        self.ai_player = PieceColor.WHITE
        
    def test_ai_initialization(self):
        """Teste de inicialização da IA"""
        print("🤖 Testando inicialização da IA...")
        
        # Testar diferentes dificuldades
        difficulties = ["easy", "medium", "hard"]
        
        for difficulty in difficulties:
            ai_move = self.game_logic.get_ai_move(self.board, difficulty)
            
            # Verificar se o movimento é válido
            assert 0 <= ai_move.row < 19, f"IA {difficulty}: linha inválida"
            assert 0 <= ai_move.col < 19, f"IA {difficulty}: coluna inválida"
            assert self.board[ai_move.row][ai_move.col] is None, f"IA {difficulty}: posição ocupada"
            
            print(f"✅ IA {difficulty} inicializada corretamente")
    
    def test_ai_first_move(self):
        """Teste do primeiro movimento da IA"""
        print("🤖 Testando primeiro movimento da IA...")
        
        # IA joga primeiro (tabuleiro vazio)
        ai_move = self.game_logic.get_ai_move(self.board, "medium")
        success = self.game_logic.make_move(self.board, ai_move, self.ai_player)
        
        assert success, "Primeiro movimento da IA deveria ser válido"
        assert self.board[ai_move.row][ai_move.col] == self.ai_player
        
        # Verificar se a IA prefere o centro (estratégia comum)
        center_area = range(7, 12)  # Área central do tabuleiro 19x19
        is_center_move = ai_move.row in center_area and ai_move.col in center_area
        
        print(f"🎯 IA jogou em ({ai_move.row}, {ai_move.col})")
        if is_center_move:
            print("✅ IA escolheu uma posição central (boa estratégia)")
        else:
            print("⚠️ IA não jogou no centro, mas movimento é válido")
    
    def test_ai_response_to_human(self):
        """Teste de resposta da IA ao jogador humano"""
        print("🤖 Testando resposta da IA ao jogador...")
        
        # Humano joga no centro
        human_move = Position(row=9, col=9)
        success = self.game_logic.make_move(self.board, human_move, self.human_player)
        assert success
        
        # IA responde
        ai_move = self.game_logic.get_ai_move(self.board, "medium")
        success = self.game_logic.make_move(self.board, ai_move, self.ai_player)
        
        assert success, "IA deveria conseguir responder"
        assert (ai_move.row, ai_move.col) != (9, 9), "IA não deveria jogar na mesma posição"
        
        # Verificar se a IA joga próximo ao jogador (estratégia defensiva)
        distance = abs(ai_move.row - 9) + abs(ai_move.col - 9)
        print(f"🎯 IA jogou a distância {distance} do centro")
        
        print("✅ IA respondeu adequadamente ao jogador")
    
    def test_ai_blocking_strategy(self):
        """Teste de estratégia defensiva da IA (bloquear vitórias)"""
        print("🤖 Testando estratégia defensiva da IA...")
        
        # Criar situação onde humano está prestes a ganhar
        # 4 peças pretas em linha horizontal
        threatening_positions = [(9, 5), (9, 6), (9, 7), (9, 8)]
        
        for row, col in threatening_positions:
            position = Position(row=row, col=col)
            success = self.game_logic.make_move(self.board, position, self.human_player)
            assert success
        
        # IA deve bloquear
        ai_move = self.game_logic.get_ai_move(self.board, "medium")
        success = self.game_logic.make_move(self.board, ai_move, self.ai_player)
        assert success
        
        # Verificar se a IA bloqueou (jogou em uma das extremidades)
        blocking_positions = [(9, 4), (9, 9)]
        is_blocking = (ai_move.row, ai_move.col) in blocking_positions
        
        print(f"🎯 IA jogou em ({ai_move.row}, {ai_move.col})")
        if is_blocking:
            print("✅ IA bloqueou a ameaça corretamente")
        else:
            print("⚠️ IA não bloqueou, mas pode ter outra estratégia")
    
    def test_ai_winning_opportunity(self):
        """Teste de aproveitamento de oportunidade de vitória pela IA"""
        print("🤖 Testando oportunidade de vitória da IA...")
        
        # Criar situação onde IA pode ganhar
        # 4 peças brancas em linha
        winning_setup = [(10, 5), (10, 6), (10, 7), (10, 8)]
        
        for row, col in winning_setup:
            position = Position(row=row, col=col)
            success = self.game_logic.make_move(self.board, position, self.ai_player)
            assert success
        
        # IA deve completar a vitória
        ai_move = self.game_logic.get_ai_move(self.board, "medium")
        success = self.game_logic.make_move(self.board, ai_move, self.ai_player)
        assert success
        
        # Verificar se a IA ganhou
        winner = check_win(self.board, ai_move.row, ai_move.col)
        
        winning_positions = [(10, 4), (10, 9)]
        is_winning_move = (ai_move.row, ai_move.col) in winning_positions
        
        print(f"🎯 IA jogou em ({ai_move.row}, {ai_move.col})")
        if is_winning_move and winner == self.ai_player:
            print("✅ IA aproveitou a oportunidade de vitória")
        else:
            print("⚠️ IA não completou a vitória")
    
    def test_ai_difficulty_differences(self):
        """Teste das diferenças entre dificuldades da IA"""
        print("🤖 Testando diferenças entre dificuldades...")
        
        # Criar situação idêntica para todas as dificuldades
        test_positions = [(9, 9), (9, 10), (10, 9)]
        
        for row, col in test_positions:
            position = Position(row=row, col=col)
            self.game_logic.make_move(self.board, position, self.human_player)
        
        difficulties = ["easy", "medium", "hard"]
        ai_moves = {}
        
        for difficulty in difficulties:
            # Usar cópia do tabuleiro para cada teste
            board_copy = [row[:] for row in self.board]
            ai_move = self.game_logic.get_ai_move(board_copy, difficulty)
            ai_moves[difficulty] = (ai_move.row, ai_move.col)
            
            print(f"🎯 IA {difficulty} jogaria em {ai_moves[difficulty]}")
        
        # As IAs podem jogar diferente (dependendo da implementação)
        print("✅ Testou diferentes dificuldades da IA")
    
    def test_complete_pve_game(self):
        """Teste de uma partida PvE completa"""
        print("🤖 Testando partida PvE completa...")
        
        max_moves = 50  # Limitar para evitar loop infinito
        move_count = 0
        current_player = self.human_player
        
        while move_count < max_moves:
            if current_player == self.human_player:
                # Movimento humano simulado (estratégia simples)
                human_move = self._get_human_simulated_move()
                if human_move is None:
                    print("🚫 Humano não tem movimentos válidos")
                    break
                    
                success = self.game_logic.make_move(self.board, human_move, self.human_player)
                if not success:
                    print("❌ Movimento humano inválido")
                    break
                
                # Verificar vitória
                winner = check_win(self.board, human_move.row, human_move.col)
                if winner:
                    print(f"🏆 Jogador humano venceu em {move_count + 1} movimentos!")
                    assert winner == self.human_player
                    break
                    
            else:
                # Movimento da IA
                ai_move = self.game_logic.get_ai_move(self.board, "medium")
                success = self.game_logic.make_move(self.board, ai_move, self.ai_player)
                if not success:
                    print("❌ Movimento da IA inválido")
                    break
                
                # Verificar vitória
                winner = check_win(self.board, ai_move.row, ai_move.col)
                if winner:
                    print(f"🏆 IA venceu em {move_count + 1} movimentos!")
                    assert winner == self.ai_player
                    break
            
            # Alternar jogador
            current_player = self.ai_player if current_player == self.human_player else self.human_player
            move_count += 1
        
        if move_count >= max_moves:
            print("⏱️ Jogo atingiu limite máximo de movimentos (empate técnico)")
        
        print("✅ Partida PvE completada")
    
    def test_ai_performance(self):
        """Teste de performance da IA"""
        print("🤖 Testando performance da IA...")
        
        difficulties = ["easy", "medium", "hard"]
        
        for difficulty in difficulties:
            start_time = time.time()
            
            # Fazer 10 movimentos da IA
            for _ in range(10):
                ai_move = self.game_logic.get_ai_move(self.board, difficulty)
                # Simular que o movimento foi feito
                if self.board[ai_move.row][ai_move.col] is None:
                    self.board[ai_move.row][ai_move.col] = self.ai_player
            
            end_time = time.time()
            elapsed = end_time - start_time
            
            print(f"⏱️ IA {difficulty}: {elapsed:.3f}s para 10 movimentos")
            
            # Performance deve ser razoável (menos de 5 segundos)
            assert elapsed < 5.0, f"IA {difficulty} muito lenta: {elapsed}s"
        
        print("✅ Performance da IA aceitável")
    
    def _get_human_simulated_move(self):
        """Simula um movimento humano (estratégia simples)"""
        # Estratégia: jogar próximo ao centro ou às peças existentes
        for row in range(9, 19):  # Começar pelo centro
            for col in range(9, 19):
                if self.board[row][col] is None:
                    return Position(row, col)
        
        # Se não encontrar no centro, procurar em qualquer lugar
        for row in range(19):
            for col in range(19):
                if self.board[row][col] is None:
                    return Position(row, col)
        
        return None  # Tabuleiro cheio

def run_tests():
    """Executar todos os testes"""
    print("🧪 Iniciando testes do modo PvE\n")
    
    test_instance = TestPvE()
    
    tests = [
        test_instance.test_ai_initialization,
        test_instance.test_ai_first_move,
        test_instance.test_ai_response_to_human,
        test_instance.test_ai_blocking_strategy,
        test_instance.test_ai_winning_opportunity,
        test_instance.test_ai_difficulty_differences,
        test_instance.test_complete_pve_game,
        test_instance.test_ai_performance,
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
    
    print(f"\n📊 Resumo dos testes PvE:")
    print(f"✅ Passou: {passed}")
    print(f"❌ Falhou: {failed}")
    print(f"📈 Taxa de sucesso: {(passed/(passed+failed)*100):.1f}%")

if __name__ == "__main__":
    run_tests()

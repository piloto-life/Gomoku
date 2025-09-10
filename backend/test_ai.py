#!/usr/bin/env python3
"""
Script de teste para verificar o funcionamento da IA do Gomoku
"""

from services.game_logic import GameLogic
from models.game import Position, PieceColor

def test_ai_basic():
    """Teste básico da IA"""
    print("=== Teste Básico da IA ===")
    
    game_logic = GameLogic()
    
    # Tabuleiro vazio
    empty_board = [[None for _ in range(19)] for _ in range(19)]
    
    # Teste IA fácil
    print("Testando IA fácil...")
    ai_move = game_logic.get_ai_move(empty_board, difficulty="easy")
    print(f"Movimento da IA (fácil): {ai_move.row}, {ai_move.col}")
    
    # Teste IA média
    print("Testando IA média...")
    ai_move = game_logic.get_ai_move(empty_board, difficulty="medium")
    print(f"Movimento da IA (média): {ai_move.row}, {ai_move.col}")
    
    # Teste IA difícil
    print("Testando IA difícil...")
    ai_move = game_logic.get_ai_move(empty_board, difficulty="hard")
    print(f"Movimento da IA (difícil): {ai_move.row}, {ai_move.col}")

def test_ai_strategic():
    """Teste estratégico da IA"""
    print("\n=== Teste Estratégico da IA ===")
    
    game_logic = GameLogic()
    
    # Criar um tabuleiro com algumas peças
    board = [[None for _ in range(19)] for _ in range(19)]
    
    # Simular uma situação onde o jogador está prestes a ganhar
    # Colocar 4 peças pretas em linha
    board[9][5] = "black"
    board[9][6] = "black"
    board[9][7] = "black"
    board[9][8] = "black"
    # A posição [9][9] seria a vitória
    
    print("Situação: Jogador preto tem 4 em linha, IA precisa bloquear")
    ai_move = game_logic.get_ai_move(board, difficulty="medium")
    print(f"IA deve jogar em (9,9) ou (9,4). Jogou em: ({ai_move.row}, {ai_move.col})")
    
    expected_positions = [(9, 9), (9, 4)]
    if (ai_move.row, ai_move.col) in expected_positions:
        print("✅ IA bloqueou corretamente!")
    else:
        print("❌ IA não bloqueou adequadamente.")

def test_ai_winning():
    """Teste de situação de vitória da IA"""
    print("\n=== Teste de Vitória da IA ===")
    
    game_logic = GameLogic()
    
    # Criar um tabuleiro onde a IA pode ganhar
    board = [[None for _ in range(19)] for _ in range(19)]
    
    # Colocar 4 peças brancas (IA) em linha
    board[10][5] = "white"
    board[10][6] = "white"
    board[10][7] = "white"
    board[10][8] = "white"
    # A posição [10][9] seria a vitória
    
    print("Situação: IA tem 4 em linha, pode ganhar")
    ai_move = game_logic.get_ai_move(board, difficulty="medium")
    print(f"IA deve jogar em (10,9) ou (10,4). Jogou em: ({ai_move.row}, {ai_move.col})")
    
    expected_positions = [(10, 9), (10, 4)]
    if (ai_move.row, ai_move.col) in expected_positions:
        print("✅ IA pode ganhar!")
    else:
        print("❌ IA perdeu a oportunidade de ganhar.")

def test_win_detection():
    """Teste de detecção de vitória"""
    print("\n=== Teste de Detecção de Vitória ===")
    
    game_logic = GameLogic()
    
    # Criar um tabuleiro com 5 em linha
    board = [[None for _ in range(19)] for _ in range(19)]
    
    # 5 peças pretas em linha horizontal
    for i in range(5):
        board[9][5 + i] = "black"
    
    # Testar detecção de vitória
    winner = game_logic.check_winner(board, Position(row=9, col=8), PieceColor.BLACK)
    
    if winner == PieceColor.BLACK:
        print("✅ Vitória detectada corretamente!")
    else:
        print("❌ Vitória não foi detectada.")

def main():
    """Função principal"""
    print("🎮 Testando IA do Gomoku\n")
    
    test_ai_basic()
    test_ai_strategic()
    test_ai_winning()
    test_win_detection()
    
    print("\n🎯 Testes concluídos!")

if __name__ == "__main__":
    main()

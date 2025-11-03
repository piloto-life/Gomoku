#!/usr/bin/env python3
"""
Script principal para executar todos os testes dos modos de partida do Gomoku
"""

import sys
import os
import time
from datetime import datetime

# Adicionar o diretório de testes ao path
sys.path.append(os.path.dirname(__file__))

def print_header(title):
    """Imprime um cabeçalho formatado"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_section(title):
    """Imprime uma seção formatada"""
    print(f"\n{'─'*50}")
    print(f"  {title}")
    print('─'*50)

def main():
    """Função principal"""
    print_header("🎮 TESTES DOS MODOS DE PARTIDA - GOMOKU")
    print(f"📅 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"🐍 Python: {sys.version}")
    print(f"📂 Diretório: {os.getcwd()}")
    
    # Verificar se os arquivos de teste existem
    test_files = [
        "test_pvp_local.py",
        "test_pve.py", 
        "test_pvp_online.py",
        "test_local_game_fixes.py"
    ]
    
    existing_tests = []
    for test_file in test_files:
        if os.path.exists(test_file):
            existing_tests.append(test_file)
        else:
            print(f"⚠️ Arquivo de teste não encontrado: {test_file}")
    
    if not existing_tests:
        print("❌ Nenhum arquivo de teste encontrado!")
        return
    
    total_start_time = time.time()
    
    # 1. Teste PvP Local
    if "test_pvp_local.py" in existing_tests:
        print_section("🏠 TESTE PVP LOCAL (2 JOGADORES NO MESMO DISPOSITIVO)")
        try:
            from test_pvp_local import run_tests as run_pvp_local_tests
            run_pvp_local_tests()
        except Exception as e:
            print(f"❌ Erro executando testes PvP Local: {e}")
    
    # 2. Teste PvE
    if "test_pve.py" in existing_tests:
        print_section("🤖 TESTE PVE (JOGADOR VS IA)")
        try:
            from test_pve import run_tests as run_pve_tests
            run_pve_tests()
        except Exception as e:
            print(f"❌ Erro executando testes PvE: {e}")
    
    # 3. Teste PvP Online
    if "test_pvp_online.py" in existing_tests:
        print_section("🌐 TESTE PVP ONLINE (2 JOGADORES VIA WEBSOCKET)")
        try:
            from test_pvp_online import run_sync_tests as run_pvp_online_tests
            run_pvp_online_tests()
        except Exception as e:
            print(f"❌ Erro executando testes PvP Online: {e}")
    
    # 4. Teste de Correções Específicas
    if "test_local_game_fixes.py" in existing_tests:
        print_section("🔧 TESTE DE CORREÇÕES ESPECÍFICAS (BASEADO NOS LOGS)")
        try:
            from test_local_game_fixes import run_specific_tests
            run_specific_tests()
        except Exception as e:
            print(f"❌ Erro executando testes específicos: {e}")
    
    total_end_time = time.time()
    total_duration = total_end_time - total_start_time
    
    # Resumo final
    print_header("📊 RESUMO GERAL DOS TESTES")
    print(f"⏱️ Tempo total de execução: {total_duration:.2f} segundos")
    print(f"🧪 Testes executados: {len(existing_tests)}")
    
    print("\n🎯 MODOS DE PARTIDA TESTADOS:")
    if "test_pvp_local.py" in existing_tests:
        print("  ✅ PvP Local - 2 jogadores no mesmo dispositivo")
    if "test_pve.py" in existing_tests:
        print("  ✅ PvE - Jogador vs IA (3 dificuldades)")
    if "test_pvp_online.py" in existing_tests:
        print("  ✅ PvP Online - 2 jogadores via WebSocket")
    if "test_local_game_fixes.py" in existing_tests:
        print("  ✅ Correções Específicas - Baseado em logs reais")
    
    print("\n📋 ASPECTOS TESTADOS:")
    print("  🎮 Inicialização dos jogos")
    print("  🎯 Movimentos válidos e inválidos")
    print("  🏆 Detecção de vitórias (horizontal, vertical, diagonal)")
    print("  🤖 Comportamento da IA (se aplicável)")
    print("  🌐 Conectividade WebSocket (se aplicável)")
    print("  🔄 Sincronização entre jogadores (se aplicável)")
    print("  ⚡ Performance dos sistemas")
    
    print("\n🎉 Testes concluídos!")
    print("📝 Verifique os logs acima para detalhes dos resultados.")
    
    # Instruções para próximos passos
    print_section("📋 PRÓXIMOS PASSOS RECOMENDADOS")
    print("1. 🐛 Corrigir falhas encontradas nos testes")
    print("2. 🚀 Testar em ambiente de produção")
    print("3. 👥 Realizar testes com usuários reais")
    print("4. 📈 Monitorar performance em uso real")
    print("5. 🔄 Executar testes regularmente durante desenvolvimento")

if __name__ == "__main__":
    main()

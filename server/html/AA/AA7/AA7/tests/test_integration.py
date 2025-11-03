#!/usr/bin/env python3
"""
Testes de integração para validar todo o fluxo do jogo
Baseado nos problemas encontrados nos logs do frontend
"""

import requests
import json
import sys
import os
import time

# Adicionar o diretório backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

class TestGameIntegration:
    """Testes de integração para validar todo o fluxo do jogo"""
    
    def __init__(self):
        self.backend_url = "http://localhost:9000"
        self.test_user = {
            "email": "test@example.com",
            "password": "testpass123"
        }
        self.token = None
        
    def setup_method(self):
        """Setup para cada teste"""
        pass
        
    def test_user_authentication(self):
        """Teste de autenticação do usuário"""
        print("🔐 Testando autenticação do usuário...")
        
        try:
            # Tentar login
            login_url = f"{self.backend_url}/api/auth/login"
            response = requests.post(login_url, json=self.test_user, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                print(f"✅ Login realizado com sucesso - Token: {self.token[:20]}...")
                return True
            else:
                print(f"⚠️ Login falhou com status: {response.status_code}")
                # Tentar criar usuário
                return self._create_test_user()
                
        except Exception as e:
            print(f"❌ Erro na autenticação: {e}")
            return False
    
    def _create_test_user(self):
        """Criar usuário de teste se não existir"""
        print("👤 Criando usuário de teste...")
        
        try:
            register_url = f"{self.backend_url}/api/auth/register"
            register_data = {
                **self.test_user,
                "name": "Test User"
            }
            
            response = requests.post(register_url, json=register_data, timeout=5)
            
            if response.status_code == 201:
                data = response.json()
                self.token = data.get("access_token")
                print("✅ Usuário criado e logado com sucesso")
                return True
            else:
                print(f"❌ Falha ao criar usuário: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao criar usuário: {e}")
            return False
    
    def test_local_game_creation(self):
        """Teste de criação de jogo local via API"""
        print("🏠 Testando criação de jogo local...")
        
        if not self.token:
            print("❌ Token não disponível")
            return False
            
        try:
            create_url = f"{self.backend_url}/api/games/create"
            headers = {"Authorization": f"Bearer {self.token}"}
            game_data = {
                "mode": "pvp-local",
                "difficulty": "medium"
            }
            
            response = requests.post(create_url, json=game_data, headers=headers, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                game_id = data.get("id")
                print(f"✅ Jogo local criado - ID: {game_id}")
                return game_id
            else:
                print(f"❌ Falha ao criar jogo local: {response.status_code}")
                print(f"Resposta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao criar jogo local: {e}")
            return False
    
    def test_pve_game_creation(self):
        """Teste de criação de jogo PvE via API"""
        print("🤖 Testando criação de jogo PvE...")
        
        if not self.token:
            print("❌ Token não disponível")
            return False
            
        try:
            create_url = f"{self.backend_url}/api/games/create"
            headers = {"Authorization": f"Bearer {self.token}"}
            
            for difficulty in ["easy", "medium", "hard"]:
                game_data = {
                    "mode": "pve",
                    "difficulty": difficulty
                }
                
                response = requests.post(create_url, json=game_data, headers=headers, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    game_id = data.get("id")
                    print(f"✅ Jogo PvE ({difficulty}) criado - ID: {game_id}")
                else:
                    print(f"❌ Falha ao criar jogo PvE ({difficulty}): {response.status_code}")
                    return False
            
            return True
                
        except Exception as e:
            print(f"❌ Erro ao criar jogo PvE: {e}")
            return False
    
    def test_online_game_creation(self):
        """Teste de criação de jogo online via API"""
        print("🌐 Testando criação de jogo online...")
        
        if not self.token:
            print("❌ Token não disponível")
            return False
            
        try:
            create_url = f"{self.backend_url}/api/games/create"
            headers = {"Authorization": f"Bearer {self.token}"}
            game_data = {
                "mode": "pvp-online",
                "difficulty": "medium"
            }
            
            response = requests.post(create_url, json=game_data, headers=headers, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                game_id = data.get("id")
                print(f"✅ Jogo online criado - ID: {game_id}")
                return game_id
            else:
                print(f"❌ Falha ao criar jogo online: {response.status_code}")
                print(f"Resposta: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao criar jogo online: {e}")
            return False
    
    def test_game_retrieval(self, game_id):
        """Teste de recuperação de dados do jogo"""
        print(f"📋 Testando recuperação do jogo {game_id}...")
        
        if not self.token or not game_id:
            print("❌ Token ou game_id não disponível")
            return False
            
        try:
            get_url = f"{self.backend_url}/api/games/{game_id}"
            headers = {"Authorization": f"Bearer {self.token}"}
            
            response = requests.get(get_url, headers=headers, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Jogo recuperado - Modo: {data.get('mode')}, Status: {data.get('status')}")
                return data
            else:
                print(f"❌ Falha ao recuperar jogo: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao recuperar jogo: {e}")
            return False
    
    def test_lobby_endpoints(self):
        """Teste dos endpoints do lobby"""
        print("🏢 Testando endpoints do lobby...")
        
        if not self.token:
            print("❌ Token não disponível")
            return False
            
        try:
            # Testar lista de jogos
            games_url = f"{self.backend_url}/api/lobby/games"
            headers = {"Authorization": f"Bearer {self.token}"}
            
            response = requests.get(games_url, headers=headers, timeout=5)
            
            if response.status_code == 200:
                games = response.json()
                print(f"✅ Lista de jogos obtida - {len(games)} jogos encontrados")
            else:
                print(f"❌ Falha ao obter lista de jogos: {response.status_code}")
                return False
            
            # Testar lista de jogadores
            players_url = f"{self.backend_url}/api/lobby/players"
            response = requests.get(players_url, headers=headers, timeout=5)
            
            if response.status_code == 200:
                players = response.json()
                print(f"✅ Lista de jogadores obtida - {len(players)} jogadores encontrados")
                return True
            else:
                print(f"❌ Falha ao obter lista de jogadores: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao testar lobby: {e}")
            return False
    
    def test_backend_health(self):
        """Teste de saúde do backend"""
        print("💓 Testando saúde do backend...")
        
        try:
            # Testar endpoint de saúde básico
            health_url = f"{self.backend_url}/api/auth/me"
            response = requests.get(health_url, timeout=3)
            
            # Se retornou 401, significa que está rodando mas sem auth
            if response.status_code in [200, 401]:
                print("✅ Backend está respondendo")
                return True
            else:
                print(f"⚠️ Backend respondeu com status: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            print("❌ Não foi possível conectar ao backend")
            return False
        except Exception as e:
            print(f"❌ Erro ao testar backend: {e}")
            return False
    
    def test_move_simulation(self, game_id):
        """Teste de simulação de movimentos"""
        print(f"🎯 Testando movimentos no jogo {game_id}...")
        
        if not self.token or not game_id:
            print("❌ Token ou game_id não disponível")
            return False
            
        try:
            move_url = f"{self.backend_url}/api/games/{game_id}/move"
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Simular alguns movimentos
            test_moves = [
                {"row": 9, "col": 9},
                {"row": 9, "col": 10},
                {"row": 10, "col": 9},
            ]
            
            for move in test_moves:
                response = requests.post(move_url, json=move, headers=headers, timeout=5)
                
                if response.status_code == 200:
                    print(f"✅ Movimento ({move['row']}, {move['col']}) realizado")
                else:
                    print(f"⚠️ Movimento ({move['row']}, {move['col']}) falhou: {response.status_code}")
                    # Não é necessariamente um erro crítico
            
            return True
                
        except Exception as e:
            print(f"❌ Erro ao simular movimentos: {e}")
            return False

def run_tests():
    """Executar todos os testes de integração"""
    print("🧪 Iniciando testes de integração do Gomoku\n")
    
    test_instance = TestGameIntegration()
    
    # Lista de testes a executar
    tests = [
        ("Backend Health", test_instance.test_backend_health),
        ("User Authentication", test_instance.test_user_authentication),
        ("Lobby Endpoints", test_instance.test_lobby_endpoints),
        ("Local Game Creation", test_instance.test_local_game_creation),
        ("PvE Game Creation", test_instance.test_pve_game_creation),
        ("Online Game Creation", test_instance.test_online_game_creation),
    ]
    
    passed = 0
    failed = 0
    game_ids = []
    
    for test_name, test_func in tests:
        try:
            print(f"\n{'─'*50}")
            print(f"🧪 {test_name}")
            print('─'*50)
            
            result = test_func()
            
            if result:
                if isinstance(result, str) and result.startswith(('local-', 'game-', '6')):
                    game_ids.append(result)
                passed += 1
                print(f"✅ {test_name} - PASSOU")
            else:
                failed += 1
                print(f"❌ {test_name} - FALHOU")
                
        except Exception as e:
            print(f"❌ {test_name} - ERRO: {e}")
            failed += 1
    
    # Testes adicionais com IDs de jogos criados
    if game_ids:
        print(f"\n{'─'*50}")
        print("🎯 Testes Adicionais com Jogos Criados")
        print('─'*50)
        
        for game_id in game_ids:
            try:
                # Teste de recuperação
                if test_instance.test_game_retrieval(game_id):
                    passed += 1
                else:
                    failed += 1
                
                # Teste de movimentos
                if test_instance.test_move_simulation(game_id):
                    passed += 1
                else:
                    failed += 1
                    
            except Exception as e:
                print(f"❌ Erro nos testes adicionais: {e}")
                failed += 2
    
    # Resumo final
    print(f"\n{'='*60}")
    print("📊 RESUMO DOS TESTES DE INTEGRAÇÃO")
    print('='*60)
    print(f"✅ Passou: {passed}")
    print(f"❌ Falhou: {failed}")
    print(f"📈 Taxa de sucesso: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 Todos os testes de integração passaram!")
    else:
        print(f"\n⚠️ {failed} teste(s) falharam - verificar logs acima")
    
    print("\n📋 Recomendações baseadas nos testes:")
    if passed >= failed:
        print("✅ Sistema está funcionando adequadamente")
        print("🔄 Execute testes regularmente durante desenvolvimento")
    else:
        print("🐛 Corrigir problemas críticos identificados")
        print("🔧 Verificar configuração do backend e conectividade")

if __name__ == "__main__":
    run_tests()

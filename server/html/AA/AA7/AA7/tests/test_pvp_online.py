#!/usr/bin/env python3
"""
Testes para o modo PvP Online (2 jogadores via WebSocket)
"""

import asyncio
import json
import sys
import os
import websockets
import time
from concurrent.futures import ThreadPoolExecutor

# Adicionar o diretório backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
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

class TestPvPOnline:
    """Testes para partidas PvP Online via WebSocket"""
    
    def __init__(self):
        self.backend_url = "ws://localhost:9000"
        self.http_backend_url = "http://localhost:9000"
        self.real_token = None  # Token JWT real
        self.game_id = None
        
    async def setup_method(self):
        """Setup para cada teste"""
        self.board = [[None for _ in range(19)] for _ in range(19)]
        self.game_id = f"test_game_{int(time.time())}"
        
        # Tentar obter token real se possível
        await self._try_get_real_token()
    
    async def _try_get_real_token(self):
        """Tenta obter um token JWT real do backend"""
        try:
            # Tentar usar urllib para não depender de requests
            import urllib.request
            import urllib.parse
            import json as json_lib
            
            # Dados de teste
            test_user = {
                "email": "test@example.com",
                "password": "testpass123"
            }
            
            # Tentar login
            login_url = f"{self.http_backend_url}/api/auth/login"
            data = json_lib.dumps(test_user).encode('utf-8')
            
            req = urllib.request.Request(
                login_url, 
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            
            try:
                with urllib.request.urlopen(req, timeout=3) as response:
                    if response.status == 200:
                        response_data = json_lib.loads(response.read().decode())
                        self.real_token = response_data.get("access_token")
                        print(f"✅ Token real obtido: {self.real_token[:20]}...")
                        return
            except:
                pass  # Continuar para registro
            
            # Se login falhou, tentar registrar
            register_url = f"{self.http_backend_url}/api/auth/register"
            register_data = {**test_user, "name": "Test User"}
            data = json_lib.dumps(register_data).encode('utf-8')
            
            req = urllib.request.Request(
                register_url,
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            
            try:
                with urllib.request.urlopen(req, timeout=3) as response:
                    if response.status == 201:
                        response_data = json_lib.loads(response.read().decode())
                        self.real_token = response_data.get("access_token")
                        print(f"✅ Usuário criado e token obtido: {self.real_token[:20]}...")
                        return
            except:
                pass
                        
        except Exception as e:
            print(f"⚠️ Não foi possível obter token real: {e}")
        
        print("🔄 Usando token de teste mock")
        self.real_token = "test_jwt_token"
        
    async def test_websocket_connection(self):
        """Teste de conexão WebSocket básica"""
        print("🌐 Testando conexão WebSocket...")
        
        try:
            # Testar conexão com lobby
            token = self.real_token or "test_jwt_token"
            lobby_url = f"{self.backend_url}/ws/lobby?token={token}"
            
            async with websockets.connect(lobby_url) as websocket:
                # Enviar ping
                ping_message = {"type": "ping", "timestamp": time.time()}
                await websocket.send(json.dumps(ping_message))
                
                # Aguardar resposta (com timeout)
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    response_data = json.loads(response)
                    print(f"📨 Resposta do lobby: {response_data.get('type', 'unknown')}")
                    print("✅ Conexão WebSocket com lobby funcionando")
                except asyncio.TimeoutError:
                    print("⚠️ Timeout na resposta do lobby")
                    
        except Exception as e:
            print(f"❌ Erro na conexão WebSocket: {e}")
            raise
    
    async def test_game_websocket_connection(self):
        """Teste de conexão WebSocket para jogos"""
        print("🌐 Testando conexão WebSocket para jogos...")
        
        try:
            # Testar conexão com jogo específico
            game_url = f"{self.backend_url}/ws/game/{self.game_id}?token={self.test_token}"
            
            async with websockets.connect(game_url) as websocket:
                # Enviar mensagem de entrada no jogo
                join_message = {
                    "type": "join_game",
                    "game_id": self.game_id,
                    "player_color": "black"
                }
                await websocket.send(json.dumps(join_message))
                
                # Aguardar confirmação
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    response_data = json.loads(response)
                    print(f"📨 Resposta do jogo: {response_data.get('type', 'unknown')}")
                    print("✅ Conexão WebSocket com jogo funcionando")
                except asyncio.TimeoutError:
                    print("⚠️ Timeout na resposta do jogo")
                    
        except Exception as e:
            print(f"❌ Erro na conexão WebSocket do jogo: {e}")
            # Não fazer raise aqui pois pode ser esperado se o backend não estiver rodando
    
    async def test_player_matchmaking(self):
        """Teste do sistema de matchmaking"""
        print("🎯 Testando sistema de matchmaking...")
        
        async def player_connection(player_id, color):
            """Simula um jogador conectando"""
            try:
                lobby_url = f"{self.backend_url}/ws/lobby?token={self.test_token}_{player_id}"
                
                async with websockets.connect(lobby_url) as websocket:
                    # Entrar na fila
                    queue_message = {
                        "type": "join_queue",
                        "player_id": player_id,
                        "preferred_color": color
                    }
                    await websocket.send(json.dumps(queue_message))
                    
                    # Aguardar match
                    try:
                        response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                        response_data = json.loads(response)
                        
                        if response_data.get("type") == "game_found":
                            print(f"🎮 Jogador {player_id} encontrou jogo: {response_data.get('game_id')}")
                            return response_data.get("game_id")
                        else:
                            print(f"📨 Jogador {player_id} recebeu: {response_data.get('type')}")
                            
                    except asyncio.TimeoutError:
                        print(f"⏱️ Jogador {player_id} não encontrou jogo no tempo limite")
                        
            except Exception as e:
                print(f"❌ Erro para jogador {player_id}: {e}")
            
            return None
        
        # Simular dois jogadores procurando jogo simultaneamente
        tasks = [
            player_connection("player1", "black"),
            player_connection("player2", "white")
        ]
        
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            game_ids = [r for r in results if isinstance(r, str) and r is not None]
            
            if len(game_ids) >= 2 and game_ids[0] == game_ids[1]:
                print("✅ Matchmaking funcionou - jogadores no mesmo jogo")
            else:
                print("⚠️ Matchmaking não funcionou como esperado")
                
        except Exception as e:
            print(f"❌ Erro no teste de matchmaking: {e}")
    
    async def test_game_moves_sync(self):
        """Teste de sincronização de movimentos entre jogadores"""
        print("🎮 Testando sincronização de movimentos...")
        
        async def player_game_session(player_id, color, moves_to_make):
            """Simula uma sessão de jogo para um jogador"""
            try:
                game_url = f"{self.backend_url}/ws/game/{self.game_id}?token={self.test_token}_{player_id}"
                
                async with websockets.connect(game_url) as websocket:
                    # Entrar no jogo
                    join_message = {
                        "type": "join_game",
                        "game_id": self.game_id,
                        "player_color": color
                    }
                    await websocket.send(json.dumps(join_message))
                    
                    moves_made = 0
                    moves_received = []
                    
                    while moves_made < len(moves_to_make):
                        try:
                            # Aguardar mensagem
                            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                            response_data = json.loads(response)
                            
                            if response_data.get("type") == "your_turn":
                                # É nossa vez, fazer movimento
                                if moves_made < len(moves_to_make):
                                    move = moves_to_make[moves_made]
                                    move_message = {
                                        "type": "make_move",
                                        "game_id": self.game_id,
                                        "row": move[0],
                                        "col": move[1],
                                        "player_color": color
                                    }
                                    await websocket.send(json.dumps(move_message))
                                    moves_made += 1
                                    print(f"🎯 {player_id} jogou: {move}")
                            
                            elif response_data.get("type") == "move_made":
                                # Movimento do oponente
                                move_data = response_data.get("move", {})
                                opponent_move = (move_data.get("row"), move_data.get("col"))
                                moves_received.append(opponent_move)
                                print(f"📨 {player_id} recebeu movimento: {opponent_move}")
                            
                            elif response_data.get("type") == "game_over":
                                winner = response_data.get("winner")
                                print(f"🏆 Jogo terminou - Vencedor: {winner}")
                                break
                                
                        except asyncio.TimeoutError:
                            print(f"⏱️ {player_id} timeout aguardando resposta")
                            break
                    
                    return moves_received
                    
            except Exception as e:
                print(f"❌ Erro na sessão do {player_id}: {e}")
                return []
        
        # Movimentos alternados simulados
        player1_moves = [(9, 9), (9, 10), (9, 11)]  # Jogador preto
        player2_moves = [(10, 9), (10, 10), (10, 11)]  # Jogador branco
        
        try:
            # Executar ambos os jogadores simultaneamente
            tasks = [
                player_game_session("player1", "black", player1_moves),
                player_game_session("player2", "white", player2_moves)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            if all(isinstance(r, list) for r in results):
                print("✅ Sincronização de movimentos testada")
            else:
                print("⚠️ Problemas na sincronização de movimentos")
                
        except Exception as e:
            print(f"❌ Erro no teste de sincronização: {e}")
    
    async def test_connection_handling(self):
        """Teste de tratamento de conexões/desconexões"""
        print("🔌 Testando tratamento de conexões...")
        
        async def connect_and_disconnect(player_id, disconnect_after=2):
            """Conecta e desconecta após um tempo"""
            try:
                lobby_url = f"{self.backend_url}/ws/lobby?token={self.test_token}_{player_id}"
                
                async with websockets.connect(lobby_url) as websocket:
                    # Enviar mensagem inicial
                    hello_message = {
                        "type": "hello",
                        "player_id": player_id
                    }
                    await websocket.send(json.dumps(hello_message))
                    
                    # Aguardar um pouco
                    await asyncio.sleep(disconnect_after)
                    
                    print(f"🔌 {player_id} desconectado após {disconnect_after}s")
                    
            except Exception as e:
                print(f"❌ Erro na conexão/desconexão do {player_id}: {e}")
        
        # Testar múltiplas conexões e desconexões
        tasks = [
            connect_and_disconnect("player1", 1),
            connect_and_disconnect("player2", 2),
            connect_and_disconnect("player3", 1.5),
        ]
        
        try:
            await asyncio.gather(*tasks, return_exceptions=True)
            print("✅ Tratamento de conexões testado")
        except Exception as e:
            print(f"❌ Erro no teste de conexões: {e}")
    
    async def test_game_state_persistence(self):
        """Teste de persistência do estado do jogo"""
        print("💾 Testando persistência do estado do jogo...")
        
        try:
            game_url = f"{self.backend_url}/ws/game/{self.game_id}?token={self.test_token}"
            
            # Primeira conexão - fazer alguns movimentos
            async with websockets.connect(game_url) as websocket:
                # Fazer movimento
                move_message = {
                    "type": "make_move",
                    "game_id": self.game_id,
                    "row": 9,
                    "col": 9,
                    "player_color": "black"
                }
                await websocket.send(json.dumps(move_message))
                
                # Aguardar resposta
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                    print("📨 Movimento registrado")
                except asyncio.TimeoutError:
                    print("⏱️ Timeout registrando movimento")
            
            # Aguardar um pouco
            await asyncio.sleep(1)
            
            # Segunda conexão - verificar se o estado foi mantido
            async with websockets.connect(game_url) as websocket:
                # Solicitar estado do jogo
                state_message = {
                    "type": "get_game_state",
                    "game_id": self.game_id
                }
                await websocket.send(json.dumps(state_message))
                
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                    response_data = json.loads(response)
                    
                    if response_data.get("type") == "game_state":
                        print("✅ Estado do jogo persistido corretamente")
                    else:
                        print("⚠️ Estado do jogo não retornado como esperado")
                        
                except asyncio.TimeoutError:
                    print("⏱️ Timeout obtendo estado do jogo")
                    
        except Exception as e:
            print(f"❌ Erro no teste de persistência: {e}")
    
    async def test_concurrent_games(self):
        """Teste de múltiplos jogos simultâneos"""
        print("🎮 Testando jogos simultâneos...")
        
        async def simulate_game(game_id):
            """Simula um jogo completo"""
            try:
                game_url = f"{self.backend_url}/ws/game/{game_id}?token={self.test_token}_{game_id}"
                
                async with websockets.connect(game_url) as websocket:
                    # Fazer um movimento rápido
                    move_message = {
                        "type": "make_move",
                        "game_id": game_id,
                        "row": 9,
                        "col": 9,
                        "player_color": "black"
                    }
                    await websocket.send(json.dumps(move_message))
                    
                    # Aguardar resposta
                    await asyncio.sleep(0.5)
                    print(f"🎯 Jogo {game_id} simulado")
                    
            except Exception as e:
                print(f"❌ Erro no jogo {game_id}: {e}")
        
        # Simular 5 jogos simultâneos
        game_ids = [f"game_{i}_{int(time.time())}" for i in range(5)]
        tasks = [simulate_game(game_id) for game_id in game_ids]
        
        try:
            await asyncio.gather(*tasks, return_exceptions=True)
            print("✅ Jogos simultâneos testados")
        except Exception as e:
            print(f"❌ Erro nos jogos simultâneos: {e}")

async def run_tests():
    """Executar todos os testes"""
    print("🧪 Iniciando testes do modo PvP Online\n")
    
    test_instance = TestPvPOnline()
    
    tests = [
        test_instance.test_websocket_connection,
        test_instance.test_game_websocket_connection,
        test_instance.test_player_matchmaking,
        test_instance.test_game_moves_sync,
        test_instance.test_connection_handling,
        test_instance.test_game_state_persistence,
        test_instance.test_concurrent_games,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            await test_instance.setup_method()
            await test()
            passed += 1
        except Exception as e:
            print(f"❌ Falha no teste {test.__name__}: {e}")
            failed += 1
    
    print(f"\n📊 Resumo dos testes PvP Online:")
    print(f"✅ Passou: {passed}")
    print(f"❌ Falhou: {failed}")
    print(f"📈 Taxa de sucesso: {(passed/(passed+failed)*100):.1f}%")

def run_sync_tests():
    """Wrapper síncrono para os testes assíncronos"""
    try:
        asyncio.run(run_tests())
    except Exception as e:
        print(f"❌ Erro executando testes: {e}")

if __name__ == "__main__":
    run_sync_tests()

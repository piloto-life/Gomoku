#!/usr/bin/env python3
"""
Teste simples do WebSocket para jogos Gomoku
"""

import asyncio
import websockets
import json
import requests

# Configurações
BASE_URL = "http://150.162.244.21:8000"
WS_URL = "ws://150.162.244.21:8000"

async def test_websocket_game():
    print("🔄 Iniciando teste do WebSocket de jogos...")
    
    # 1. Fazer login para obter token
    print("\n1. Fazendo login...")
    login_data = {
        "email": "demo@gomoku.com",
        "password": "demo123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"❌ Erro no login: {response.status_code} - {response.text}")
            return
        
        login_result = response.json()
        token = login_result.get("access_token")
        user = login_result.get("user")
        
        print(f"✅ Login realizado com sucesso!")
        print(f"   Usuário: {user.get('username')} ({user.get('email')})")
        
    except Exception as e:
        print(f"❌ Erro na requisição de login: {e}")
        return
    
    # 2. Criar um jogo
    print("\n2. Criando jogo...")
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        game_data = {
            "mode": "pvp-online",
            "difficulty": "medium"
        }
        
        print(f"   Token: {token[:50]}...")
        print(f"   Headers: {headers}")
        
        response = requests.post(f"{BASE_URL}/api/games/create", 
                               json=game_data, 
                               headers=headers)
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code != 200:
            print(f"❌ Erro ao criar jogo: {response.status_code} - {response.text}")
            return
        
        game = response.json()
        game_id = game.get("id")
        
        print("✅ Jogo criado com sucesso!")
        print(f"   ID do jogo: {game_id}")
        print(f"   Modo: {game.get('mode')}")
        
    except Exception as e:
        print(f"❌ Erro na criação do jogo: {e}")
        return
    
    # 3. Conectar ao WebSocket
    print(f"\n3. Conectando ao WebSocket do jogo {game_id}...")
    
    websocket_url = f"{WS_URL}/ws/game/{game_id}?token={token}"
    
    try:
        async with websockets.connect(websocket_url) as websocket:
            print("✅ Conectado ao WebSocket!")
            
            # 4. Aguardar mensagem de boas-vindas
            print("\n4. Aguardando mensagens do servidor...")
            
            try:
                # Escutar mensagens por alguns segundos
                timeout = 10  # 10 segundos
                for i in range(timeout):
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)
                        
                        print(f"📨 Mensagem recebida ({i+1}s):")
                        print(f"   Tipo: {data.get('type')}")
                        print(f"   Dados: {json.dumps(data, indent=2, default=str)}")
                        
                        if data.get('type') == 'connected':
                            print("\n5. Enviando mensagem de ping...")
                            ping_message = {"type": "ping"}
                            await websocket.send(json.dumps(ping_message))
                            print("✅ Ping enviado!")
                            
                        elif data.get('type') == 'pong':
                            print("✅ Pong recebido!")
                            
                        elif data.get('type') == 'game_state':
                            print("✅ Estado do jogo recebido!")
                            
                            # Tentar fazer uma jogada
                            print("\n6. Fazendo uma jogada de teste...")
                            move_message = {
                                "type": "move",
                                "row": 9,
                                "col": 9
                            }
                            await websocket.send(json.dumps(move_message))
                            print("✅ Jogada enviada!")
                            
                    except asyncio.TimeoutError:
                        # Continue o loop mesmo sem mensagens
                        continue
                        
            except Exception as e:
                print(f"❌ Erro ao processar mensagens: {e}")
            
            print(f"\n✅ Teste concluído após {timeout} segundos!")
            
    except websockets.exceptions.ConnectionClosed as e:
        print(f"❌ Conexão WebSocket fechada: {e}")
    except Exception as e:
        print(f"❌ Erro na conexão WebSocket: {e}")

if __name__ == "__main__":
    print("🎮 Teste do WebSocket - Gomoku")
    print("=" * 50)
    
    try:
        asyncio.run(test_websocket_game())
    except KeyboardInterrupt:
        print("\n🛑 Teste interrompido pelo usuário")
    except Exception as e:
        print(f"\n❌ Erro geral: {e}")
    
    print("\n🏁 Fim do teste!")
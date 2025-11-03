#!/usr/bin/python3
# -*- coding: utf-8 -*-

import asyncio
import json
import websockets
import socket
import datetime
import signal
import sys
import os

# --- conf ---
TCP_PORT = 8080
UDP_PORT = 8081
WS_PORT = 8082
HOST = '0.0.0.0'
PID_FILE = "/tmp/monitor_server_AA11.pid"
# --------------------

CONNECTED_CLIENTS = set()
STATS = {'tcp': 0, 'udp': 0, 'total': 0}

def create_message_payload(protocol, content, client_ip):
    return {
        'protocol': protocol,
        'content': content,
        'client_ip': client_ip,
        'timestamp': datetime.datetime.now().isoformat()
    }

def format_json_broadcast(type, payload):
    return json.dumps({'type': type, 'payload': payload})

async def broadcast_message(message_json):
    """Envia uma mensagem para todos os clientes WebSocket conectados."""
    if CONNECTED_CLIENTS:
        tasks = [client.send(message_json) for client in CONNECTED_CLIENTS]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception) and not isinstance(result, websockets.exceptions.ConnectionClosed):
                print(f"[Broadcast] Erro ao enviar: {result}")

async def register_client(websocket):
    CONNECTED_CLIENTS.add(websocket)
    await websocket.send(format_json_broadcast('stats', STATS))

async def unregister_client(websocket):
    CONNECTED_CLIENTS.remove(websocket)

async def websocket_handler(websocket, path):
    await register_client(websocket)
    try:
        await websocket.wait_closed()
    finally:
        await unregister_client(websocket)

# --- handlers TCP e UDP ---

async def tcp_handler(reader, writer):
    client_addr = writer.get_extra_info('peername')
    client_ip = client_addr[0]
    print(f"[TCP] Conexão de {client_addr}")
    
    try:
        while True:
            data = await reader.read(1024)
            if not data:
                break
                
            message_str = data.decode('utf-8').strip()
            print(f"[TCP] Mensagem recebida de {client_ip}: {message_str}")

            if message_str.lower() in ['exit', 'quit']:
                writer.write("OK. Encerrando conexão.\n".encode('utf-8'))
                await writer.drain()
                break

            STATS['tcp'] += 1
            STATS['total'] += 1
            
            payload = create_message_payload('TCP', message_str, client_ip)
            
            await broadcast_message(format_json_broadcast('message', payload))
            await broadcast_message(format_json_broadcast('stats', STATS))
            
            response = f"Mensagem TCP recebida: {message_str}\n"
            writer.write(response.encode('utf-8'))
            await writer.drain()
            
    except Exception as e:
        print(f"[TCP] Erro: {e}")
    finally:
        print(f"[TCP] Conexão com {client_ip} fechada.")
        writer.close()
        await writer.wait_closed()

class UDPServerProtocol(asyncio.DatagramProtocol):
    
    def connection_made(self, transport):
        self.transport = transport
        print("[UDP] Servidor UDP iniciado.")

    def datagram_received(self, data, addr):
        client_ip = addr[0]
        message_str = data.decode('utf-8').strip()
        print(f"[UDP] Datagrama recebido de {client_ip}: {message_str}")
        
        STATS['udp'] += 1
        STATS['total'] += 1
        
        payload = create_message_payload('UDP', message_str, client_ip)
        
        asyncio.create_task(broadcast_message(format_json_broadcast('message', payload)))
        asyncio.create_task(broadcast_message(format_json_broadcast('stats', STATS)))
        
        if message_str.lower() in ['exit', 'quit']:
            response = "OK. 'exit' recebido.\n"
        else:
            response = f"Mensagem UDP recebida: {message_str}\n"
            
        self.transport.sendto(response.encode('utf-8'), addr)

async def main():
    loop = asyncio.get_running_loop()

    tcp_server = await asyncio.start_server(tcp_handler, HOST, TCP_PORT)
    print(f"[Main] Servidor TCP escutando em {HOST}:{TCP_PORT}")

    await loop.create_datagram_endpoint(
        lambda: UDPServerProtocol(),
        local_addr=(HOST, UDP_PORT)
    )
    print(f"[Main] Servidor UDP escutando em {HOST}:{UDP_PORT}")
    
    ws_server = await websockets.serve(websocket_handler, HOST, WS_PORT)
    print(f"[Main] Servidor WebSocket escutando em {HOST}:{WS_PORT}")

    # `add_signal_handler` is not implemented on some event loop policies (e.g., Windows
    # default proactor loop). Guard it so the server can run cross-platform.
    try:
        loop.add_signal_handler(signal.SIGTERM, shutdown)
        loop.add_signal_handler(signal.SIGINT, shutdown)
    except NotImplementedError:
        print("[Main] add_signal_handler não disponível nesta plataforma; sinais SIGINT/SIGTERM não registrados.")
    
    await asyncio.gather(
        tcp_server.serve_forever(),
        ws_server.serve_forever()
    )

def shutdown():
    print("[Main] Recebido sinal de encerramento. Desligando...")
    
    if os.path.exists(PID_FILE):
        os.remove(PID_FILE)

    loop = asyncio.get_running_loop()
    loop.stop()

if __name__ == "__main__":
    if os.path.exists(PID_FILE):
        print("Erro: Servidor já parece estar em execução (PID file existe).")
        sys.exit(1)  
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        shutdown()
    except Exception as e:
        # Print full traceback to help debugging when running on different OS
        import traceback
        print("Erro fatal:")
        traceback.print_exc()
    finally:
        print("[Main] Servidor desligado.")

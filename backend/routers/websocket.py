from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
from ..game_manager import game_manager 

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_queue_update(self):
        queue_data = [user for user in game_manager.waiting_queue]
        for connection in self.active_connections:
            await connection.send_json({
                "type": "queue_update",
                "queue": queue_data
            })

connection_manager = ConnectionManager()

@router.websocket_route("/game/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await connection_manager.connect(websocket)
    user = {"id": user_id, "name": f"Player_{user_id[:4]}"}

    try:
        while True:
            data = await websocket.receive_json()
            
            if data['type'] == 'join_queue':
                game_manager.add_player_to_queue(user)
                await connection_manager.broadcast_queue_update()

            if data['type'] == 'game_over':
                winner = data['winner'] # assume que o dado é enviado pelo front
                loser = data['loser']
                
                game_manager.handle_game_end(winner, loser)

                #TODO: logica de notificacao
                await connection_manager.broadcast_queue_update()

    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
        #remove o usuário da fila em caso de desconexão
        if user in game_manager.waiting_queue:
            game_manager.waiting_queue.remove(user)
            await connection_manager.broadcast_queue_update()
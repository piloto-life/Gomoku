from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict
import json
import asyncio
from datetime import datetime

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.game_rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, game_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if game_id:
            if game_id not in self.game_rooms:
                self.game_rooms[game_id] = []
            self.game_rooms[game_id].append(websocket)

    def disconnect(self, websocket: WebSocket, game_id: str = None):
        self.active_connections.remove(websocket)
        
        if game_id and game_id in self.game_rooms:
            if websocket in self.game_rooms[game_id]:
                self.game_rooms[game_id].remove(websocket)
            if not self.game_rooms[game_id]:
                del self.game_rooms[game_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_room(self, message: str, game_id: str):
        if game_id in self.game_rooms:
            for connection in self.game_rooms[game_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Remove dead connections
                    self.game_rooms[game_id].remove(connection)

    async def broadcast_to_all(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove dead connections
                self.active_connections.remove(connection)

manager = ConnectionManager()

@router.websocket("/game/{game_id}")
async def websocket_game_endpoint(websocket: WebSocket, game_id: str):
    await manager.connect(websocket, game_id)
    
    try:
        # Send welcome message
        await manager.send_personal_message(
            json.dumps({
                "type": "connected",
                "message": f"Connected to game {game_id}",
                "timestamp": datetime.utcnow().isoformat()
            }),
            websocket
        )
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            if message_data.get("type") == "chat":
                # Broadcast chat message to room
                chat_message = {
                    "type": "chat",
                    "user_id": message_data.get("user_id"),
                    "username": message_data.get("username"),
                    "message": message_data.get("message"),
                    "timestamp": datetime.utcnow().isoformat()
                }
                await manager.broadcast_to_room(json.dumps(chat_message), game_id)
                
            elif message_data.get("type") == "move":
                # Broadcast move to room
                move_message = {
                    "type": "move",
                    "user_id": message_data.get("user_id"),
                    "position": message_data.get("position"),
                    "piece": message_data.get("piece"),
                    "timestamp": datetime.utcnow().isoformat()
                }
                await manager.broadcast_to_room(json.dumps(move_message), game_id)
                
            elif message_data.get("type") == "game_update":
                # Broadcast game state update
                await manager.broadcast_to_room(json.dumps(message_data), game_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, game_id)
        
        # Notify room that user disconnected
        disconnect_message = {
            "type": "user_disconnected",
            "message": "A player disconnected",
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast_to_room(json.dumps(disconnect_message), game_id)

@router.websocket("/lobby")
async def websocket_lobby_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    try:
        # Send welcome message
        await manager.send_personal_message(
            json.dumps({
                "type": "connected",
                "message": "Connected to lobby",
                "timestamp": datetime.utcnow().isoformat()
            }),
            websocket
        )
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle lobby messages
            if message_data.get("type") == "lobby_chat":
                chat_message = {
                    "type": "lobby_chat",
                    "user_id": message_data.get("user_id"),
                    "username": message_data.get("username"),
                    "message": message_data.get("message"),
                    "timestamp": datetime.utcnow().isoformat()
                }
                await manager.broadcast_to_all(json.dumps(chat_message))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

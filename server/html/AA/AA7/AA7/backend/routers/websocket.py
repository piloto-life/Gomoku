from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional
import json
from datetime import datetime
from bson import ObjectId

from database import get_collection
from models.user import UserPublic

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.game_rooms: Dict[str, List[WebSocket]] = {}
        self.user_connections: Dict[str, WebSocket] = {}
        self.lobby_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, game_id: str = None, user_id: str = None, is_lobby: bool = False):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id:
            self.user_connections[user_id] = websocket
        
        if game_id:
            if game_id not in self.game_rooms:
                self.game_rooms[game_id] = []
            self.game_rooms[game_id].append(websocket)

        if is_lobby:
            self.lobby_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, game_id: str = None, user_id: str = None, is_lobby: bool = False):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]
        
        if game_id and game_id in self.game_rooms:
            if websocket in self.game_rooms[game_id]:
                self.game_rooms[game_id].remove(websocket)
            if not self.game_rooms[game_id]:
                del self.game_rooms[game_id]
        
        if is_lobby and websocket in self.lobby_connections:
            self.lobby_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)

    async def send_to_user(self, user_id: str, message: str):
        if user_id in self.user_connections:
            try:
                await self.user_connections[user_id].send_text(message)
            except Exception:
                del self.user_connections[user_id]


    async def broadcast_to_room(self, message: str, game_id: str, exclude_websocket: Optional[WebSocket] = None):
        if game_id in self.game_rooms:
            disconnected = []
            for connection in self.game_rooms[game_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_text(message)
                    except Exception:
                        disconnected.append(connection)
            
            # Remove dead connections
            for conn in disconnected:
                self.game_rooms[game_id].remove(conn)

    async def broadcast_to_lobby(self, message: str):
        disconnected = []
        for connection in self.lobby_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.lobby_connections.remove(conn)

    async def notify_game_start(self, game_info: Dict):
        message = {
            "type": "game_start",
            "game_id": game_info["game_id"],
            "players": game_info["players"]
        }
        
        for player in game_info["players"]:
            await self.send_to_user(player["id"], json.dumps(message))

    async def notify_game_update(self, game_id: str, update_data: dict):
        """Send game state update to all players in a game"""
        message = {
            "type": "game_update",
            "game_id": game_id,
            "data": update_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_room(json.dumps(message), game_id)

    async def notify_move(self, game_id: str, move_data: dict):
        """Send move notification to all players in a game"""
        message = {
            "type": "move",
            "game_id": game_id,
            "move": move_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_room(json.dumps(message), game_id)

    async def notify_ai_move(self, game_id: str, move_data: dict):
        """Send AI move notification to all players in a game"""
        message = {
            "type": "ai_move",
            "game_id": game_id,
            "move": move_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_room(json.dumps(message), game_id)

    async def broadcast_queue_update(self):
        """Send queue update to all lobby connections"""
        queue_data = game_manager.get_queue_status()
        message = {
            "type": "queue_update",
            "queue": queue_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_lobby(json.dumps(message))

manager = ConnectionManager()

@router.websocket("/game/{game_id}")
async def websocket_game_endpoint(websocket: WebSocket, game_id: str, user_id: str = None):
    await manager.connect(websocket, game_id, user_id)
    
    try:
        # Send welcome message
        await manager.send_personal_message(
            json.dumps({
                "type": "connected",
                "message": f"Connected to game {game_id}",
                "game_id": game_id,
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
                    "game_id": game_id,
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
                    "game_id": game_id,
                    "user_id": message_data.get("user_id"),
                    "position": message_data.get("position"),
                    "piece": message_data.get("piece"),
                    "timestamp": datetime.utcnow().isoformat()
                }
                await manager.broadcast_to_room(json.dumps(move_message), game_id, exclude_websocket=websocket)
                
            elif message_data.get("type") == "game_update":
                # Broadcast game state update
                await manager.broadcast_to_room(json.dumps(message_data), game_id)
                
            elif message_data.get("type") == "ping":
                # Respond with pong to keep connection alive
                await manager.send_personal_message(
                    json.dumps({"type": "pong", "timestamp": datetime.utcnow().isoformat()}),
                    websocket
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, game_id, user_id)
        
        # Notify room that user disconnected
        disconnect_message = {
            "type": "user_disconnected",
            "game_id": game_id,
            "user_id": user_id,
            "message": "A player disconnected",
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast_to_room(json.dumps(disconnect_message), game_id)

@router.websocket("/lobby/{user_id}")
async def websocket_lobby_endpoint(websocket: WebSocket, user_id: str):
    users_collection = await get_collection("users")
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})

    if not user_doc:
        await websocket.close(code=1008, reason="User not found")
        return
        
    user_doc['id'] = str(user_doc['_id'])
    del user_doc['_id']
    del user_doc['password_hash']  # Remove sensitive data
    user = UserPublic(**user_doc)

    await manager.connect(websocket, user_id=user_id, is_lobby=True)
    try:
        await manager.broadcast_queue_update()
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "join_queue":
                game_manager.add_player_to_queue(user.dict())
                await manager.broadcast_queue_update()
                
                new_game = game_manager.start_new_game()
                if new_game:
                    await manager.notify_game_start(new_game)
                    await manager.broadcast_queue_update()

            elif message_data.get("type") == "leave_queue":
                game_manager.remove_player_from_queue(user.dict())
                await manager.broadcast_queue_update()
                
    except WebSocketDisconnect:
        game_manager.remove_player_from_queue(user.dict())
        manager.disconnect(websocket, user_id=user_id, is_lobby=True)
        await manager.broadcast_queue_update()
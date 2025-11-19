from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List, Dict, Optional
import json
import os
from datetime import datetime
from bson import ObjectId
from jose import JWTError, jwt

from database import get_collection
from models.user import UserPublic
from game_manager import game_manager

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"

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
            pass

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
            for conn in disconnected:
                if conn in self.game_rooms[game_id]:
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
            p_id = str(player['id']) if isinstance(player, dict) else str(player)
            await self.send_to_user(p_id, json.dumps(message))

    async def broadcast_queue_update(self):
        queue_data = game_manager.get_queue_status()
        message = {
            "type": "queue_update",
            "queue": queue_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_lobby(json.dumps(message))

manager = ConnectionManager()

@router.websocket("/game/{game_id}")
async def websocket_game_endpoint(websocket: WebSocket, game_id: str, token: str = Query(None)):
    user_id = None
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
        except:
            pass

    await manager.connect(websocket, game_id, user_id)
    
    try:
        await manager.send_personal_message(
            json.dumps({
                "type": "connected",
                "message": f"Connected to game {game_id}",
                "game_id": game_id
            }), websocket
        )

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if user_id:
                message_data["user_id"] = user_id
            
            if message_data.get("type") == "chat":
                await manager.broadcast_to_room(json.dumps(message_data), game_id)
            elif message_data.get("type") == "move":
                await manager.broadcast_to_room(json.dumps(message_data), game_id, exclude_websocket=websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket, game_id, user_id)

@router.websocket("/lobby")
async def websocket_lobby_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            await websocket.close(code=1008)
            return
    except Exception as e:
        print(f"WebSocket Auth Error: {e}")
        await websocket.close(code=1008)
        return

    users_collection = await get_collection("users")
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})

    if not user_doc:
        await websocket.close(code=1008)
        return
        
    user_doc['id'] = str(user_doc['_id'])
    if '_id' in user_doc: del user_doc['_id']
    if 'password_hash' in user_doc: del user_doc['password_hash']
    
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
            
            elif message_data.get("type") == "chat_message":
                message_data["timestamp"] = datetime.utcnow().isoformat()
                await manager.broadcast_to_lobby(json.dumps(message_data))
                
    except WebSocketDisconnect:
        game_manager.remove_player_from_queue(user.dict())
        manager.disconnect(websocket, user_id=user_id, is_lobby=True)
        await manager.broadcast_queue_update()

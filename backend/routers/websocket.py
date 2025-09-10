from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict, Optional
import json
import asyncio
from datetime import datetime
from bson import ObjectId

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.game_rooms: Dict[str, List[WebSocket]] = {}
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, game_id: str = None, user_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id:
            self.user_connections[user_id] = websocket
        
        if game_id:
            if game_id not in self.game_rooms:
                self.game_rooms[game_id] = []
            self.game_rooms[game_id].append(websocket)

    def disconnect(self, websocket: WebSocket, game_id: str = None, user_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]
        
        if game_id and game_id in self.game_rooms:
            if websocket in self.game_rooms[game_id]:
                self.game_rooms[game_id].remove(websocket)
            if not self.game_rooms[game_id]:
                del self.game_rooms[game_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)

    async def send_to_user(self, user_id: str, message: str):
        if user_id in self.user_connections:
            try:
                await self.user_connections[user_id].send_text(message)
            except:
                del self.user_connections[user_id]

    async def broadcast_to_room(self, message: str, game_id: str, exclude_websocket: Optional[WebSocket] = None):
        if game_id in self.game_rooms:
            disconnected = []
            for connection in self.game_rooms[game_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_text(message)
                    except:
                        disconnected.append(connection)
            
            # Remove dead connections
            for conn in disconnected:
                self.game_rooms[game_id].remove(conn)

    async def broadcast_to_all(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        # Remove dead connections
        for conn in disconnected:
            self.active_connections.remove(conn)

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

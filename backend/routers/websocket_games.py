from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List, Dict, Optional
import json
from datetime import datetime
from bson import ObjectId

from database import get_collection
from models.user import UserPublic

router = APIRouter()

class GameConnectionManager:
    def __init__(self):
        # Game rooms: game_id -> list of WebSocket connections
        self.game_rooms: Dict[str, List[WebSocket]] = {}
        # User connections: user_id -> WebSocket
        self.user_connections: Dict[str, WebSocket] = {}
        # Active connections
        self.active_connections: List[WebSocket] = []

    async def connect_to_game(self, websocket: WebSocket, game_id: str, user_id: str):
        """Connect a user to a specific game room"""
        await websocket.accept()
        
        # Add to active connections
        self.active_connections.append(websocket)
        
        # Add to user connections
        self.user_connections[user_id] = websocket
        
        # Add to game room
        if game_id not in self.game_rooms:
            self.game_rooms[game_id] = []
        self.game_rooms[game_id].append(websocket)

    def disconnect_from_game(self, websocket: WebSocket, game_id: str, user_id: str):
        """Disconnect a user from a game room"""
        # Remove from active connections
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # Remove from user connections
        if user_id in self.user_connections:
            del self.user_connections[user_id]
        
        # Remove from game room
        if game_id in self.game_rooms and websocket in self.game_rooms[game_id]:
            self.game_rooms[game_id].remove(websocket)
            
            # Clean up empty room
            if not self.game_rooms[game_id]:
                del self.game_rooms[game_id]

    async def send_to_user(self, user_id: str, message: Dict):
        """Send message to a specific user"""
        if user_id in self.user_connections:
            try:
                await self.user_connections[user_id].send_text(json.dumps(message))
                return True
            except Exception:
                # Remove dead connection
                del self.user_connections[user_id]
                return False
        return False

    async def broadcast_to_game(self, game_id: str, message: Dict, exclude_user: Optional[str] = None):
        """Broadcast message to all players in a game"""
        if game_id not in self.game_rooms:
            return

        message_str = json.dumps(message)
        disconnected = []
        
        for connection in self.game_rooms[game_id]:
            # Skip the excluded user
            if exclude_user:
                user_id = None
                for uid, conn in self.user_connections.items():
                    if conn == connection:
                        user_id = uid
                        break
                if user_id == exclude_user:
                    continue
            
            try:
                await connection.send_text(message_str)
            except Exception:
                disconnected.append(connection)
        
        # Remove dead connections
        for conn in disconnected:
            self.game_rooms[game_id].remove(conn)

    async def send_game_move(self, game_id: str, move_data: Dict, from_user: str):
        """Send move to all players in the game except the sender"""
        message = {
            "type": "player_move",
            "game_id": game_id,
            "move": move_data,
            "from_user": from_user,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_game(game_id, message, exclude_user=from_user)

    async def send_game_state(self, game_id: str, game_state: Dict):
        """Send complete game state to all players"""
        message = {
            "type": "game_state",
            "game_id": game_id,
            "state": game_state,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_game(game_id, message)

    async def send_game_event(self, game_id: str, event_type: str, event_data: Dict):
        """Send game event (win, draw, turn_change, etc.) to all players"""
        message = {
            "type": event_type,
            "game_id": game_id,
            "data": event_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_game(game_id, message)

# Global connection manager
game_manager = GameConnectionManager()

async def get_user_from_token(token: str) -> Optional[UserPublic]:
    """Get user from JWT token for WebSocket authentication"""
    try:
        # Import here to avoid circular imports
        from routers.auth import SECRET_KEY, ALGORITHM
        from jose import jwt, JWTError
        
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            return None
            
        users_collection = await get_collection("users")
        user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user_doc:
            return None
            
        user_doc['id'] = str(user_doc['_id'])
        del user_doc['_id']
        del user_doc['password_hash']  # Remove sensitive data
        
        return UserPublic(**user_doc)
    except Exception as e:
        print(f"WebSocket auth error: {e}")
        return None

@router.websocket("/ws/game/{game_id}")
async def websocket_game_endpoint(
    websocket: WebSocket, 
    game_id: str,
    token: Optional[str] = Query(None)
):
    """WebSocket endpoint for real-time game communication"""
    
    print(f"WebSocket connection attempt for game {game_id}")
    print(f"Token received: {token[:50] if token else 'None'}...")
    
    # Authenticate user
    if not token:
        print("No token provided, closing connection")
        await websocket.close(code=1008, reason="Authentication token required")
        return
    
    user = await get_user_from_token(token)
    if not user:
        print("Invalid token, closing connection")
        await websocket.close(code=1008, reason="Invalid authentication token")
        return
    
    print(f"User authenticated: {user.username} ({user.id})")
    
    # Verify user is part of this game
    games_collection = await get_collection("games")
    game = await games_collection.find_one({"_id": ObjectId(game_id)})
    
    if not game:
        print(f"Game {game_id} not found")
        await websocket.close(code=1008, reason="Game not found")
        return
    
    # Check if user is a player in this game
    user_in_game = (
        game.get("players", {}).get("black", {}).get("id") == user.id or
        game.get("players", {}).get("white", {}).get("id") == user.id
    )
    
    if not user_in_game:
        print(f"User {user.id} not authorized for game {game_id}")
        await websocket.close(code=1008, reason="User not authorized for this game")
        return
    
    print(f"User authorized for game, connecting...")
    
    # Connect to game
    await game_manager.connect_to_game(websocket, game_id, user.id)
    
    try:
        # Send welcome message
        welcome_message = {
            "type": "connected",
            "message": f"Connected to game {game_id}",
            "game_id": game_id,
            "user": user.dict(),
            "timestamp": datetime.utcnow().isoformat()
        }
        await websocket.send_text(json.dumps(welcome_message))
        
        # Send current game state
        game["id"] = str(game["_id"])
        del game["_id"]
        await game_manager.send_game_state(game_id, game)
        
        # Main message loop
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message_type = message_data.get("type")
            
            if message_type == "move":
                # Handle player move
                row = message_data.get("row")
                col = message_data.get("col")
                
                if row is None or col is None:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid move data"
                    }))
                    continue
                
                # Process move in database
                current_game = await games_collection.find_one({"_id": ObjectId(game_id)})
                
                if not current_game:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Game not found"
                    }))
                    continue
                
                # Validate move
                board = current_game.get("board", [])
                if (0 <= row < len(board) and 
                    0 <= col < len(board[0]) and 
                    board[row][col] is None):
                    
                    # Determine player color
                    player_color = None
                    if current_game.get("players", {}).get("black", {}).get("id") == user.id:
                        player_color = "black"
                    elif current_game.get("players", {}).get("white", {}).get("id") == user.id:
                        player_color = "white"
                    
                    # Check if it's player's turn
                    if current_game.get("current_player") != player_color:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "Not your turn"
                        }))
                        continue
                    
                    # Make move
                    board[row][col] = player_color
                    next_player = "white" if player_color == "black" else "black"
                    
                    # Update game in database
                    await games_collection.update_one(
                        {"_id": ObjectId(game_id)},
                        {
                            "$set": {
                                "board": board,
                                "current_player": next_player,
                                "updated_at": datetime.utcnow()
                            },
                            "$push": {
                                "moves": {
                                    "row": row,
                                    "col": col,
                                    "player": player_color,
                                    "timestamp": datetime.utcnow()
                                }
                            }
                        }
                    )
                    
                    # Broadcast move to other players
                    move_data = {
                        "row": row,
                        "col": col,
                        "player": player_color,
                        "next_player": next_player
                    }
                    await game_manager.send_game_move(game_id, move_data, user.id)
                    
                    # TODO: Check for win condition here
                    # For now, just broadcast the new state
                    updated_game = await games_collection.find_one({"_id": ObjectId(game_id)})
                    updated_game["id"] = str(updated_game["_id"])
                    del updated_game["_id"]
                    await game_manager.send_game_state(game_id, updated_game)
                    
                else:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid move position"
                    }))
            
            elif message_type == "chat":
                # Handle chat message
                chat_data = {
                    "user_id": user.id,
                    "username": user.username,
                    "message": message_data.get("message", ""),
                    "timestamp": datetime.utcnow().isoformat()
                }
                await game_manager.send_game_event(game_id, "chat_message", chat_data)
            
            elif message_type == "ping":
                # Respond to ping with pong
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
    
    except WebSocketDisconnect:
        # Handle disconnect
        game_manager.disconnect_from_game(websocket, game_id, user.id)
        
        # Notify other players
        disconnect_data = {
            "user_id": user.id,
            "username": user.username,
            "message": f"{user.username} disconnected"
        }
        await game_manager.send_game_event(game_id, "player_disconnected", disconnect_data)
    
    except Exception as e:
        # Handle other errors
        print(f"WebSocket error: {e}")
        game_manager.disconnect_from_game(websocket, game_id, user.id)
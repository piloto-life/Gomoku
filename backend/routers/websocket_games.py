from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List, Dict, Optional
import json
from datetime import datetime
from bson import ObjectId
import copy


from database import get_collection
from models.user import UserPublic
from logic.game_logic import check_win

router = APIRouter()

class GameConnectionManager:
    def __init__(self):
        # Game rooms: game_id -> list of WebSocket connections
        self.game_rooms: Dict[str, List[WebSocket]] = {}
        # User connections: user_id -> WebSocket
        self.user_connections: Dict[str, WebSocket] = {}
        # Active connections
        self.active_connections: List[WebSocket] = []
        # Online players (user_id -> UserPublic)
        self.online_players: Dict[str, dict] = {}
        # Waiting queue (list of user_id)
        self.waiting_queue: List[str] = []

    async def connect_to_lobby(self, websocket: WebSocket, user_id: str, user_public: dict):
        """Connect a user to the lobby."""
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket
        self.online_players[user_id] = user_public

    def disconnect_from_lobby(self, user_id: str):
        """Disconnect a user from the lobby."""
        if user_id in self.user_connections:
            websocket = self.user_connections[user_id]
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
            del self.user_connections[user_id]
        if user_id in self.online_players:
            del self.online_players[user_id]
        if user_id in self.waiting_queue:
            self.waiting_queue.remove(user_id)
    async def broadcast_online_players(self):
        """Broadcast the full list of online players to all lobby clients."""
        players = []
        for player in self.online_players.values():
            player_copy = copy.deepcopy(player)
            # Se for dict, converter campos datetime
            if isinstance(player_copy, dict):
                for k, v in player_copy.items():
                    if isinstance(v, datetime):
                        player_copy[k] = v.isoformat()
            players.append(player_copy)
        await self.broadcast_to_lobby({"type": "online_players", "players": players})

    async def broadcast_queue_update(self):
        """Broadcast the current waiting queue to all lobby clients."""
        queue = []
        for uid in self.waiting_queue:
            if uid in self.online_players:
                player_copy = copy.deepcopy(self.online_players[uid])
                # Converter campos datetime para string
                if isinstance(player_copy, dict):
                    for k, v in player_copy.items():
                        if isinstance(v, datetime):
                            player_copy[k] = v.isoformat()
                queue.append(player_copy)
        await self.broadcast_to_lobby({"type": "queue_update", "queue": queue})

    async def broadcast_to_lobby(self, message: Dict, exclude_user: Optional[str] = None):
        """Broadcast a message to all users in the lobby."""
        message_str = json.dumps(message)
        disconnected_users = []
        for user_id, connection in self.user_connections.items():
            if user_id == exclude_user:
                continue
            try:
                await connection.send_text(message_str)
            except Exception:
                disconnected_users.append(user_id)
        
        for user_id in disconnected_users:
            self.disconnect_from_lobby(user_id)

    async def connect_to_game(self, websocket: WebSocket, game_id: str, user_id: str):
        """Connect a user to a specific game room"""
        # If there's an existing connection for this user, replace it
        existing = self.user_connections.get(user_id)
        if existing and existing is not websocket:
            try:
                await existing.send_text(json.dumps({"type": "session_replaced", "reason": "New connection established", "game_id": game_id}))
            except Exception:
                pass
            try:
                await existing.close(code=4000, reason="New connection established")
            except Exception:
                pass
            # Clean up references to the old socket
            try:
                self._remove_connection(existing)
            except Exception:
                pass

        # Add to active connections if not present
        if websocket not in self.active_connections:
            self.active_connections.append(websocket)

        # Map user to this websocket
        self.user_connections[user_id] = websocket

        # Add to game room
        if game_id not in self.game_rooms:
            self.game_rooms[game_id] = []
        if websocket not in self.game_rooms[game_id]:
            self.game_rooms[game_id].append(websocket)

    def disconnect_from_game(self, websocket: WebSocket, game_id: str, user_id: str):
        """Disconnect a user from a game room"""
        # Remove from active connections
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # Remove from user connections
        # Only remove the user mapping if it points to the websocket being removed
        if user_id in self.user_connections and self.user_connections.get(user_id) == websocket:
            del self.user_connections[user_id]
        
        # Remove from game room
        if game_id in self.game_rooms and websocket in self.game_rooms[game_id]:
            self.game_rooms[game_id].remove(websocket)
            
            # Clean up empty room
            if not self.game_rooms[game_id]:
                del self.game_rooms[game_id]

    def _remove_connection(self, websocket: WebSocket):
        """Internal helper to remove all references to a websocket connection."""
        # Remove from active connections
        try:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        except Exception:
            pass

        # Find user ids associated with this websocket
        user_ids = [uid for uid, conn in list(self.user_connections.items()) if conn == websocket]
        for uid in user_ids:
            try:
                # Remove user mapping
                if uid in self.user_connections and self.user_connections.get(uid) == websocket:
                    del self.user_connections[uid]
            except Exception:
                pass
            # Remove online player and waiting queue entries
            if uid in self.online_players:
                try:
                    del self.online_players[uid]
                except Exception:
                    pass
            if uid in self.waiting_queue:
                try:
                    self.waiting_queue.remove(uid)
                except ValueError:
                    pass

        # Remove from any game rooms
        for gid, conns in list(self.game_rooms.items()):
            if websocket in conns:
                try:
                    conns.remove(websocket)
                except ValueError:
                    pass
                if not conns:
                    try:
                        del self.game_rooms[gid]
                    except Exception:
                        pass

    async def send_to_user(self, user_id: str, message: Dict):
        """Send message to a specific user"""
        connection = self.user_connections.get(user_id)
        if connection:
            try:
                await connection.send_text(json.dumps(message))
                return True
            except Exception:
                # Clean up any references to this dead connection
                try:
                    self._remove_connection(connection)
                except Exception:
                    pass
                return False
        return False

    async def broadcast_to_game(self, game_id: str, message: Dict, exclude_user: Optional[str] = None):
        """Broadcast message to all players in a game"""
        if game_id not in self.game_rooms:
            return

        message_str = json.dumps(message)
        disconnected = []

        # Iterate over a copy to avoid modification during iteration
        for connection in list(self.game_rooms[game_id]):
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

        # Remove dead connections and clean up mappings
        for conn in disconnected:
            try:
                self._remove_connection(conn)
            except Exception:
                pass

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

@router.websocket("/test")
async def websocket_test_endpoint(websocket: WebSocket):
    """Simple WebSocket test endpoint without authentication"""
    print("TEST: WebSocket connection attempt")
    await websocket.accept()
    print("TEST: WebSocket connection accepted")
    
    try:
        await websocket.send_text("Hello from test endpoint!")
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        print("TEST: WebSocket disconnected")

@router.websocket("/lobby")
async def websocket_lobby_token_endpoint(websocket: WebSocket):
    """WebSocket endpoint for lobby using JWT token authentication"""
    
    print("Lobby WebSocket connection attempt")
    
    # Extract token from query string BEFORE accepting connection
    query_string = websocket.url.query
    print(f"Query string: {query_string}")
    
    token = None
    if query_string:
        # Parse query string manually
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=', 1)[1]
                break
    
    print(f"Token extracted: {token[:50] if token else 'None'}...")
    
    # Authenticate user BEFORE accepting connection
    if not token:
        print("No token provided, rejecting connection")
        await websocket.close(code=1008, reason="Authentication token required")
        return
    
    user = await get_user_from_token(token)
    if not user:
        print("Invalid token, rejecting connection")
        await websocket.close(code=1008, reason="Invalid authentication token")
        return
    
    print(f"User authenticated: {user.username} ({user.id})")
    
    # Check if user is already connected (prevent duplicate connections)
    # IMPORTANT: Close old connection BEFORE accepting new one
    if user.id in game_manager.user_connections:
        print(f"User {user.username} already connected, closing old connection")
        try:
            old_ws = game_manager.user_connections[user.id]
            # Notify the old connection that it is being replaced, then close with an application-specific code
            try:
                await old_ws.send_text(json.dumps({"type": "session_replaced", "reason": "New connection established"}))
            except Exception:
                pass
            # Use a non-1000 close code to signal a server-driven replacement
            try:
                await old_ws.close(code=4000, reason="New connection established")
            except Exception:
                pass
        except Exception:
            pass  # Ignore errors from closing old connection
        # Remove old WebSocket from active connections, but KEEP user in online_players
        # so they remain available for matchmaking during queue join.
        if old_ws in game_manager.active_connections:
            game_manager.active_connections.remove(old_ws)
        # Remove from any game rooms (if they were in one)
        for gid in list(game_manager.game_rooms.keys()):
            if old_ws in game_manager.game_rooms[gid]:
                game_manager.game_rooms[gid].remove(old_ws)
        # Do NOT call disconnect_from_lobby() as that removes from online_players
    
    # NOW accept the new connection (after handling old one)
    await websocket.accept()
    print("Lobby WebSocket connection accepted!")

    # Connect to lobby (pass UserPublic dict)
    await game_manager.connect_to_lobby(websocket, user.id, user.dict())
    
    # Send connection success message
    await websocket.send_text(json.dumps({
        "type": "connection_established",
        "user_id": user.id,
        "message": "Successfully connected to lobby"
    }))
    
    # Broadcast player_joined and full snapshots
    await game_manager.broadcast_to_lobby({"type": "player_joined", "user_id": user.id})
    await game_manager.broadcast_online_players()
    await game_manager.broadcast_queue_update()

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                print(f"Invalid JSON received from {user.username}: {data}")
                continue
                
            msg_type = message.get("type")
            print(f"Received message from {user.username}: {msg_type}")
            
            if msg_type == "join_queue":
                # Add user to waiting queue if not already present
                if user.id not in game_manager.waiting_queue:
                    game_manager.waiting_queue.append(user.id)
                    print(f"User {user.username} joined queue. Queue size: {len(game_manager.waiting_queue)}")
                    await game_manager.broadcast_queue_update()
                    
                    # If enough players, start a match
                    if len(game_manager.waiting_queue) >= 2:
                        p1_id = game_manager.waiting_queue.pop(0)
                        p2_id = game_manager.waiting_queue.pop(0)
                        p1 = game_manager.online_players.get(p1_id)
                        p2 = game_manager.online_players.get(p2_id)
                        
                        if p1 and p2:
                            print(f"Starting match between {p1.get('username', 'Unknown')} and {p2.get('username', 'Unknown')}")
                            
                            # Criação real do jogo no banco
                            games_collection = await get_collection("games")
                            now = datetime.utcnow()
                            game_doc = {
                                "mode": "pvp-online",
                                "status": "active",
                                "board": [[None for _ in range(19)] for _ in range(19)],
                                "current_player": "black",
                                "players": {
                                    "black": {
                                        "id": p1["id"],
                                        "username": p1.get("username", p1.get("email", "")),
                                        "email": p1.get("email", "")
                                    },
                                    "white": {
                                        "id": p2["id"],
                                        "username": p2.get("username", p2.get("email", "")),
                                        "email": p2.get("email", "")
                                    }
                                },
                                "moves": [],
                                "created_at": now,
                                "updated_at": now
                            }
                            result = await games_collection.insert_one(game_doc)
                            game_id = str(result.inserted_id)
                            
                            # Notify both players
                            # Include full players info and player_ids so the client can reliably
                            # detect which user is the recipient without heuristic parsing.
                            players_payload = [
                                {"id": p1["id"], "username": p1.get("username", p1.get("email", "")), "color": "black"},
                                {"id": p2["id"], "username": p2.get("username", p2.get("email", "")), "color": "white"}
                            ]

                            match_start_message_p1 = {
                                "type": "game_start",
                                "game_id": game_id,
                                "players": players_payload,
                                "player_ids": [p1["id"], p2["id"]],
                                "your_id": p1_id,
                                "your_color": "black",
                                "opponent": {"id": p2["id"], "username": p2.get("username", "Unknown")}
                            }
                            send_p1_result = await game_manager.send_to_user(p1_id, match_start_message_p1)
                            if not send_p1_result:
                                print(f"Warning: Failed to send game_start to player 1 ({p1_id})")

                            match_start_message_p2 = {
                                "type": "game_start",
                                "game_id": game_id,
                                "players": players_payload,
                                "player_ids": [p1["id"], p2["id"]],
                                "your_id": p2_id,
                                "your_color": "white",
                                "opponent": {"id": p1["id"], "username": p1.get("username", "Unknown")}
                            }
                            send_p2_result = await game_manager.send_to_user(p2_id, match_start_message_p2)
                            if not send_p2_result:
                                print(f"Warning: Failed to send game_start to player 2 ({p2_id})")
                            
                            await game_manager.broadcast_queue_update()
                            print(f"Match created with ID: {game_id} (P1 sent: {send_p1_result}, P2 sent: {send_p2_result})")
                        else:
                            print("Error: One or both players not found in online_players")
                            # Put players back in queue
                            if p1_id: game_manager.waiting_queue.append(p1_id)
                            if p2_id: game_manager.waiting_queue.append(p2_id)
                            
            elif msg_type == "leave_queue":
                if user.id in game_manager.waiting_queue:
                    game_manager.waiting_queue.remove(user.id)
                    print(f"User {user.username} left queue. Queue size: {len(game_manager.waiting_queue)}")
                    await game_manager.broadcast_queue_update()
                    
            elif msg_type == "heartbeat":
                # Respond to heartbeat to keep connection alive
                await websocket.send_text(json.dumps({
                    "type": "heartbeat_response",
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
    except WebSocketDisconnect:
        print(f"User {user.username} disconnected from lobby")
        # Only disconnect if this is the current active connection
        # (not if they've already reconnected)
        if game_manager.user_connections.get(user.id) == websocket:
            game_manager.disconnect_from_lobby(user.id)
            await game_manager.broadcast_to_lobby({"type": "player_left", "user_id": user.id})
            await game_manager.broadcast_online_players()
            await game_manager.broadcast_queue_update()
            print(f"Cleanup completed for {user.username}")
        else:
            print(f"Old connection closed for {user.username}, but they already reconnected")
    except Exception as e:
        print(f"Error in lobby websocket for {user.username}: {e}")
        # Only cleanup on real exceptions if this is still the active connection
        if game_manager.user_connections.get(user.id) == websocket:
            game_manager.disconnect_from_lobby(user.id)
            await game_manager.broadcast_to_lobby({"type": "player_left", "user_id": user.id})
            await game_manager.broadcast_online_players()
            await game_manager.broadcast_queue_update()
            print(f"Cleanup completed for {user.username}")

# @router.websocket("/ws/lobby/{user_id}")
# async def websocket_lobby_endpoint(websocket: WebSocket, user_id: str):
#     await game_manager.connect_to_lobby(websocket, user_id)
#     await game_manager.broadcast_to_lobby({"type": "player_joined", "user_id": user_id})
#     try:
#         while True:
#             data = await websocket.receive_text()
#             # Lobby WebSocket can be extended to handle chat, etc.
#     except WebSocketDisconnect:
#         game_manager.disconnect_from_lobby(user_id)
#         await game_manager.broadcast_to_lobby({"type": "player_left", "user_id": user_id})

@router.websocket("/game/{game_id}")
async def websocket_game_endpoint(
    websocket: WebSocket, 
    game_id: str,
    token: Optional[str] = Query(None)
):
    """WebSocket endpoint for real-time game communication"""
    
    print(f"=== GAME WEBSOCKET FUNCTION CALLED ===")
    print(f"game_id: {game_id}")
    print(f"token: {token[:50] if token else 'None'}...")
    print(f"websocket: {websocket}")
    print(f"websocket.client: {websocket.client}")
    
    try:
        print(f"=== GAME WEBSOCKET DEBUG START ===")
        print(f"WebSocket connection attempt for game {game_id}")
        print(f"Token received: {token[:50] if token else 'None'}...")
        print(f"WebSocket client: {websocket.client}")
        
        try:
            # First accept the connection
            print("Accepting WebSocket connection...")
            await websocket.accept()
            print("WebSocket connection accepted successfully!")
        except Exception as e:
            print(f"ERROR accepting WebSocket connection: {e}")
            return
    except Exception as e:
        print(f"ERROR in websocket_game_endpoint (before accept): {e}")
        print(f"Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        return
    
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
    
    print("User authorized for game, connecting...")
    
    # Connect to game
    await game_manager.connect_to_game(websocket, game_id, user.id)
    
    try:
        # Send welcome message
        user_data = user.dict()
        # Convert datetime fields in user data
        if "created_at" in user_data and isinstance(user_data["created_at"], datetime):
            user_data["created_at"] = user_data["created_at"].isoformat()
        if "last_login" in user_data and user_data["last_login"] and isinstance(user_data["last_login"], datetime):
            user_data["last_login"] = user_data["last_login"].isoformat()
        
        welcome_message = {
            "type": "connected",
            "message": f"Connected to game {game_id}",
            "game_id": game_id,
            "user": user_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await websocket.send_text(json.dumps(welcome_message))
        
        # Send current game state
        game["id"] = str(game["_id"])
        del game["_id"]
        
        # Convert datetime fields to ISO format strings
        if "created_at" in game and isinstance(game["created_at"], datetime):
            game["created_at"] = game["created_at"].isoformat()
        if "updated_at" in game and isinstance(game["updated_at"], datetime):
            game["updated_at"] = game["updated_at"].isoformat()
        
        # Convert datetime in moves if present
        if "moves" in game:
            for move in game["moves"]:
                if "timestamp" in move and isinstance(move["timestamp"], datetime):
                    move["timestamp"] = move["timestamp"].isoformat()
        
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
                    
                    # Check for win condition
                    if check_win(board, row, col):
                        await games_collection.update_one(
                            {"_id": ObjectId(game_id)},
                            {"$set": {"status": "finished", "winner": player_color}}
                        )
                        win_data = {
                            "winner": player_color,
                            "winning_player_id": user.id,
                            "message": f"{user.username} wins!"
                        }
                        await game_manager.send_game_event(game_id, "game_end", win_data)
                    else:
                        # For now, just broadcast the new state
                        updated_game = await games_collection.find_one({"_id": ObjectId(game_id)})
                        if updated_game:
                            updated_game["id"] = str(updated_game["_id"])
                            del updated_game["_id"]
                            
                            # Convert datetime fields to ISO format strings
                            if "created_at" in updated_game and isinstance(updated_game["created_at"], datetime):
                                updated_game["created_at"] = updated_game["created_at"].isoformat()
                            if "updated_at" in updated_game and isinstance(updated_game["updated_at"], datetime):
                                updated_game["updated_at"] = updated_game["updated_at"].isoformat()
                            
                            # Convert datetime in moves if present
                            if "moves" in updated_game:
                                for move in updated_game["moves"]:
                                    if "timestamp" in move and isinstance(move["timestamp"], datetime):
                                        move["timestamp"] = move["timestamp"].isoformat()
                            
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
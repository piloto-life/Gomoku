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
        # Connection already accepted in endpoint
        
        # Add to active connections
        self.active_connections.append(websocket)
        
        # Add to user connections
        self.user_connections[user_id] = websocket
        
        # Add to game room
        if game_id not in self.game_rooms:
            self.game_rooms[game_id] = []
        import copy
        from datetime import datetime
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
    
    # First accept the connection
    await websocket.accept()
    print("Lobby WebSocket connection accepted!")
    
    # Extract token from query string
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
    
    # Check if user is already connected (prevent duplicate connections)
    if user.id in game_manager.user_connections:
        print(f"User {user.username} already connected, closing old connection")
        try:
            old_ws = game_manager.user_connections[user.id]
            await old_ws.close(code=1000, reason="New connection established")
        except:
            pass  # Ignore errors from closing old connection
        game_manager.disconnect_from_lobby(user.id)

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
                            match_start_message = {
                                "type": "game_start", 
                                "game_id": game_id, 
                                "opponent": {"id": p2["id"], "username": p2.get("username", "Unknown")},
                                "your_color": "black"
                            }
                            await game_manager.send_to_user(p1_id, match_start_message)
                            
                            match_start_message["opponent"] = {"id": p1["id"], "username": p1.get("username", "Unknown")}
                            match_start_message["your_color"] = "white"
                            await game_manager.send_to_user(p2_id, match_start_message)
                            
                            await game_manager.broadcast_queue_update()
                            print(f"Match created with ID: {game_id}")
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
    except Exception as e:
        print(f"Error in lobby websocket for {user.username}: {e}")
    finally:
        # Cleanup on disconnect
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
                    
                    # Check for win condition
                    if check_win(board, (row, col)):
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
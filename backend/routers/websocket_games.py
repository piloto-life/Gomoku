from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List, Dict, Optional
import json
from datetime import datetime
from bson import ObjectId
import copy
from database import get_collection
from models.user import UserPublic
from logic.game_logic import check_win
import os

BOARD_SIZE = int(os.getenv('BOARD_SIZE', '15'))

router = APIRouter()

class GameConnectionManager:
    def __init__(self):
        self.game_rooms: Dict[str, List[WebSocket]] = {}
        self.user_connections: Dict[str, WebSocket] = {}
        self.active_connections: List[WebSocket] = []
        self.online_players: Dict[str, dict] = {}
        self.waiting_queue: List[str] = []

    async def connect_to_lobby(self, websocket: WebSocket, user_id: str, user_public: dict):
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket
        self.online_players[user_id] = user_public

    def disconnect_from_lobby(self, user_id: str):
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
        players = []
        for player in self.online_players.values():
            player_copy = copy.deepcopy(player)
            if isinstance(player_copy, dict):
                for k, v in player_copy.items():
                    if isinstance(v, datetime):
                        player_copy[k] = v.isoformat()
            players.append(player_copy)
        await self.broadcast_to_lobby({"type": "online_players", "players": players})

    async def broadcast_queue_update(self):
        queue = []
        for uid in self.waiting_queue:
            if uid in self.online_players:
                player_copy = copy.deepcopy(self.online_players[uid])
                if isinstance(player_copy, dict):
                    for k, v in player_copy.items():
                        if isinstance(v, datetime):
                            player_copy[k] = v.isoformat()
                queue.append(player_copy)
        await self.broadcast_to_lobby({"type": "queue_update", "queue": queue})

    async def broadcast_to_lobby(self, message: Dict, exclude_user: Optional[str] = None):
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
            try:
                self._remove_connection(existing)
            except Exception:
                pass

        if websocket not in self.active_connections:
            self.active_connections.append(websocket)

        self.user_connections[user_id] = websocket

        if game_id not in self.game_rooms:
            self.game_rooms[game_id] = []
        if websocket not in self.game_rooms[game_id]:
            self.game_rooms[game_id].append(websocket)

    def disconnect_from_game(self, websocket: WebSocket, game_id: str, user_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if user_id in self.user_connections and self.user_connections.get(user_id) == websocket:
            del self.user_connections[user_id]
        
        if game_id in self.game_rooms and websocket in self.game_rooms[game_id]:
            self.game_rooms[game_id].remove(websocket)
            
            if not self.game_rooms[game_id]:
                del self.game_rooms[game_id]

    def _remove_connection(self, websocket: WebSocket):
        try:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        except Exception:
            pass

        user_ids = [uid for uid, conn in list(self.user_connections.items()) if conn == websocket]
        for uid in user_ids:
            try:
                if uid in self.user_connections and self.user_connections.get(uid) == websocket:
                    del self.user_connections[uid]
            except Exception:
                pass
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
        connection = self.user_connections.get(user_id)
        if connection:
            try:
                await connection.send_text(json.dumps(message))
                return True
            except Exception:
                try:
                    self._remove_connection(connection)
                except Exception:
                    pass
                return False
        return False

    async def broadcast_to_game(self, game_id: str, message: Dict, exclude_user: Optional[str] = None):
        if game_id not in self.game_rooms:
            return

        message_str = json.dumps(message)
        disconnected = []

        for connection in list(self.game_rooms[game_id]):
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

        for conn in disconnected:
            try:
                self._remove_connection(conn)
            except Exception:
                pass

    async def send_game_move(self, game_id: str, move_data: Dict, from_user: str):
        message = {
            "type": "player_move",
            "game_id": game_id,
            "move": move_data,
            "from_user": from_user,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_game(game_id, message, exclude_user=from_user)

    async def send_game_state(self, game_id: str, game_state: Dict):
        message = {
            "type": "game_state",
            "game_id": game_id,
            "state": game_state,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_game(game_id, message)

    async def send_game_event(self, game_id: str, event_type: str, event_data: Dict):
        message = {
            "type": event_type,
            "game_id": game_id,
            "data": event_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_game(game_id, message)

game_manager = GameConnectionManager()

async def get_user_from_token(token: str) -> Optional[UserPublic]:
    try:
        from routers.auth import SECRET_KEY, ALGORITHM
        from jose import jwt, JWTError
        
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
        del user_doc['password_hash']
        
        return UserPublic(**user_doc)
    except Exception as e:
        print(f"WebSocket auth error: {e}")
        return None

@router.websocket("/test")
async def websocket_test_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        await websocket.send_text("Hello from test endpoint!")
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        pass

@router.websocket("/lobby")
async def websocket_lobby_token_endpoint(websocket: WebSocket):
    query_string = websocket.url.query
    
    token = None
    if query_string:
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=', 1)[1]
                break
    
    if not token:
        await websocket.close(code=1008, reason="Authentication token required")
        return
    
    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=1008, reason="Invalid authentication token")
        return
    
    if user.id in game_manager.user_connections:
        try:
            old_ws = game_manager.user_connections[user.id]
            try:
                await old_ws.send_text(json.dumps({"type": "session_replaced", "reason": "New connection established"}))
            except Exception:
                pass
            try:
                await old_ws.close(code=4000, reason="New connection established")
            except Exception:
                pass
        except Exception:
            pass
        if old_ws in game_manager.active_connections:
            game_manager.active_connections.remove(old_ws)
        for gid in list(game_manager.game_rooms.keys()):
            if old_ws in game_manager.game_rooms[gid]:
                game_manager.game_rooms[gid].remove(old_ws)
    
    await websocket.accept()

    await game_manager.connect_to_lobby(websocket, user.id, user.dict())
    
    await websocket.send_text(json.dumps({
        "type": "connection_established",
        "user_id": user.id,
        "message": "Successfully connected to lobby"
    }))
    
    await game_manager.broadcast_to_lobby({"type": "player_joined", "user_id": user.id})
    await game_manager.broadcast_online_players()
    await game_manager.broadcast_queue_update()

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                continue
                
            msg_type = message.get("type")
            
            if msg_type == "join_queue":
                if user.id not in game_manager.waiting_queue:
                    game_manager.waiting_queue.append(user.id)
                    await game_manager.broadcast_queue_update()
                    
                    if len(game_manager.waiting_queue) >= 2:
                        p1_id = game_manager.waiting_queue.pop(0)
                        p2_id = game_manager.waiting_queue.pop(0)
                        p1 = game_manager.online_players.get(p1_id)
                        p2 = game_manager.online_players.get(p2_id)
                        
                        if p1 and p2:
                            games_collection = await get_collection("games")
                            now = datetime.utcnow()
                            game_doc = {
                                "mode": "pvp-online",
                                "status": "active",
                                "board": [[None for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)],
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
                            await game_manager.send_to_user(p1_id, match_start_message_p1)

                            match_start_message_p2 = {
                                "type": "game_start",
                                "game_id": game_id,
                                "players": players_payload,
                                "player_ids": [p1["id"], p2["id"]],
                                "your_id": p2_id,
                                "your_color": "white",
                                "opponent": {"id": p1["id"], "username": p1.get("username", "Unknown")}
                            }
                            await game_manager.send_to_user(p2_id, match_start_message_p2)
                            
                            await game_manager.broadcast_queue_update()
                        else:
                            if p1_id: game_manager.waiting_queue.append(p1_id)
                            if p2_id: game_manager.waiting_queue.append(p2_id)
                            
            elif msg_type == "leave_queue":
                if user.id in game_manager.waiting_queue:
                    game_manager.waiting_queue.remove(user.id)
                    await game_manager.broadcast_queue_update()
                    
            elif msg_type == "chat_message":
                chat_msg = {
                    "type": "chat_message",
                    "userId": user.id,
                    "userName": user.username,
                    "message": message.get("message"),
                    "timestamp": datetime.utcnow().isoformat()
                }
                await game_manager.broadcast_to_lobby(chat_msg, exclude_user=user.id)

            elif msg_type == "heartbeat":
                await websocket.send_text(json.dumps({
                    "type": "heartbeat_response",
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
    except WebSocketDisconnect:
        if game_manager.user_connections.get(user.id) == websocket:
            game_manager.disconnect_from_lobby(user.id)
            await game_manager.broadcast_to_lobby({"type": "player_left", "user_id": user.id})
            await game_manager.broadcast_online_players()
            await game_manager.broadcast_queue_update()
    except Exception as e:
        if game_manager.user_connections.get(user.id) == websocket:
            game_manager.disconnect_from_lobby(user.id)
            await game_manager.broadcast_to_lobby({"type": "player_left", "user_id": user.id})
            await game_manager.broadcast_online_players()
            await game_manager.broadcast_queue_update()

@router.websocket("/game/{game_id}")
async def websocket_game_endpoint(
    websocket: WebSocket, 
    game_id: str,
    token: Optional[str] = Query(None)
):
    try:
        try:
            await websocket.accept()
        except Exception:
            return
    except Exception:
        return
    
    if not token:
        await websocket.close(code=1008, reason="Authentication token required")
        return
    
    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=1008, reason="Invalid authentication token")
        return
    
    games_collection = await get_collection("games")
    game = await games_collection.find_one({"_id": ObjectId(game_id)})
    
    if not game:
        await websocket.close(code=1008, reason="Game not found")
        return
    
    user_in_game = (
        game.get("players", {}).get("black", {}).get("id") == user.id or
        game.get("players", {}).get("white", {}).get("id") == user.id
    )
    
    if not user_in_game:
        await websocket.close(code=1008, reason="User not authorized for this game")
        return
    
    await game_manager.connect_to_game(websocket, game_id, user.id)
    
    try:
        user_data = user.dict()
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
        
        game["id"] = str(game["_id"])
        del game["_id"]
        
        if "created_at" in game and isinstance(game["created_at"], datetime):
            game["created_at"] = game["created_at"].isoformat()
        if "updated_at" in game and isinstance(game["updated_at"], datetime):
            game["updated_at"] = game["updated_at"].isoformat()
        
        if "moves" in game:
            for move in game["moves"]:
                if "timestamp" in move and isinstance(move["timestamp"], datetime):
                    move["timestamp"] = move["timestamp"].isoformat()
        
        await game_manager.send_game_state(game_id, game)
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message_type = message_data.get("type")
            
            if message_type == "move":
                row = message_data.get("row")
                col = message_data.get("col")
                
                if row is None or col is None:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid move data"
                    }))
                    continue
                
                current_game = await games_collection.find_one({"_id": ObjectId(game_id)})
                
                if not current_game:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Game not found"
                    }))
                    continue
                
                board = current_game.get("board", [])
                if (0 <= row < len(board) and 
                    0 <= col < len(board[0]) and 
                    board[row][col] is None):
                    
                    player_color = None
                    if current_game.get("players", {}).get("black", {}).get("id") == user.id:
                        player_color = "black"
                    elif current_game.get("players", {}).get("white", {}).get("id") == user.id:
                        player_color = "white"
                    
                    if current_game.get("current_player") != player_color:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "Not your turn"
                        }))
                        continue
                    
                    board[row][col] = player_color
                    next_player = "white" if player_color == "black" else "black"
                    
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
                    
                    move_data = {
                        "row": row,
                        "col": col,
                        "player": player_color,
                        "next_player": next_player
                    }
                    await game_manager.send_game_move(game_id, move_data, user.id)
                    
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
                        try:
                            from database import get_database
                            from services.ranking_service import RankingService
                            db = await get_database()
                            ranking_service = RankingService(db)

                            finished_game = await games_collection.find_one({"_id": ObjectId(game_id)})
                            moves_count = len(finished_game.get('moves', [])) if finished_game else 0
                            black_p = finished_game.get('players', {}).get('black', {}) if finished_game else {}
                            white_p = finished_game.get('players', {}).get('white', {}) if finished_game else {}

                            await ranking_service.update_after_game(
                                game_id=game_id,
                                player1_id=black_p.get('id'),
                                player1_username=black_p.get('username', black_p.get('email', '')),
                                player2_id=white_p.get('id'),
                                player2_username=white_p.get('username', white_p.get('email', '')),
                                winner_id=user.id,
                                game_mode='pvp_online',
                                total_moves=moves_count,
                                duration_seconds=None
                            )
                        except Exception:
                            pass
                    else:
                        updated_game = await games_collection.find_one({"_id": ObjectId(game_id)})
                        if updated_game:
                            updated_game["id"] = str(updated_game["_id"])
                            del updated_game["_id"]
                            
                            if "created_at" in updated_game and isinstance(updated_game["created_at"], datetime):
                                updated_game["created_at"] = updated_game["created_at"].isoformat()
                            if "updated_at" in updated_game and isinstance(updated_game["updated_at"], datetime):
                                updated_game["updated_at"] = updated_game["updated_at"].isoformat()
                            
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
                chat_data = {
                    "user_id": user.id,
                    "username": user.username,
                    "message": message_data.get("message", ""),
                    "timestamp": datetime.utcnow().isoformat()
                }
                await game_manager.send_game_event(game_id, "chat_message", chat_data)
            
            elif message_type == "ping":
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
    
    except WebSocketDisconnect:
        game_manager.disconnect_from_game(websocket, game_id, user.id)
        
        disconnect_data = {
            "user_id": user.id,
            "username": user.username,
            "message": f"{user.username} disconnected"
        }
        await game_manager.send_game_event(game_id, "player_disconnected", disconnect_data)
    
    except Exception:
        game_manager.disconnect_from_game(websocket, game_id, user.id)

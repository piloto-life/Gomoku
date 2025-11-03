from fastapi import APIRouter, Depends
from typing import List

from models.user import User
from routers.auth import get_current_user
from database import get_collection

router = APIRouter()

@router.get("/games")
async def get_active_games(current_user: User = Depends(get_current_user)):
    """Get list of active and waiting games visible in lobby."""
    games_collection = await get_collection("games")
    games = []
    
    # Query for games that should be visible in lobby
    # Include active PvP games and waiting PvP games
    query = {
        "$or": [
            {"status": "active", "mode": {"$ne": "pve"}},  # Active non-PvE games
            {"status": "waiting", "mode": "pvp-online"}   # Waiting online PvP games
        ]
    }
    
    async for game_doc in games_collection.find(query, {"moves": 0}).sort("created_at", -1).limit(20):
        game_doc["id"] = str(game_doc["_id"])
        del game_doc["_id"]
        
        # Add player count for display purposes
        player_count = 0
        if game_doc.get("players", {}).get("black"):
            player_count += 1
        if game_doc.get("players", {}).get("white") and game_doc["players"]["white"].get("id") != "ai":
            player_count += 1
        game_doc["player_count"] = player_count
        
        games.append(game_doc)
    
    return games

@router.get("/players")
async def get_online_players(current_user: User = Depends(get_current_user)):
    """Get list of online players in the lobby."""
    # Import here to avoid circular imports
    from .websocket_games import game_manager
    
    # Get currently online players from the WebSocket manager
    online_players = []
    for user_id, player_data in game_manager.online_players.items():
        # Create a clean player object
        player = {
            "id": player_data.get("id", user_id),
            "username": player_data.get("username", player_data.get("email", "Unknown")),
            "email": player_data.get("email", ""),
            "last_login": player_data.get("last_login"),
            "in_queue": user_id in game_manager.waiting_queue
        }
        online_players.append(player)
    
    return online_players

@router.get("/queue")
async def get_waiting_queue(current_user: User = Depends(get_current_user)):
    """Get current waiting queue for matchmaking."""
    from .websocket_games import game_manager
    
    queue_players = []
    for user_id in game_manager.waiting_queue:
        if user_id in game_manager.online_players:
            player_data = game_manager.online_players[user_id]
            queue_players.append({
                "id": player_data.get("id", user_id),
                "username": player_data.get("username", player_data.get("email", "Unknown")),
                "email": player_data.get("email", ""),
                "joined_queue_at": None  # TODO: Track when players joined queue
            })
    
    return {
        "queue": queue_players,
        "size": len(queue_players),
        "estimated_wait_time": max(0, (len(queue_players) - 1) * 30)  # Estimate 30s per player ahead
    }

@router.get("/stats")
async def get_lobby_stats(current_user: User = Depends(get_current_user)):
    """Get overall lobby statistics."""
    from .websocket_games import game_manager
    
    games_collection = await get_collection("games")
    
    # Count different types of active games
    active_games = await games_collection.count_documents({"status": "active"})
    waiting_games = await games_collection.count_documents({"status": "waiting"})
    
    return {
        "online_players": len(game_manager.online_players),
        "waiting_queue_size": len(game_manager.waiting_queue),
        "active_games": active_games,
        "waiting_games": waiting_games,
        "total_games_today": await games_collection.count_documents({
            "created_at": {"$gte": current_user.created_at.replace(hour=0, minute=0, second=0, microsecond=0)}
        }) if hasattr(current_user, 'created_at') else 0
    }

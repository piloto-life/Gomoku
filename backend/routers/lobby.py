from fastapi import APIRouter, Depends
from typing import List

from models.user import User
from routers.auth import get_current_user
from database import get_collection

router = APIRouter()

@router.get("/games")
async def get_active_games(current_user: User = Depends(get_current_user)):
    """Get list of active games."""
    games_collection = await get_collection("games")
    games = []
    async for game_doc in games_collection.find({"status": "active"}, {"moves": 0}):
        game_doc["id"] = str(game_doc["_id"])
        del game_doc["_id"]
        games.append(game_doc)
    return games

@router.get("/players")
async def get_online_players(current_user: User = Depends(get_current_user)):
    """Get list of online players."""
    # This is a mock implementation. Real implementation would require
    # tracking users via WebSocket connections.
    users_collection = await get_collection("users")
    players = []
    async for user_doc in users_collection.find({}, {"password_hash": 0, "email": 0}).limit(20):
        user_doc["id"] = str(user_doc["_id"])
        del user_doc["_id"]
        players.append(user_doc)
    return players

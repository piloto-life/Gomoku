from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime
from bson import ObjectId

from database import get_collection
from models.user import UserPublic
from routers.auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    type: Literal["lobby", "game"]
    game_id: Optional[str] = None
    user_id: str
    username: str
    message: str
    timestamp: datetime


class ChatMessageResponse(BaseModel):
    id: str
    type: str
    game_id: Optional[str]
    user_id: str
    username: str
    message: str
    timestamp: str
    created_at: str


@router.post("/messages", response_model=dict)
async def save_chat_message(
    chat_msg: ChatMessage,
    current_user: UserPublic = Depends(get_current_user)
):
    """Save a chat message to the database"""
    
    # Verify user is the one sending the message
    if chat_msg.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot send message as another user")
    
    # Validate game_id for game chat
    if chat_msg.type == "game" and not chat_msg.game_id:
        raise HTTPException(status_code=400, detail="game_id required for game chat")
    
    collection = await get_collection("chat_messages")
    
    message_doc = {
        "type": chat_msg.type,
        "game_id": chat_msg.game_id,
        "user_id": chat_msg.user_id,
        "username": chat_msg.username,
        "message": chat_msg.message,
        "timestamp": chat_msg.timestamp,
        "created_at": datetime.utcnow()
    }
    
    result = await collection.insert_one(message_doc)
    
    return {
        "id": str(result.inserted_id),
        "message": "Chat message saved successfully"
    }


@router.get("/messages/{game_id}", response_model=List[ChatMessageResponse])
async def get_game_chat_history(
    game_id: str,
    limit: int = Query(100, ge=1, le=500),
    current_user: UserPublic = Depends(get_current_user)
):
    """Get chat history for a specific game"""
    
    # Verify user is part of the game
    games_collection = await get_collection("games")
    game = await games_collection.find_one({"_id": ObjectId(game_id)})
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check if user is a player in this game
    user_in_game = (
        game.get("players", {}).get("black", {}).get("id") == current_user.id or
        game.get("players", {}).get("white", {}).get("id") == current_user.id
    )
    
    if not user_in_game:
        raise HTTPException(status_code=403, detail="Not authorized to view this game's chat")
    
    # Get chat messages
    collection = await get_collection("chat_messages")
    cursor = collection.find(
        {"type": "game", "game_id": game_id}
    ).sort("timestamp", 1).limit(limit)
    
    messages = []
    async for msg in cursor:
        messages.append(ChatMessageResponse(
            id=str(msg["_id"]),
            type=msg["type"],
            game_id=msg.get("game_id"),
            user_id=msg["user_id"],
            username=msg["username"],
            message=msg["message"],
            timestamp=msg["timestamp"].isoformat(),
            created_at=msg["created_at"].isoformat()
        ))
    
    return messages


@router.get("/lobby", response_model=List[ChatMessageResponse])
async def get_lobby_chat_history(
    limit: int = Query(100, ge=1, le=500),
    current_user: UserPublic = Depends(get_current_user)
):
    """Get lobby chat history"""
    
    collection = await get_collection("chat_messages")
    cursor = collection.find(
        {"type": "lobby"}
    ).sort("timestamp", 1).limit(limit)
    
    messages = []
    async for msg in cursor:
        messages.append(ChatMessageResponse(
            id=str(msg["_id"]),
            type=msg["type"],
            game_id=msg.get("game_id"),
            user_id=msg["user_id"],
            username=msg["username"],
            message=msg["message"],
            timestamp=msg["timestamp"].isoformat(),
            created_at=msg["created_at"].isoformat()
        ))
    
    return messages


@router.delete("/messages/{message_id}")
async def delete_chat_message(
    message_id: str,
    current_user: UserPublic = Depends(get_current_user)
):
    """Delete a chat message (admin or message owner only)"""
    
    collection = await get_collection("chat_messages")
    message = await collection.find_one({"_id": ObjectId(message_id)})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only allow deletion by message owner or admin
    if message["user_id"] != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")
    
    await collection.delete_one({"_id": ObjectId(message_id)})
    
    return {"message": "Chat message deleted successfully"}

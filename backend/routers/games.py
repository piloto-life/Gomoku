from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel

from routers.auth import get_current_user
from database import get_collection
from models.user import UserPublic
from .websocket_games import game_manager

router = APIRouter()

class CreateGameRequest(BaseModel):
    mode: str  # "pvp-local", "pvp-online", "pve"
    difficulty: Optional[str] = "medium"  # "easy", "medium", "hard"

class GameResponse(BaseModel):
    id: str
    mode: str
    status: str
    created_at: datetime

class MoveRequest(BaseModel):
    row: int
    col: int

@router.post("/create", response_model=GameResponse)
async def create_game(request: CreateGameRequest, current_user: UserPublic = Depends(get_current_user)):
    """Create a new game with specified mode and difficulty"""
    try:
        print(f"🎮 Creating game - Mode: {request.mode}, User: {current_user.username}")
        
        # Validar modo de jogo
        valid_modes = ["pvp-local", "pvp-online", "pve"]
        if request.mode not in valid_modes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid game mode. Must be one of: {valid_modes}"
            )
        
        # Validar dificuldade para jogos PvE
        if request.mode == "pve":
            valid_difficulties = ["easy", "medium", "hard"]
            if request.difficulty not in valid_difficulties:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid difficulty. Must be one of: {valid_difficulties}"
                )
        
        games_collection = await get_collection("games")
        print(f"✅ Got games collection")
        
        # Determinar status inicial baseado no modo
        initial_status = "active" if request.mode == "pve" else "waiting"
        
        # Create game document
        game_doc = {
            "mode": request.mode,
            "difficulty": request.difficulty,
            "status": initial_status,
            "board": [[None for _ in range(19)] for _ in range(19)],
            "current_player": "black",
            "players": {
                "black": {
                    "id": current_user.id,
                    "username": current_user.username,
                    "email": current_user.email
                }
            },
            "moves": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        print(f"📄 Game document created with status: {initial_status}")
        
        # Add AI player for PvE mode
        if request.mode == "pve":
            game_doc["players"]["white"] = {
                "id": "ai",
                "username": f"AI ({request.difficulty})",
                "email": "ai@gomoku.com"
            }
            print(f"🤖 Added AI player for PvE mode")
        
        print(f"💾 Inserting game into database...")
        result = await games_collection.insert_one(game_doc)
        game_id = str(result.inserted_id)
        print(f"✅ Game inserted with ID: {game_id}")
        
        response = GameResponse(
            id=game_id,
            mode=request.mode,
            status=initial_status,
            created_at=game_doc["created_at"]
        )
        
        # Só faz broadcast para lobby se for partida online (que precisa de outro jogador)
        if request.mode == "pvp-online":
            print("📡 Broadcasting game to lobby for matchmaking...")
            game_data = response.dict()
            game_data["created_at"] = game_doc["created_at"].isoformat()
            await game_manager.broadcast_to_lobby({"type": "game_created", "game": game_data})
        else:
            print("🎯 Single-player or local game - no lobby broadcast needed")
        
        print("✅ Game creation completed successfully")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ Error creating game: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create game: {str(e)}"
        )

@router.get("/")
async def get_games(current_user: UserPublic = Depends(get_current_user)):
    """Get all games for the current user"""
    try:
        games_collection = await get_collection("games")
        
        games = await games_collection.find({
            "$or": [
                {"players.black.id": current_user.id},
                {"players.white.id": current_user.id}
            ]
        }).to_list(length=100)
        
        # Convert ObjectId to string
        for game in games:
            game["id"] = str(game["_id"])
            del game["_id"]
        
        return games
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve games"
        )

@router.get("/{game_id}")
async def get_game(game_id: str, current_user: UserPublic = Depends(get_current_user)):
    """Get a specific game by ID"""
    try:
        games_collection = await get_collection("games")
        
        game = await games_collection.find_one({"_id": ObjectId(game_id)})
        
        if not game:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game not found"
            )
        
        # Check if user is part of this game
        user_in_game = (
            game["players"]["black"]["id"] == current_user.id or 
            game["players"]["white"]["id"] == current_user.id
        )
        
        if not user_in_game:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this game"
            )
        
        game["id"] = str(game["_id"])
        del game["_id"]
        
        return game
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve game"
        )

@router.post("/{game_id}/move")
async def make_move(
    game_id: str, 
    move: MoveRequest, 
    current_user: UserPublic = Depends(get_current_user)
):
    """Make a move in a game"""
    try:
        games_collection = await get_collection("games")
        
        game = await games_collection.find_one({"_id": ObjectId(game_id)})
        
        if not game:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game not found"
            )
        
        # Validate move and update game state
        # This is a simplified version - you'd want more comprehensive game logic
        
        board = game["board"]
        if board[move.row][move.col] is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Position already occupied"
            )
        
        # Update board
        current_player = game["current_player"]
        board[move.row][move.col] = current_player
        
        # Switch player
        next_player = "white" if current_player == "black" else "black"
        
        # Update game
        await games_collection.update_one(
            {"_id": ObjectId(game_id)},
            {
                "$set": {
                    "board": board,
                    "current_player": next_player,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"success": True, "current_player": next_player}
        
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to make move"
        )

@router.post("/{game_id}/leave")
async def leave_game(game_id: str, current_user: UserPublic = Depends(get_current_user)):
    """Handle a user leaving a game."""
    games_collection = await get_collection("games")
    
    game = await games_collection.find_one({"_id": ObjectId(game_id)})
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

    # In a real scenario, you might want to handle this differently,
    # e.g., mark the game as abandoned, declare the other player the winner, etc.
    # For now, we'll just acknowledge the request.
    return {"success": True, "message": "You have left the game."}
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import json
import logging

from models.game import (
    Game, GameCreate, GameInDB, MoveRequest, Position, Move, 
    PieceColor, GameStatus, Player, GameResponse, CreateGameRequest
)
from models.user import User
from routers.auth import get_current_user
from database import get_database
from services.game_logic import GameLogic
from routers.websocket import manager as websocket_manager

router = APIRouter()
logger = logging.getLogger(__name__)
game_logic = GameLogic()

@router.post("/", response_model=GameResponse)
async def create_game(request: CreateGameRequest, current_user: User = Depends(get_current_user)):
    """Create a new game with specified mode and difficulty"""
    try:
        # Initialize board (19x19 for Gomoku)
        board = [[None for _ in range(19)] for _ in range(19)]
        
        # Set up players based on game mode
        if request.game_mode == "pve":
            # Player vs AI
            players = {
                "black": {
                    "id": str(current_user.id),
                    "name": current_user.username,
                    "rating": current_user.rating
                },
                "white": {
                    "id": "ai",
                    "name": f"IA ({request.ai_difficulty.title()})",
                    "rating": 1200  # Default AI rating
                }
            }
        elif request.game_mode == "pvp-local":
            # Local multiplayer (2 players on same device)
            players = {
                "black": {
                    "id": str(current_user.id),
                    "name": f"{current_user.username} (Jogador 1)",
                    "rating": current_user.rating
                },
                "white": {
                    "id": f"local_{current_user.id}",
                    "name": f"{current_user.username} (Jogador 2)", 
                    "rating": current_user.rating
                }
            }
        else:  # pvp-online
            # Online multiplayer (waiting for opponent)
            players = {
                "black": {
                    "id": str(current_user.id),
                    "name": current_user.username,
                    "rating": current_user.rating
                },
                "white": None  # Will be set when opponent joins
            }
        
        game_data = {
            "board": board,
            "currentPlayer": "black",
            "players": players,
            "status": "active" if request.game_mode in ["pve", "pvp-local"] else "waiting",
            "gameMode": request.game_mode,
            "aiDifficulty": request.ai_difficulty if request.game_mode == "pve" else None,
            "moves": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # Insert game into database
        db = await get_database()
        result = await db.games.insert_one(game_data)
        game_id = str(result.inserted_id)
        
        # Get the created game
        game = await db.games.find_one({"_id": ObjectId(game_id)})
        if not game:
            raise HTTPException(status_code=500, detail="Failed to create game")
        
        # Convert to response format
        game_response = GameResponse(
            id=game_id,
            board=game["board"],
            currentPlayer=game["currentPlayer"],
            players=game["players"],
            status=game["status"],
            gameMode=game["gameMode"],
            aiDifficulty=game.get("aiDifficulty"),
            moves=game["moves"],
            createdAt=game["createdAt"],
            updatedAt=game["updatedAt"],
            winner=game.get("winner")
        )
        
        # Notify via WebSocket for online games
        if request.game_mode == "pvp-online":
            await websocket_manager.broadcast_to_lobby({
                "type": "game_created",
                "game": game_response.dict()
            })
        
        return game_response
        
    except Exception as e:
        logger.error(f"Error creating game: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create game")

@router.get("/", response_model=List[GameResponse])
async def get_games(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get list of games"""
    try:
        db = await get_database()
        games_collection = db.games
        
        query = {}
        if status:
            query["status"] = status
        
        games = []
        async for game_doc in games_collection.find(query).sort("createdAt", -1):
            game_response = GameResponse(
                id=str(game_doc["_id"]),
                board=game_doc.get("board", []),
                currentPlayer=game_doc.get("currentPlayer", "black"),
                players=game_doc.get("players", {}),
                status=game_doc.get("status", "waiting"),
                gameMode=game_doc.get("gameMode", "pve"),
                aiDifficulty=game_doc.get("aiDifficulty"),
                moves=game_doc.get("moves", []),
                createdAt=game_doc.get("createdAt"),
                updatedAt=game_doc.get("updatedAt"),
                winner=game_doc.get("winner")
            )
            games.append(game_response)
        
        return games
    except Exception as e:
        logger.error(f"Error getting games: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get games")

@router.get("/{game_id}", response_model=GameResponse)
async def get_game(
    game_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get game by ID"""
    try:
        db = await get_database()
        games_collection = db.games
        
        if not ObjectId.is_valid(game_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid game ID"
            )
        
        game_doc = await games_collection.find_one({"_id": ObjectId(game_id)})
        
        if not game_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game not found"
            )
        
        game_response = GameResponse(
            id=str(game_doc["_id"]),
            board=game_doc.get("board", []),
            currentPlayer=game_doc.get("currentPlayer", "black"),
            players=game_doc.get("players", {}),
            status=game_doc.get("status", "waiting"),
            gameMode=game_doc.get("gameMode", "pve"),
            aiDifficulty=game_doc.get("aiDifficulty"),
            moves=game_doc.get("moves", []),
            createdAt=game_doc.get("createdAt"),
            updatedAt=game_doc.get("updatedAt"),
            winner=game_doc.get("winner")
        )
        
        return game_response
    except Exception as e:
        logger.error(f"Error getting game: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get game")

@router.post("/{game_id}/join", response_model=GameResponse)
async def join_game(
    game_id: str,
    current_user: User = Depends(get_current_user)
):
    """Join an existing game"""
    try:
        db = await get_database()
        games_collection = db.games
        
        if not ObjectId.is_valid(game_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid game ID"
            )
        
        game_doc = await games_collection.find_one({"_id": ObjectId(game_id)})
        
        if not game_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game not found"
            )
        
        # Check if game is joinable
        if game_doc.get("status") != "waiting":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Game is not accepting new players"
            )
        
        # Check if user is already in game
        players = game_doc.get("players", {})
        for player in players.values():
            if player and player.get("id") == str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You are already in this game"
                )
        
        # Add player as white
        if players.get("white") is None:
            player_data = {
                "id": str(current_user.id),
                "name": current_user.username,
                "rating": current_user.rating
            }
            
            await games_collection.update_one(
                {"_id": ObjectId(game_id)},
                {
                    "$set": {
                        "players.white": player_data,
                        "status": "active",
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            # Get updated game
            updated_game = await games_collection.find_one({"_id": ObjectId(game_id)})
            game_response = GameResponse(
                id=str(updated_game["_id"]),
                board=updated_game.get("board", []),
                currentPlayer=updated_game.get("currentPlayer", "black"),
                players=updated_game.get("players", {}),
                status=updated_game.get("status", "active"),
                gameMode=updated_game.get("gameMode", "pvp-online"),
                aiDifficulty=updated_game.get("aiDifficulty"),
                moves=updated_game.get("moves", []),
                createdAt=updated_game.get("createdAt"),
                updatedAt=updated_game.get("updatedAt"),
                winner=updated_game.get("winner")
            )
            return game_response
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Game is full"
        )
    except Exception as e:
        logger.error(f"Error joining game: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to join game")

@router.post("/{game_id}/move", response_model=GameResponse)
async def make_move(
    game_id: str,
    move_request: MoveRequest,
    current_user: User = Depends(get_current_user)
):
    """Make a move in the game"""
    try:
        db = await get_database()
        games_collection = db.games
        
        if not ObjectId.is_valid(game_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid game ID"
            )
        
        game_doc = await games_collection.find_one({"_id": ObjectId(game_id)})
        
        if not game_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game not found"
            )
        
        # Check if game is active
        if game_doc.get("status") != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Game is not active"
            )
        
        # Validate player turn
        current_player = game_doc.get("currentPlayer", "black")
        players = game_doc.get("players", {})
        
        if current_player not in players or not players[current_player]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid game state"
            )
        
        if players[current_player].get("id") != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="It's not your turn"
            )
        
        # Validate move
        board = game_doc.get("board", [])
        x, y = move_request.position.x, move_request.position.y
        
        if not game_logic.is_valid_move(board, move_request.position):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid move"
            )
        
        # Make move
        new_board = [row[:] for row in board]  # Deep copy
        new_board[y][x] = current_player
        
        # Create move record
        move = {
            "position": {"x": x, "y": y},
            "player": current_player,
            "timestamp": datetime.utcnow()
        }
        
        # Check for win
        winner = game_logic.check_winner(new_board, move_request.position, current_player)
        
        # Prepare update data
        update_data = {
            "board": new_board,
            "updatedAt": datetime.utcnow(),
        }
        
        if winner:
            update_data["status"] = "finished"
            update_data["winner"] = winner
        else:
            # Switch player
            next_player = "white" if current_player == "black" else "black"
            update_data["currentPlayer"] = next_player
        
        # Update game
        await games_collection.update_one(
            {"_id": ObjectId(game_id)},
            {"$set": update_data, "$push": {"moves": move}}
        )
        
        # Get updated game
        updated_game = await games_collection.find_one({"_id": ObjectId(game_id)})
        
        game_response = GameResponse(
            id=str(updated_game["_id"]),
            board=updated_game.get("board", []),
            currentPlayer=updated_game.get("currentPlayer", "black"),
            players=updated_game.get("players", {}),
            status=updated_game.get("status", "active"),
            gameMode=updated_game.get("gameMode", "pve"),
            aiDifficulty=updated_game.get("aiDifficulty"),
            moves=updated_game.get("moves", []),
            createdAt=updated_game.get("createdAt"),
            updatedAt=updated_game.get("updatedAt"),
            winner=updated_game.get("winner")
        )
        
        # Notify via WebSocket
        try:
            await websocket_manager.notify_game_update(
                game_id,
                {
                    "type": "game_state_update",
                    "game": game_response.dict(),
                    "last_move": move
                }
            )
        except Exception as ws_error:
            logger.warning(f"WebSocket notification failed: {str(ws_error)}")
        
        return game_response
        
    except Exception as e:
        logger.error(f"Error making move: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to make move")

@router.delete("/{game_id}")
async def delete_game(
    game_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a game (only creator can delete)"""
    try:
        db = await get_database()
        games_collection = db.games
        
        if not ObjectId.is_valid(game_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid game ID"
            )
        
        game_doc = await games_collection.find_one({"_id": ObjectId(game_id)})
        
        if not game_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game not found"
            )
        
        # Check if user is the creator (black player)
        players = game_doc.get("players", {})
        black_player = players.get("black")
        if not black_player or black_player.get("id") != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the game creator can delete the game"
            )
        
        await games_collection.delete_one({"_id": ObjectId(game_id)})
        
        return {"message": "Game deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting game: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete game")

@router.patch("/{game_id}/ai-difficulty")
async def update_ai_difficulty(
    game_id: str,
    difficulty: str,
    current_user: User = Depends(get_current_user)
):
    """Update AI difficulty for PvE games"""
    try:
        db = await get_database()
        games_collection = db.games
        
        if not ObjectId.is_valid(game_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid game ID"
            )
        
        # Validate difficulty level
        valid_difficulties = ["easy", "medium", "hard"]
        if difficulty not in valid_difficulties:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid difficulty. Must be one of: {valid_difficulties}"
            )
        
        game_doc = await games_collection.find_one({"_id": ObjectId(game_id)})
        
        if not game_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game not found"
            )
        
        # Check if it's a PvE game
        if game_doc.get("gameMode") != "pve":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="AI difficulty can only be set for PvE games"
            )
        
        # Check if user is in the game
        players = game_doc.get("players", {})
        player_ids = [p.get("id") for p in players.values() if p]
        if str(current_user.id) not in player_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only players in the game can change AI difficulty"
            )
        
        # Update difficulty
        await games_collection.update_one(
            {"_id": ObjectId(game_id)},
            {"$set": {"aiDifficulty": difficulty, "updatedAt": datetime.utcnow()}}
        )
        
        # Notify via WebSocket
        try:
            await websocket_manager.notify_game_update(
                game_id,
                {
                    "type": "ai_difficulty_changed",
                    "difficulty": difficulty,
                    "message": f"AI difficulty changed to {difficulty}"
                }
            )
        except Exception as ws_error:
            logger.warning(f"WebSocket notification failed: {str(ws_error)}")
        
        return {"message": f"AI difficulty updated to {difficulty}"}
        
    except Exception as e:
        logger.error(f"Error updating AI difficulty: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update AI difficulty")

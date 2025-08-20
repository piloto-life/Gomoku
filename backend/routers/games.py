from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from models.game import Game, GameCreate, GameInDB, MoveRequest, Position, Move, PieceColor, GameStatus, Player
from models.user import User
from routers.auth import get_current_user
from database import get_collection
from services.game_logic import GameLogic

router = APIRouter()

@router.post("/", response_model=Game)
async def create_game(
    game_data: GameCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new game"""
    games_collection = await get_collection("games")
    
    # Create player object
    player = Player(
        id=current_user.id,
        username=current_user.username,
        rating=current_user.stats.current_score
    )
    
    # Create game
    game_in_db = GameInDB(
        **game_data.dict(),
        players={"black": player} if game_data.game_mode == "pvp" else {"black": player, "white": Player(id="ai", username="AI Bot", rating=1000)}
    )
    
    result = await games_collection.insert_one(game_in_db.dict(by_alias=True))
    
    # Get created game
    created_game = await games_collection.find_one({"_id": result.inserted_id})
    return Game(**created_game)

@router.get("/", response_model=List[Game])
async def get_games(
    status: Optional[GameStatus] = None,
    current_user: User = Depends(get_current_user)
):
    """Get list of games"""
    games_collection = await get_collection("games")
    
    query = {}
    if status:
        query["status"] = status
    
    games = []
    async for game_doc in games_collection.find(query).sort("created_at", -1):
        games.append(Game(**game_doc))
    
    return games

@router.get("/{game_id}", response_model=Game)
async def get_game(
    game_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get game by ID"""
    games_collection = await get_collection("games")
    
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
    
    return Game(**game_doc)

@router.post("/{game_id}/join", response_model=Game)
async def join_game(
    game_id: str,
    current_user: User = Depends(get_current_user)
):
    """Join an existing game"""
    games_collection = await get_collection("games")
    
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
    
    game = Game(**game_doc)
    
    # Check if game is joinable
    if game.status != GameStatus.WAITING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Game is not accepting new players"
        )
    
    # Check if user is already in game
    if current_user.id in [p.id for p in game.players.values()]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already in this game"
        )
    
    # Add player as white
    if "white" not in game.players:
        player = Player(
            id=current_user.id,
            username=current_user.username,
            rating=current_user.stats.current_score
        )
        
        await games_collection.update_one(
            {"_id": ObjectId(game_id)},
            {
                "$set": {
                    f"players.white": player.dict(),
                    "status": GameStatus.ACTIVE,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Get updated game
        updated_game = await games_collection.find_one({"_id": ObjectId(game_id)})
        return Game(**updated_game)
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Game is full"
    )

@router.post("/{game_id}/move", response_model=Game)
async def make_move(
    game_id: str,
    move_request: MoveRequest,
    current_user: User = Depends(get_current_user)
):
    """Make a move in the game"""
    games_collection = await get_collection("games")
    
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
    
    game = Game(**game_doc)
    
    # Check if game is active
    if game.status != GameStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Game is not active"
        )
    
    # Check if it's the player's turn
    current_player_id = None
    if game.current_player == PieceColor.BLACK and "black" in game.players:
        current_player_id = game.players["black"].id
    elif game.current_player == PieceColor.WHITE and "white" in game.players:
        current_player_id = game.players["white"].id
    
    if current_player_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="It's not your turn"
        )
    
    # Validate move
    game_logic = GameLogic()
    if not game_logic.is_valid_move(game.board, move_request.position):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid move"
        )
    
    # Make move
    new_board = game_logic.make_move(game.board, move_request.position, game.current_player)
    
    # Create move record
    move = Move(
        id=str(ObjectId()),
        position=move_request.position,
        player_id=current_user.id,
        piece=game.current_player
    )
    
    # Check for win
    winner = game_logic.check_winner(new_board, move_request.position, game.current_player)
    new_status = GameStatus.FINISHED if winner else GameStatus.ACTIVE
    next_player = PieceColor.WHITE if game.current_player == PieceColor.BLACK else PieceColor.BLACK
    
    # Update game
    update_data = {
        "board": new_board,
        "current_player": next_player,
        "status": new_status,
        "updated_at": datetime.utcnow(),
        "$push": {"moves": move.dict()}
    }
    
    if winner:
        update_data["winner"] = winner
    
    await games_collection.update_one(
        {"_id": ObjectId(game_id)},
        {"$set": {k: v for k, v in update_data.items() if k != "$push"}, **{"$push": update_data["$push"]}}
    )
    
    # Get updated game
    updated_game = await games_collection.find_one({"_id": ObjectId(game_id)})
    return Game(**updated_game)

@router.delete("/{game_id}")
async def delete_game(
    game_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a game (only creator can delete)"""
    games_collection = await get_collection("games")
    
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
    if "black" not in game_doc["players"] or game_doc["players"]["black"]["id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the game creator can delete the game"
        )
    
    await games_collection.delete_one({"_id": ObjectId(game_id)})
    
    return {"message": "Game deleted successfully"}

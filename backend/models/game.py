from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from bson import ObjectId
from models.user import PyObjectId

class GameStatus(str, Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    FINISHED = "finished"
    PAUSED = "paused"

class PieceColor(str, Enum):
    BLACK = "black"
    WHITE = "white"

class Position(BaseModel):
    # Do not enforce 0-18 bounds at model creation time because some tests
    # intentionally construct out-of-range positions (e.g. Position(-1, 9))
    # and expect the game logic to handle them. Keep type validation only.
    row: int
    col: int

    def __init__(self, *args, **kwargs):
        # Allow positional initialization like Position(9, 9) in tests,
        # while preserving BaseModel validation when keywords are used.
        if len(args) == 2 and not kwargs:
            kwargs = {"row": args[0], "col": args[1]}
        super().__init__(**kwargs)

class Move(BaseModel):
    id: str
    position: Position
    player_id: str
    piece: PieceColor
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Player(BaseModel):
    id: str
    username: str
    rating: int = 1000
    is_online: bool = True

class GameBase(BaseModel):
    board: List[List[Optional[str]]] = Field(default_factory=lambda: [[None for _ in range(19)] for _ in range(19)])
    current_player: PieceColor = PieceColor.BLACK
    status: GameStatus = GameStatus.WAITING
    game_mode: str = "pvp"  # "pvp" or "pve"
    ai_difficulty: str = "medium"  # "easy", "medium", "hard"

class GameCreate(GameBase):
    pass

class GameUpdate(BaseModel):
    board: Optional[List[List[Optional[str]]]] = None
    current_player: Optional[PieceColor] = None
    status: Optional[GameStatus] = None
    winner: Optional[PieceColor] = None

class GameInDB(GameBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    players: Dict[str, Player] = {}
    moves: List[Move] = []
    winner: Optional[PieceColor] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    room_id: Optional[str] = None
    ai_difficulty: str = "medium"

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Game(GameBase):
    id: str = Field(alias="_id")
    players: Dict[str, Player]
    moves: List[Move]
    winner: Optional[PieceColor] = None
    created_at: datetime
    updated_at: datetime
    room_id: Optional[str] = None
    ai_difficulty: str = "medium"

    class Config:
        allow_population_by_field_name = True

class MoveRequest(BaseModel):
    position: Position

class CreateGameRequest(BaseModel):
    game_mode: str = Field(..., pattern=r"^(pvp-local|pvp-online|pve)$")
    ai_difficulty: str = Field(default="medium", pattern=r"^(easy|medium|hard)$")

class GameResponse(BaseModel):
    id: str
    board: List[List[Optional[str]]]
    currentPlayer: PieceColor
    players: Dict[str, Any]
    status: GameStatus
    gameMode: str
    aiDifficulty: Optional[str] = None
    moves: List[Dict[str, Any]]
    createdAt: datetime
    updatedAt: datetime
    winner: Optional[str] = None

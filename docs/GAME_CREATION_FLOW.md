# Game Creation Flow - Complete Documentation

## Overview

This document explains how players join queues and are matched to create games in the Gomoku system.

## High-Level Flow

```
Player 1                    Backend                       Player 2
   |                           |                             |
   | LOGIN (REST)              |                             |
   |------- POST /auth ------->|                             |
   |<---- JWT Token ---------- |                             |
   |                           |                             |
   | CONNECT LOBBY WS          |                             |
   |--- WS /lobby?token ------>|                             |
   |<---- Accept / Upgrade ----|                             |
   |<---- connection_established                             |
   |                           |                             |
   |                           |                        LOGIN (REST)
   |                           |                        POST /auth
   |                           |<--------- JWT Token --------
   |                           |                             |
   |                           |                     CONNECT LOBBY WS
   |                           |<------ WS /lobby?token ----
   |                           |------- Accept / Upgrade --
   |                           |------ connection_established
   |                           |                             |
   | JOIN_QUEUE                |                             |
   |--- WS join_queue -------->|                             |
   |<---- queue_update --------|                             |
   |                           |                             |
   |                           |                    JOIN_QUEUE
   |                           |<----- WS join_queue -------
   |                           |------ queue_update ----->
   |                           |                             |
   |                  [2 players in queue]                   |
   |                  [Create game in MongoDB]              |
   |                  [Get game_id]                         |
   |                           |                             |
   |<--- game_start(id) -------|                             |
   |                  your_id=player1_id          game_start(id) ---|>
   |                  player_ids=[p1,p2]          your_id=player2_id
   |                  players=[p1_obj, p2_obj]    player_ids=[p1,p2]
   |                           |
   | NAVIGATE to /game/{id}    |
   |                           |                 NAVIGATE to /game/{id}
   |                           |                             |
   | CONNECT GAME WS           |                             |
   |--- WS /game/{id} -------->|                             |
   |<---- Accept / Upgrade ----|                             |
   |<---- game_state (board)   |                             |
   |                           |<-- WS /game/{id} ----------
   |                           |---- Accept / Upgrade -----
   |                           |---- game_state (board) --
   |                           |                             |
   | MAKE MOVE (0,0)           |                             |
   |--- move x=0 y=0 -------->|                             |
   |                           |--- broadcast move ------>
   |<--- move_received --------|                             |
   |<--- board_update ---------|<---- move_received -------
   |                           |<---- board_update --------
   |                           |                             |
   | ...game continues...      |                             |
```

## Detailed Steps

### 1. Authentication (REST API)

**Player 1 & 2**: Send login credentials
```http
POST /auth/login
Content-Type: application/json

{
  "username": "player1",
  "password": "password123"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "69015c62f3c4f0ec05ba8363",
    "username": "player1",
    "email": "player1@example.com"
  }
}
```

**Implementation**: `backend/routers/auth.py` → `login` endpoint

### 2. Lobby WebSocket Connection

**Player 1**: Connect to lobby
```javascript
const token = getJWTToken(); // From login response
ws = new WebSocket(`ws://localhost:9000/ws/lobby?token=${token}`);

ws.onopen = () => {
  console.log("Connected to lobby");
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === "connection_established") {
    console.log("Lobby connection confirmed:", msg.user_id);
  } else if (msg.type === "player_joined") {
    console.log("Player joined:", msg.user_id);
  } else if (msg.type === "online_players") {
    console.log("Online players:", msg.players);
  } else if (msg.type === "queue_update") {
    console.log("Queue:", msg.queue);
  } else if (msg.type === "game_start") {
    handleGameStart(msg); // Navigate to game page
  }
};
```

**Backend Processing** (`backend/routers/websocket_games.py`):

```python
@router.websocket("/lobby")
async def websocket_lobby_token_endpoint(websocket: WebSocket):
    # 1. Extract token BEFORE accepting
    token = extract_token_from_query(websocket.url.query)
    
    # 2. Authenticate BEFORE accepting
    if not token or not (user := await get_user_from_token(token)):
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    # 3. Handle old connections BEFORE accepting
    if user.id in game_manager.user_connections:
        old_ws = game_manager.user_connections[user.id]
        await old_ws.send_text(json.dumps({
            "type": "session_replaced",
            "reason": "New connection established"
        }))
        await old_ws.close(code=4000)
        # Remove from active but KEEP in online_players
    
    # 4. NOW accept the new connection
    await websocket.accept()
    
    # 5. Register in lobby
    await game_manager.connect_to_lobby(websocket, user.id, user.dict())
    
    # 6. Send confirmations
    await websocket.send_text(json.dumps({
        "type": "connection_established",
        "user_id": user.id,
        "message": "Successfully connected to lobby"
    }))
    
    # 7. Broadcast updates
    await game_manager.broadcast_to_lobby({
        "type": "player_joined",
        "user_id": user.id
    })
    await game_manager.broadcast_online_players()
    
    # 8. Listen for messages
    while True:
        data = await websocket.receive_text()
        message = json.loads(data)
        
        if message.get("type") == "join_queue":
            await handle_join_queue(user.id, websocket)
        elif message.get("type") == "leave_queue":
            await handle_leave_queue(user.id)
```

**WebSocket State After Connection**:
- `game_manager.active_connections` includes the new WebSocket
- `game_manager.online_players[user.id]` is set
- `broadcast_online_players()` notifies all lobby clients of the new player
- Connection stays open, ready for `join_queue` messages

### 3. Join Queue (WebSocket Message)

**Player 1**: Send join_queue message
```javascript
ws.send(JSON.stringify({
  type: "join_queue"
}));
```

**Backend Processing**:
```python
async def handle_join_queue(user_id, websocket):
    # 1. Add to waiting queue
    if user_id not in game_manager.waiting_queue:
        game_manager.waiting_queue.append(user_id)
    
    # 2. Check if 2+ players in queue
    if len(game_manager.waiting_queue) >= 2:
        # Get first two players
        player1_id = game_manager.waiting_queue.pop(0)
        player2_id = game_manager.waiting_queue.pop(0)
        
        # 3. Get player documents from MongoDB
        p1 = await get_user_by_id(player1_id)
        p2 = await get_user_by_id(player2_id)
        
        if not p1 or not p2:
            print(f"Error: One or both players not found")
            game_manager.waiting_queue.extend([player1_id, player2_id])
            return
        
        # 4. Create game in MongoDB
        game_doc = {
            "black": {"id": player1_id, "name": p1.username, "avatar": p1.avatar},
            "white": {"id": player2_id, "name": p2.username, "avatar": p2.avatar},
            "players": {
                "black": {"id": player1_id, "name": p1.username},
                "white": {"id": player2_id, "name": p2.username}
            },
            "board": [[0] * 19 for _ in range(19)],  # Empty board
            "current_turn": "black",
            "status": "active",
            "created_at": datetime.datetime.now()
        }
        result = db.games.insert_one(game_doc)
        game_id = str(result.inserted_id)
        
        # 5. Send game_start to both players
        game_start_msg = {
            "type": "game_start",
            "game_id": game_id,
            "your_id": player1_id,
            "players": [
                {"id": player1_id, "color": "black", "name": p1.username},
                {"id": player2_id, "color": "white", "name": p2.username}
            ],
            "player_ids": [player1_id, player2_id]
        }
        
        # Send to player 1
        try:
            p1_ws = game_manager.user_connections.get(player1_id)
            if p1_ws:
                await p1_ws.send_text(json.dumps(game_start_msg))
        except Exception as e:
            print(f"Error sending game_start to player 1: {e}")
        
        # Send to player 2 (with their_id updated)
        game_start_msg["your_id"] = player2_id
        try:
            p2_ws = game_manager.user_connections.get(player2_id)
            if p2_ws:
                await p2_ws.send_text(json.dumps(game_start_msg))
        except Exception as e:
            print(f"Error sending game_start to player 2: {e}")
    
    # 6. Broadcast queue update to all lobby clients
    await game_manager.broadcast_queue_update()
```

**Key State Changes**:
- `waiting_queue` now contains both players (temporarily)
- Game created in MongoDB with `_id` = game_id
- Both players' lobby WebSockets receive `game_start` message
- Queue broadcasts to all lobby clients (updated count)

### 4. Frontend Parsing game_start

**Frontend** (`frontend/src/pages/Lobby.tsx`):

```typescript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === "game_start") {
    // STRICT PARSING: Require explicit player identification
    let yourPlayerId: string | undefined;
    
    // 1. Try message.your_id (most explicit)
    if (message.your_id) {
      yourPlayerId = message.your_id;
    }
    // 2. Try message.players with player_ids
    else if (message.players && message.player_ids) {
      yourPlayerId = message.player_ids[0]; // Fallback heuristic
    }
    // 3. Try message.player_ids directly
    else if (message.player_ids) {
      yourPlayerId = message.player_ids[0]; // Fallback heuristic
    }
    
    if (!yourPlayerId) {
      console.error("game_start message missing player identification");
      return;
    }
    
    // Store in context for game page
    setGameState({
      game_id: message.game_id,
      your_id: yourPlayerId,
      players: message.players,
      player_ids: message.player_ids
    });
    
    // Navigate to game page
    navigate(`/game/${message.game_id}`);
  }
};
```

**Frontend Safeguards**:
- Requires `message.your_id` (explicit field)
- Falls back to `message.player_ids` only if necessary
- Logs error if no identification found
- Does NOT guess based on user ID string matching

### 5. Game WebSocket Connection

**Frontend**: After navigating to `/game/{id}`, connect to game WebSocket
```javascript
const gameWs = new WebSocket(
  `ws://localhost:9000/ws/game/${gameId}?token=${token}`
);

gameWs.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === "game_state") {
    // Load initial board state
    setBoard(msg.board);
    setCurrentTurn(msg.current_turn);
  } else if (msg.type === "move_received") {
    // Opponent made a move
    updateBoard(msg.x, msg.y, msg.color);
    setCurrentTurn(msg.next_turn);
  }
};
```

**Backend** (`backend/routers/websocket_games.py`):
```python
@router.websocket("/game/{game_id}")
async def websocket_game_endpoint(game_id: str, websocket: WebSocket):
    # 1. Authenticate user
    token = extract_token(websocket.url.query)
    user = await get_user_from_token(token)
    
    # 2. Verify user is in this game
    game = db.games.find_one({"_id": ObjectId(game_id)})
    if user.id not in [game["black"]["id"], game["white"]["id"]]:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    # 3. Accept connection
    await websocket.accept()
    
    # 4. Register in game room
    game_manager.game_rooms[game_id].add(websocket)
    
    # 5. Send initial game state
    await websocket.send_text(json.dumps({
        "type": "game_state",
        "game_id": game_id,
        "board": game["board"],
        "current_turn": game["current_turn"],
        "players": game["players"]
    }))
    
    # 6. Listen for moves
    while True:
        data = await websocket.receive_text()
        message = json.loads(data)
        
        if message.get("type") == "move":
            # Process move, update board, broadcast to both players
            x, y = message["x"], message["y"]
            # ... validation and game logic ...
            
            # Broadcast to all players in game
            move_msg = {
                "type": "move_received",
                "x": x,
                "y": y,
                "color": game["current_turn"],
                "next_turn": "white" if game["current_turn"] == "black" else "black"
            }
            for ws in game_manager.game_rooms[game_id]:
                await ws.send_text(json.dumps(move_msg))
```

## Data Structures

### GameConnectionManager

```python
class GameConnectionManager:
    def __init__(self):
        # WebSocket connections mapped by user_id
        self.user_connections: Dict[str, WebSocket] = {}
        
        # All active WebSocket connections
        self.active_connections: List[WebSocket] = []
        
        # Players currently in lobby (available for matching)
        self.online_players: Dict[str, dict] = {}
        
        # Players waiting in queue
        self.waiting_queue: List[str] = []
        
        # Game rooms: {game_id -> {WebSocket1, WebSocket2}}
        self.game_rooms: Dict[str, Set[WebSocket]] = {}
```

### Game Document (MongoDB)

```json
{
  "_id": ObjectId("..."),
  "black": {
    "id": "user1_id",
    "name": "player1",
    "avatar": "avatar_url"
  },
  "white": {
    "id": "user2_id",
    "name": "player2",
    "avatar": "avatar_url"
  },
  "players": {
    "black": {"id": "user1_id", "name": "player1"},
    "white": {"id": "user2_id", "name": "player2"}
  },
  "board": [
    [0, 0, 0, ..., 0],  // 0 = empty, 1 = black, 2 = white
    [0, 0, 0, ..., 0],
    ...
  ],
  "current_turn": "black",
  "status": "active",
  "created_at": "2025-11-02T20:38:41Z"
}
```

## Error Cases

### Error: Players Not Found in online_players
```
Error: One or both players not found in online_players
```

**Cause**: User was in queue but disconnected from lobby
**Fix**: When reconnecting, keep user in `online_players`; only remove WebSocket from active

### Error: game_start Message Not Received
```
Backend: Successfully sent game_start to player 1
Frontend: No game_start message received
```

**Cause**: Lobby WebSocket was closed before game_start was sent
**Solution**: Ensure WebSocket stays open after connect (fix applied: accept AFTER handling old connection)

### Error: Player ID Not Found in game_start
```
game_start message missing player identification
```

**Cause**: `game_start` message doesn't include `your_id`, `players`, or `player_ids`
**Solution**: Backend MUST include at least one of these fields (now enforced)

## Testing Checklist

- [ ] User 1 logs in → lobby WebSocket connects → STAYS OPEN (no immediate disconnect)
- [ ] User 1 clicks JOIN_QUEUE → message sent successfully (ws.readyState === OPEN)
- [ ] User 1 sees queue updated in lobby (queue.length = 1)
- [ ] User 2 logs in → User 1 sees "User joined" notification
- [ ] User 2 clicks JOIN_QUEUE → game created in MongoDB
- [ ] Both users receive game_start with correct player_ids
- [ ] Both users navigate to `/game/{id}`
- [ ] Game WebSocket connects for both users
- [ ] Both see initial board state
- [ ] User 1 makes move → User 2 sees it
- [ ] User 2 makes move → User 1 sees it
- [ ] Victory detection works (5 in a row)

## Related Files

- `backend/routers/websocket_games.py` - Lobby and game endpoints
- `backend/game_manager.py` - Connection and queue management
- `frontend/src/pages/Lobby.tsx` - Lobby UI and WebSocket handling
- `frontend/src/hooks/useGameWebSocket.ts` - Per-game WebSocket hook
- `backend/models/game.py` - Game data model

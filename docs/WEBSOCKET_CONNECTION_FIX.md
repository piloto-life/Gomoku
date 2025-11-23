# WebSocket Connection Order Fix

## Problem Summary

**Symptom**: When users tried to join the lobby, the WebSocket would connect for ~10ms then immediately disconnect. This prevented any `join_queue` messages from being sent, causing game creation to fail completely.

**Browser Logs**:
```
[WEBSOCKET] Connected to lobby WebSocket
[WEBSOCKET] Disconnected from lobby WebSocket (no code shown)
```

**Backend Logs**:
```
User authenticated: luan (69015c62f3c4f0ec05ba8363)
User luan already connected, closing old connection
DEBUG: > TEXT '{"type": "session_replaced", "reason": "New connection established"}'
DEBUG: = connection is CLOSING
DEBUG: > CLOSE 4000 (private use) New connection established
User luan disconnected from lobby
```

## Root Cause Analysis

The bug was in `backend/routers/websocket_games.py`, line 306-365, in the `websocket_lobby_token_endpoint` function.

### Buggy Code Flow:
```python
# Step 1: ACCEPT THE CONNECTION FIRST
await websocket.accept()
print("Lobby WebSocket connection accepted!")

# Step 2: Extract token from query string
query_string = websocket.url.query
# ... token extraction ...

# Step 3: Authenticate user
user = await get_user_from_token(token)

# Step 4: Check for old connection and close it
if user.id in game_manager.user_connections:
    old_ws = game_manager.user_connections[user.id]
    # Send session_replaced to what we think is the old connection
    # But this is now the NEW connection because we accepted it in Step 1!
    await old_ws.send_text(json.dumps({"type": "session_replaced", ...}))
    await old_ws.close(code=4000, reason="New connection established")
```

### The Critical Issue:

When a user reconnects:
1. Browser sends a NEW WebSocket connection to `/ws/lobby?token=...`
2. Backend accepts the NEW connection immediately (line 308)
3. Backend extracts the token and authenticates the user
4. Backend finds the user already has an old connection (`user_connections[user.id]`)
5. Backend tries to close the old connection... **but `user_connections[user.id]` now points to the NEW connection we just accepted!**
6. Backend sends `session_replaced` + close code 4000 to the NEW connection
7. The NEW connection closes immediately with code 4000
8. Frontend receives code 4000 (server-driven replacement) and refuses to auto-reconnect
9. Result: WebSocket is closed, user cannot send `join_queue` messages

## Solution

**Reorder the operations** to handle the old connection BEFORE accepting the new one:

```python
@router.websocket("/lobby")
async def websocket_lobby_token_endpoint(websocket: WebSocket):
    print("Lobby WebSocket connection attempt")
    
    # Step 1: Extract token from query string BEFORE accepting
    query_string = websocket.url.query
    token = extract_token_from_query(query_string)
    
    # Step 2: Authenticate user BEFORE accepting
    if not token:
        await websocket.close(code=1008, reason="Authentication token required")
        return
    
    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=1008, reason="Invalid authentication token")
        return
    
    # Step 3: Handle old connection BEFORE accepting new one
    if user.id in game_manager.user_connections:
        old_ws = game_manager.user_connections[user.id]
        # Send session_replaced to the OLD connection
        await old_ws.send_text(json.dumps({"type": "session_replaced", ...}))
        await old_ws.close(code=4000, reason="New connection established")
        # Remove from active connections but KEEP in online_players
        game_manager.active_connections.remove(old_ws)
    
    # Step 4: NOW accept the new connection (clean state)
    await websocket.accept()
    print("Lobby WebSocket connection accepted!")
    
    # Step 5: Register the new connection
    await game_manager.connect_to_lobby(websocket, user.id, user.dict())
```

## Key Changes

1. **Token extraction** moved before `await websocket.accept()`
2. **User authentication** moved before `await websocket.accept()`
3. **Old connection handling** moved before `await websocket.accept()`
4. **New connection acceptance** moved AFTER all old connection cleanup
5. **Critical invariant**: `user_connections[user.id]` always points to the current active connection

## Why This Matters

### WebSocket State Machine

```
Browser                         Backend
  |                               |
  |-------- NEW WS ------->       |
  |                          [websocket object created]
  |                          [NOT YET ACCEPTED by app]
  |                               |
  |                          [app calls websocket.accept()]
  |                          [now state = OPEN]
  |<-------- Upgrade --------     |
  |                               |
  | If OLD conn exists:
  |                          [send session_replaced to OLD]
  |                          [close OLD with code 4000]
  |<-- session_replaced --        |
  |<-- CLOSE 4000 -----------     | (closes OLD)
  | (OLD conn dies)               |
  |                               |
  | NEW conn receives:            |
  |<-- connection_established--   |
  |                               |
```

**Before fix**: Old connection logic ran AFTER new connection was accepted, so the new connection got the close code.

**After fix**: Old connection logic runs BEFORE new connection is accepted, so old connection gets properly closed.

## Impact

- ✅ WebSocket connections now stay open after connecting to lobby
- ✅ Users can send `join_queue` messages
- ✅ Game creation flow completes end-to-end
- ✅ No more "connection established then immediately closed" pattern
- ✅ Smooth reconnection experience for users

## Testing

**Before Fix**:
- User logs in → WebSocket connects → immediately disconnects (~10ms)
- Browser shows: "JOIN_QUEUE_CLICKED" but no "WEBSOCKET message SEND" 
- `ws.current?.readyState` is NOT `WebSocket.OPEN`

**After Fix**:
- User logs in → WebSocket connects → STAYS OPEN
- User clicks JOIN_QUEUE → message sent successfully
- Other player joins → both receive `game_start` message
- Navigate to game page → board loads, game proceeds

## Files Modified

- `backend/routers/websocket_games.py` - Lines 306-371 (websocket_lobby_token_endpoint)

## Commits

- Message 13: "Fix WebSocket connection order - accept after handling old connection"
- Tests: 55 passed, 22 warnings (no regressions)

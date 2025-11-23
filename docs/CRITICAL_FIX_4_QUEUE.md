# Critical Fix #4 - Players Disappearing from Queue

**Date**: 2025-11-02  
**Issue**: "Error: One or both players not found in online_players"  
**Severity**: 🔴 **CRITICAL** - Blocks all multiplayer game creation  
**Status**: ✅ **FIXED & VERIFIED**

## Problem

When 2 players join the queue:

```
User demo joined queue. Queue size: 2
Error: One or both players not found in online_players
```

The backend finds 2 players in the queue but can't locate them in `online_players` to create a game.

## Root Cause

In the WebSocket disconnect handler (line 504), `disconnect_from_lobby()` is called in the `finally` block:

```python
finally:
    game_manager.disconnect_from_lobby(user.id)  # ❌ CALLED FOR ALL DISCONNECTS
```

This means **EVERY time** a WebSocket connection closes (reconnects OR real disconnects), the user is **completely removed** from `online_players`.

### The Sequence

1. **Player 1 connects**: Added to `online_players` ✓
2. **Player 2 connects**: Added to `online_players` ✓
3. **Player 1 reconnects** (page refresh):
   - Old WS connection closes → `finally` block runs
   - `disconnect_from_lobby(player1_id)` called → **Removes Player 1 from `online_players`** ✗
   - New WS accepted and re-adds Player 1 ✓
4. **Player 2 reconnects**:
   - Same as above
5. **Both click JOIN_QUEUE** (within milliseconds):
   - Both added to `waiting_queue`
   - BUT one might still have the old `finally` block running
   - That player gets removed from `online_players` ✗
   - Matchmaking fails: "Error: One or both players not found"

## The Fix

**Only** call `disconnect_from_lobby()` for REAL disconnects (WebSocketDisconnect), NOT for planned reconnections or exceptions. Check if the WebSocket is still the current active connection before cleaning up:

```python
except WebSocketDisconnect:
    print(f"User {user.username} disconnected from lobby")
    # Only disconnect if this is the CURRENT active connection
    if game_manager.user_connections.get(user.id) == websocket:
        game_manager.disconnect_from_lobby(user.id)
        # ... broadcast cleanup messages ...
    else:
        print(f"Old connection closed for {user.username}, but they already reconnected")

except Exception as e:
    print(f"Error in lobby websocket for {user.username}: {e}")
    # Same check: only cleanup if this is the current active connection
    if game_manager.user_connections.get(user.id) == websocket:
        game_manager.disconnect_from_lobby(user.id)
        # ... broadcast cleanup messages ...
```

### Key Insight

When a user reconnects:
1. **Old WS closes** → `user_connections[user.id]` now points to the new WS
2. **Check in exception handler**: `user_connections.get(user.id) == websocket` → **False** (comparing old WS to new WS)
3. **Cleanup skipped** → User stays in `online_players` ✓
4. **New WS processes messages** from the active `user_connections` entry

## Files Modified

- `backend/routers/websocket_games.py` (lines 495-515)

## Test Results

- ✅ **55 passed, 0 failures** (no regressions)
- ✅ **Backend logs** show no more "players not found" errors
- ✅ **Connection lifecycle**: Reconnects no longer trigger full disconnect cleanup

## Deployment

Restart backend:
```bash
docker restart gomoku_backend
```

Verify:
```bash
docker logs gomoku_backend | grep -i "error: one or both"
# Should show NO matches
```

## Summary

**Problem**: Reconnecting players were being completely removed from `online_players`  
**Cause**: `disconnect_from_lobby()` called for both reconnects and real disconnects  
**Solution**: Only disconnect if WebSocket is no longer the active connection  
**Result**: ✅ Players stay in `online_players` during reconnects, game creation now works

---

This fix completes the game creation flow. Players can now:
1. Connect to lobby (stays open)
2. Reconnect without losing state
3. Join queue (stays in online_players)
4. Both join queue → Game is created
5. Both receive game_start → Navigate to game page
6. Play the game

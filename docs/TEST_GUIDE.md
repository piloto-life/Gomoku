# Quick Start Guide - Testing Game Creation

## Prerequisites

1. **Services Running**
   ```bash
   docker compose ps
   # Should show: gomoku_backend (Up), gomoku_frontend (Up), gomoku_mongodb (Up)
   ```

2. **No Services Running?**
   ```bash
   docker compose up -d
   # Wait 10 seconds for services to start
   ```

## Test Scenario: Two Player Game Creation

### Step 1: Open Two Browser Windows

**Browser 1**:
- Open: http://localhost:9001
- Should see login page

**Browser 2**:
- Open: http://localhost:9001
- Should see login page

### Step 2: Login as Different Users

**Browser 1**:
- Username: `player1`
- Password: `password123` (or use test credentials)
- Click "Login"
- Should see "Lobby" page with list of online players

**Browser 2**:
- Username: `player2` (or any different username)
- Password: `password123`
- Click "Login"
- Should see "Lobby" page
- Should see `player1` in the list of online players

### Step 3: Check WebSocket Connection

**Open Developer Console** (F12) in both browsers:

**Browser 1 Console**:
- Should see: `[WEBSOCKET] Connected to lobby WebSocket`
- Should NOT see: `[WEBSOCKET] Disconnected from lobby WebSocket` (immediately after)
- **Key**: The connection should STAY OPEN

**Browser 2 Console**:
- Same as Browser 1

### Step 4: Join Queue

**Browser 1**:
- Click "JOIN QUEUE" button
- Watch console - should see: `[WEBSOCKET] Sending message: join_queue`
- Verify connection is still open (no disconnect log)

**Browser 2**:
- Click "JOIN QUEUE" button
- Watch console - should see: `[WEBSOCKET] Sending message: join_queue`

**Key observation**: Both browsers should send the message successfully

### Step 5: Verify Game Creation

**Expected Behavior**:
- After Step 4, within ~2 seconds:
  - Both browsers receive: `game_start` message
  - Console shows: `[GAME] Received game_start: {game_id, your_id, players}`
  - Both browsers automatically navigate to `/game/{game_id}`
  - Game board page loads with 19x19 grid

**What to verify**:
- ✅ Both players see the same game board
- ✅ Board is empty (no pieces yet)
- ✅ One player is "Black", one is "White"
- ✅ Current turn indicator shows who moves first (should be Black)

### Step 6: Make Moves

**Black Player (Player 1)**:
- Click on center square (approximately 9,9)
- Should see a black piece placed
- Should see: `[GAME] Move sent: x=9, y=9`

**White Player (Player 2)**:
- Should automatically see the black piece appear on their board
- Current turn should change to "White"
- Click on a different square
- Should see white piece appear on their board

**Browser 1 (Black)**:
- Should see the white piece appear
- Current turn changes back to "Black"

### Step 7: Verify Victory Detection

**Play until someone gets 5 in a row**:
- Make strategic moves to create a winning pattern
- When 5 in a row is achieved:
  - Should see victory message
  - Board should lock (no more moves allowed)
  - Should see "Return to Lobby" or "New Game" button

## Troubleshooting

### Issue: "Connection Disconnects Immediately After Connecting"

**Symptom**:
```
[WEBSOCKET] Connected to lobby WebSocket
[WEBSOCKET] Disconnected from lobby WebSocket
```

**Solution**:
- Backend fix was not applied or services not restarted
- Check: `docker compose logs gomoku_backend | tail -20`
- Should see: `Lobby WebSocket connection attempt` followed by `connection open` (NOT `connection is CLOSING`)
- If still closing: restart backend
  ```bash
  docker restart gomoku_backend
  ```

### Issue: "JOIN_QUEUE Button Does Nothing"

**Symptom**:
- Click JOIN_QUEUE
- No console message appears
- Nothing happens

**Cause**: WebSocket not open (see above issue)

**Fix**: Check WebSocket connection (Step 3)

### Issue: "Players Not Found for Matchmaking"

**Symptom**:
- Console shows error: `"One or both players not found in online_players"`

**Cause**: 
- Player disconnected from lobby
- Connection replacement removed them from online_players

**Fix**: 
- Have players reconnect to lobby
- Restart backend
- Check logs for disconnections

### Issue: "Game Page Loads But No Board Appears"

**Symptom**:
- Navigate to `/game/{game_id}`
- Page loads but board is empty/not visible
- Console shows errors

**Causes & Fixes**:
1. **Game WebSocket not connecting**:
   - Check console for WebSocket errors
   - Verify `ws://localhost:9000/ws/game/{game_id}?token=...` works
   
2. **Invalid game_id**:
   - Verify game document exists in MongoDB
   - Check: `db.games.findOne({_id: ObjectId("...game_id...")})`

3. **Frontend code issue**:
   - Check `frontend/src/pages/Game.tsx` for errors
   - Open network tab to see if board data is fetched

### Issue: "Can't Make Moves on Board"

**Symptom**:
- Click on board squares but nothing happens
- No move messages sent

**Cause**: 
- Not current player's turn
- Board is locked (game ended)
- WebSocket not open

**Fix**: 
- Check console for turn indicator
- Verify it's your turn (colors: you should be either Black or White)
- If game ended, check victory message

## Detailed Verification Checklist

```
PHASE 1: LOGIN & LOBBY
☐ Browser 1 login successful
☐ Browser 2 login successful
☐ Browser 1 sees Browser 2 in online players list
☐ Browser 2 sees Browser 1 in online players list
☐ Browser 1 console shows: [WEBSOCKET] Connected...
☐ Browser 1 console does NOT show: ...Disconnected (immediately)
☐ Browser 1 connection stays open for 30+ seconds
☐ Browser 2 connection stays open for 30+ seconds

PHASE 2: QUEUE & MATCHMAKING
☐ Browser 1 clicks JOIN_QUEUE
☐ Browser 1 console shows: message sent successfully
☐ Browser 1 sees queue updated in lobby (your name in queue)
☐ Browser 2 clicks JOIN_QUEUE
☐ Browser 2 console shows: message sent successfully
☐ Within 2 seconds, Browser 1 receives: game_start message
☐ Within 2 seconds, Browser 2 receives: game_start message
☐ Both browsers have same game_id
☐ Both receive different your_id values
☐ Players array includes both players with correct colors

PHASE 3: GAME BOARD
☐ Both browsers navigate to /game/{game_id} automatically
☐ Both see 19x19 empty board
☐ Browser 1 assigned color "black"
☐ Browser 2 assigned color "white"
☐ Turn indicator shows "Black to move"
☐ Browser 2 board is locked (can't click)
☐ Browser 1 can click on squares

PHASE 4: GAMEPLAY
☐ Browser 1 (Black) makes move at position (5,5)
☐ Browser 1 console shows: move_received, board_update
☐ Black piece appears on Browser 1 board
☐ Turn indicator changes to "White to move"
☐ Browser 2 automatically receives update
☐ Black piece appears on Browser 2 board
☐ Browser 2 board unlocks, Browser 1 board locks
☐ Browser 2 (White) makes move at position (6,6)
☐ White piece appears on Browser 2 board
☐ Browser 1 sees white piece appear automatically
☐ Turn changes back to "Black"

PHASE 5: VICTORY
☐ Play until 5 in a row achieved
☐ Winner board shows victory message
☐ Winner board locks (no more moves)
☐ Loser board shows losing message
☐ Both players see "Return to Lobby" button
☐ Both can navigate back to lobby
☐ Lobby shows updated player list
☐ Can play new game with same or different players
```

## Backend Monitoring

**Watch backend logs during test**:
```bash
docker logs -f gomoku_backend
```

**Expected log sequence**:
```
Lobby WebSocket connection attempt
User authenticated: player1 (...)
INFO: connection open
DEBUG: > TEXT '{"type": "connection_established"...
DEBUG: > TEXT '{"type": "player_joined"...
[repeats for player 2]
Received message from player1: join_queue
Received message from player2: join_queue
User player1 joined queue. Queue size: 2
[Game created in MongoDB]
[game_start sent to both players]
```

## Success Criteria

✅ **Game creation is FIXED if**:
1. WebSocket connections stay open (no immediate disconnect)
2. `join_queue` messages send successfully
3. When 2 players join queue, game is created
4. Both players receive `game_start` message
5. Both navigate to game page automatically
6. Board loads with correct initial state
7. Players can alternate making moves
8. Victory detection works

## Questions/Issues?

1. Check backend logs: `docker logs gomoku_backend`
2. Check frontend console (F12 in browser)
3. Check browser network tab for WebSocket frames
4. Review: WEBSOCKET_CONNECTION_FIX.md for technical details
5. Review: GAME_CREATION_FLOW.md for complete flow documentation


Goal 2 — Include user's games in `GET /api/auth/me`

What to change (precise edits)
- `backend/models/user.py`
  - Add a new `UserWithGames` Pydantic model (or extend `UserPublic`) that includes `games: List[GamePublic]` (where `GamePublic` mirrors the sanitized game representation).
- `backend/routers/auth.py`
  - Modify the `GET /me` route to accept optional query param `games_limit: int = 10` (cap to 50).
  - Use the current user's id (from JWT) and query the `games` collection using the query:
    - `{"$or": [{"players.black.id": ObjectId(user_id)}, {"players.white.id": ObjectId(user_id)}]}`
    (or if `players.*.id` stores string user ids, match on string — inspect DB shape and convert accordingly).
  - Fetch `raw_games = await games_collection.find(query).sort('updated_at', -1).limit(games_limit).to_list(length=games_limit)`.
  - Serialize games with `to_jsonable(raw_game)` (converts `_id`->`id`, ObjectId->str, datetime->ISO). Ensure `/backend/utils/serialize.py` is imported and used.
  - Append sanitized `games` to the returned user dict and return `UserWithGames`.

Pagination/limit
- Default: `games_limit = 10`; max: 50.

Tests
- Add an integration test: create user, insert 12 games containing that user's id, call `/api/auth/me?games_limit=10`, assert response includes `games` with length==10 sorted by `updated_at` desc and that each game has `id` as string (no `_id`).

Goal 3 — Quick-Play loop (frontend)

Files to inspect and likely root cause
- `frontend/src/pages/Home.tsx`: quick-play handler that calls `createGame` and navigates.
- `frontend/src/contexts/GameContext.tsx`: `createGame` implementation used across UI.
- `frontend/src/services/api.ts`: `gamesAPI.createGame` (if used directly).
- `frontend/src/pages/Game.tsx`: ensure loading a non-existent local game does not trigger creation.

Likely causes
- No in-flight guard: clicking multiple times causes multiple POSTs to create games.
- Navigation triggers remounts and effects that re-run `createGame` (if effect lacks dependency guard).
- React StrictMode in dev doubles mounts which can expose re-entrancy bugs.

Recommended fixes (safe, minimal)
- `frontend/src/pages/Home.tsx`: add `const [isCreatingGame, setIsCreatingGame] = useState(false)`; at handler start `if (isCreatingGame) return; setIsCreatingGame(true);` and in `finally` set false. Disable button while `isCreatingGame`.
- Use `navigate('/game/'+id)` (React Router) instead of `window.location` to avoid hard reloads.
- Optionally add a `creatingRef` guard inside `GameContext.createGame` to prevent duplicate creations from multiple UI entry points.
- Ensure `useEffect` handlers that may call `createGame` have correct dependency arrays.

Reproduction & verification
- Before fix: open devtools Network tab, click Quick Play repeatedly, observe multiple POST `/api/games/create` calls.
- After fix: click once; only one POST should be emitted and the button disabled until completion.

Commands to run locally (dev)
```powershell
cd C:\Users\Luan\Gomoku
# Start backend (from backend folder if required by app import paths)
cd backend
# Example; adapt if you run via uvicorn: python -m uvicorn app:app --reload --port 8000
python -m uvicorn app:app --reload --port 8000
# In another terminal: start frontend
cd ..\frontend
npm install
npm start
```

API verification examples (replace host/port as needed)
```powershell
# Register with CEP
curl -X POST "http://localhost:8000/api/auth/register" -H "Content-Type: application/json" -d '{"username":"cepuser","email":"cep@example.com","password":"secret123","name":"CEP Test","age":30,"city":"","state":"","country":"","cep":"01001-000"}'

# Get current user with games (after login + token)
curl -H "Authorization: Bearer <TOKEN>" "http://localhost:8000/api/auth/me?games_limit=10"
```

Estimates
- CEP integration (frontend + small backend): Medium — 3 to 6 hours.
- `/api/auth/me` games augmentation: Low to Medium — 1 to 3 hours.
- Quick-play guard: Low — 1 to 2 hours.

Risks & backward compatibility
- `cep` is optional — safe for existing users. If you add strict server-side validation, malformed input may be rejected; sanitize inputs instead.
- Adding `games` to `/api/auth/me` changes response shape (but extends it non-destructively). If some clients expect exact fields, adapt them accordingly.
- React StrictMode may double-invoke mounts in development; guards must handle re-entrancy.

Next steps
- Tell me which option you want: implement now, show patches, only backend, or only frontend. I can start implementing the chosen option and will create focused patches and run smoke tests.


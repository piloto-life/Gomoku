Plan: CEP, /me Games, Quick-Play Fix

TL;DR — I scanned the repo and prepared a concise, actionable plan for three tasks: add CEP lookup to registration (frontend + backend), include recent user games in `GET /api/auth/me`, and prevent the quick-play request loop on the Home page. Below are the exact files and edits to make, the recommended CEP API, verification commands, time estimates, and risks.

Steps
1. Add CEP input + ViaCEP lookup in `frontend/src/pages/Register.tsx` and a small `frontend/src/services/cep.ts` helper; send `cep` in register payload (`frontend/src/services/api.ts`) and types.
2. Persist `cep` in `backend` by adding `cep` to `Location` in `backend/models/user.py`, accept it in `RegisterRequest` in `backend/routers/auth.py`, sanitize and store it.
3. Modify `GET /api/auth/me` in `backend/routers/auth.py` to include user's recent games (default 10, max 50) using the games query used elsewhere (`$or` on `players.black.id` / `players.white.id`), serialize with `backend/utils/serialize.to_jsonable`, and return a `UserWithGames` model in `backend/models/user.py`.
4. Fix quick-play loop by adding an in-flight guard in `frontend/src/pages/Home.tsx` (`isCreatingGame`) and optionally in `GameContext.createGame` (a `creatingRef` guard). Disable the button while creating and use SPA navigation (`navigate(...)`) for consistent behavior.
5. Add tests: register CEP + sanity, `GET /api/auth/me` returns `games` limited and serialized, quick-play reproductions.

Further Considerations
1. Option: centralize CEP normalization on backend too (recommended; strip non-digits).
2. Option: return Cursor/ pagination for games in `/me` if frontend needs more history later.
3. If duplicates are business-critical, add server-side idempotency for game creation.

If you want, I can implement these changes now (backend + frontend patches, tests, and run smoke checks). Which option do you prefer?
- "Implement now" — I will create the edits and run verification.
- "Show patches" — I will produce the exact patch diffs for you to apply locally.
- "Only backend" or "Only frontend" — implement just that portion first.

---

Detailed Research Summary (for refinement)

Summary (repo scan — relevant files & symbols)
- Backend
  - `backend/routers/auth.py`: registration, login, JWT dependency, `GET /api/auth/me`.
  - `backend/routers/users.py`: (may contain user-related endpoints, check for user games endpoints).
  - `backend/routers/games.py`: create/get/save game endpoints; contains game query patterns.
  - `backend/models/user.py`: Pydantic models: `Location`, `UserProfile`, `UserCreate`, `UserInDB`, `UserPublic`, etc.
  - `backend/models/game.py`: Pydantic models for games.
  - `backend/utils/serialize.py`: helper converting ObjectId/datetime/_id -> id (recursive).
  - `backend/database.py`: DB connect logic.
- Frontend
  - `frontend/src/pages/Register.tsx`: registration form (fields: name, username, email, password, confirmPassword, age, city, state, country).
  - `frontend/src/pages/Home.tsx`: quick-play handler (creates game and navigates to it).
  - `frontend/src/pages/Game.tsx`: loads game by id (calls gamesAPI.getGame for non-local games).
  - `frontend/src/pages/Lobby.tsx`: contains Lobby WebSocket logic and `game_start` navigation handling.
  - `frontend/src/services/api.ts`: Axios wrapper and API functions (login/register/getCurrentUser, createGame, getGame, saveGame...).
  - `frontend/src/types/index.ts`: TypeScript types for User, Location, Game, etc.
  - `frontend/src/contexts/GameContext.tsx`: `createGame` usage across UI.
  - `frontend/src/contexts/AuthContext.tsx`: current user handling.
- Tests & infra
  - `tests/` contains Python tests for backend endpoints.
  - `docker-compose.yml` for local dev services (MongoDB, backend, frontend).

Notes from scan
- The backend already uses `to_jsonable` (or similar) in some routers to serialize games. Reuse this utility for consistency.
- There may already be an endpoint that queries games by player id — reuse the same query pattern when implementing `/api/auth/me` augmentation.
- Frontend register flow currently builds a top-level register body without `cep`.

Goal 1 — CEP Integration (Frontend + Backend)

What to change (precise edits)
- `frontend/src/pages/Register.tsx`
  - Add `cep` to form state and UI: new input field `cep` (preferably above city/state inputs).
  - Add `isCepLoading` and `cepError` UI state.
  - Add `handleCepLookup` handler that calls a new `lookupCep` service; normalize CEP (strip non-digits), validate length (8), call ViaCEP, and on success fill `city`, `state`, `country` (`Brasil`) and `cep` in form state.
  - Disable submit button while `isCepLoading` or while form invalid.
- `frontend/src/services/cep.ts` (new)
  - Export `async function lookupCep(cep: string)` that fetches `https://viacep.com.br/ws/{cep}/json/`, handles `erro` field, normalizes and returns `{ cep, city, state, country }`.
- `frontend/src/services/api.ts`
  - Extend the register request shape to include `cep` (optional). Ensure the register payload includes `cep` as part of `location` or as top-level `cep` depending on current mapping convention (recommend sending `cep` as top-level field to match `RegisterRequest`).
- `frontend/src/types/index.ts`
  - Add `cep?: string` to `Location` and related types.
- `backend/models/user.py`
  - Update `Location` model to include `cep: Optional[str] = ""` (or `None`). This allows storing CEP in user documents.
- `backend/routers/auth.py`
  - Update `RegisterRequest` Pydantic model to accept `cep?: str` (optional).
  - In `/register`, sanitize `cep` (strip non-digits) and set `location.cep` accordingly before creating `UserInDB`.

CEP API & error handling
- Provider: ViaCEP — `https://viacep.com.br/ws/{cep}/json/` (public, no auth required).
- Client: normalize CEP to digits-only; require length==8; if ViaCEP returns `{ "erro": true }` show 'CEP não encontrado' and allow manual city/state input.
- Backend: sanitize CEP again server-side (strip non-digits) and store as optional field in `profile.location.cep`.

Backward compatibility
- `cep` is optional; older user documents without cep remain valid.

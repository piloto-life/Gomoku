from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import os
import json

from database import connect_to_mongo, close_mongo_connection
from routers import auth, users, websocket_games, lobby
from routers.games import router as games_router
from models.database import database

load_dotenv()

# Lifespan manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

# Create FastAPI app
app = FastAPI(
    title="Gomoku API",
    description="API para o jogo Gomoku - Projeto Web UFSC",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
# Read allowed origins from environment variable. Accept JSON array or comma-separated string.
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    try:
        ALLOWED_ORIGINS = json.loads(cors_origins_env)
        if isinstance(ALLOWED_ORIGINS, str):
            ALLOWED_ORIGINS = [ALLOWED_ORIGINS]
    except json.JSONDecodeError:
        ALLOWED_ORIGINS = [o.strip() for o in cors_origins_env.split(',') if o.strip()]
else:
    ALLOWED_ORIGINS = [
        "http://localhost:9001",
        "http://127.0.0.1:9001",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(games_router, prefix="/api/games", tags=["games"])
app.include_router(websocket_games.router, prefix="/ws", tags=["websocket-games"])
app.include_router(lobby.router, prefix="/api/lobby", tags=["lobby"])

@app.get("/")
async def root():
    return {
        "message": "Gomoku API - UFSC",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected" if database.client else "disconnected"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

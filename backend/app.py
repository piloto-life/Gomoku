from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import os
import json
import logging
import asyncio
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from database import connect_to_mongo, close_mongo_connection
from routers import auth, users, websocket_games, lobby, recordings, webrtc, ranking, admin, chat
from routers.games import router as games_router
from models.database import database
from services.cleanup_service import cleanup_service

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("gomoku_api")

# Lifespan manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting Gomoku API...")
    await connect_to_mongo()
    logger.info("🔄 Starting cleanup service...")
    asyncio.create_task(cleanup_service.start())
    logger.info("✅ Server ready!")
    yield
    # Shutdown
    logger.info("🛑 Shutting down...")
    cleanup_service.stop()
    await close_mongo_connection()
    logger.info("👋 Goodbye!")

# Create FastAPI app
app = FastAPI(
    title="Gomoku API",
    description="API para o jogo Gomoku - Projeto Web UFSC",
    version="1.0.0",
    lifespan=lifespan
)


# Logging Middleware
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_host = request.client.host if request.client else "unknown"
        logger.info(f"📥 {request.method} {request.url.path} from {client_host}")
        
        if request.url.query:
            logger.debug(f"   Query: {request.url.query}")
        
        try:
            response = await call_next(request)
            status_emoji = "✅" if response.status_code < 400 else "❌"
            logger.info(f"{status_emoji} {request.method} {request.url.path} → {response.status_code}")
            return response
        except Exception as e:
            logger.error(f"💥 {request.method} {request.url.path} failed: {str(e)}", exc_info=True)
            raise

app.add_middleware(LoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
        "https://web.luan.costa.vms.ufsc.br",  # <--- O IMPORTANTE (HTTPS)
        "wss://web.luan.costa.vms.ufsc.br"     # <--- Por garantia
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
logger.info("🔧 Registering API routers...")
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(games_router, prefix="/api/games", tags=["games"])
app.include_router(websocket_games.router, prefix="/ws", tags=["websocket-games"])
app.include_router(lobby.router, prefix="/api/lobby", tags=["lobby"])
app.include_router(recordings.router, prefix="/api", tags=["recordings"])
app.include_router(webrtc.router, prefix="/api", tags=["webrtc"])
app.include_router(ranking.router, prefix="/api", tags=["ranking"])
app.include_router(admin.router, prefix="/api", tags=["admin"])
app.include_router(chat.router)
logger.info("✅ All routers registered successfully")

@app.get("/")
async def root():
    return {
        "message": "Gomoku API - UFSC",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    db_status = "connected" if database.client else "disconnected"
    logger.debug(f"Health check: DB {db_status}")
    return {
        "status": "healthy",
        "database": db_status
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

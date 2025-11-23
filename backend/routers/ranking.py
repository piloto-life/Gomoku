"""
Rotas de Ranking e Estatísticas
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
import logging
from datetime import datetime

from bson import ObjectId

from models.user import User
from routers.auth import get_current_user
from services.ranking_service import RankingService
from database import get_database
from utils.serialize import to_jsonable


async def get_ranking_service(db = Depends(get_database)):
    """Dependency provider that constructs a RankingService with the DB."""
    return RankingService(db)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ranking", tags=["ranking"])





@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(default=100, le=1000),
    tier: Optional[str] = Query(default=None),
    min_games: int = Query(default=0, ge=0),
    ranking_service: RankingService = Depends(get_ranking_service)
):
    """
    Obtém ranking (leaderboard)
    
    Args:
        limit: Número de jogadores (máx 1000)
        tier: Filtrar por tier (Bronze, Prata, Ouro, Platina, Diamante, Mestre)
        min_games: Mínimo de partidas para aparecer
    """
    logger.debug(f"Leaderboard params - limit={limit}, tier={tier}, min_games={min_games}")
    try:
        leaderboard = await ranking_service.get_leaderboard(
            limit=limit,
            tier=tier,
            min_games=min_games
        )

        sanitized = [to_jsonable(p) for p in leaderboard]

        return {
            "total": len(sanitized),
            "players": sanitized
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar ranking")


@router.get("/player/{user_id}")
async def get_player_stats(
    user_id: str,
    ranking_service: RankingService = Depends(get_ranking_service)
):
    """Obtém estatísticas de um jogador"""
    stats = await ranking_service.get_player_stats(user_id)

    if not stats:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")

    # Ensure returned document is JSON-serializable
    return to_jsonable(stats)


@router.get("/me")
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    ranking_service: RankingService = Depends(get_ranking_service)
):
    """Obtém estatísticas do usuário atual"""
    stats = await ranking_service.get_player_stats(str(current_user.id))
    
    if not stats:
        # Criar estatísticas se não existir
        stats = await ranking_service.get_or_create_stats(
            user_id=str(current_user.id),
            username=current_user.username
        )
        return stats.dict()
    
    return to_jsonable(stats)


@router.get("/history")
async def get_match_history(
    user_id: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=500),
    current_user: User = Depends(get_current_user),
    ranking_service: RankingService = Depends(get_ranking_service)
):
    """
    Obtém histórico de partidas
    
    Args:
        user_id: ID do jogador (opcional, padrão = usuário atual)
        limit: Número de partidas
    """
    if not user_id:
        user_id = str(current_user.id)
    
    try:
        history = await ranking_service.get_match_history(
            user_id=user_id,
            limit=limit
        )

        sanitized = [to_jsonable(h) for h in history]

        return {
            "total": len(sanitized),
            "matches": sanitized
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar histórico: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico")


@router.get("/history/elo/{user_id}")
async def get_elo_history(
    user_id: str,
    days: int = Query(default=30, le=365),
    ranking_service: RankingService = Depends(get_ranking_service)
):
    """
    Obtém histórico de mudanças no ELO
    
    Args:
        user_id: ID do jogador
        days: Número de dias (máx 365)
    """
    try:
        history = await ranking_service.get_player_rank_history(
            user_id=user_id,
            days=days
        )

        sanitized_history = [to_jsonable(item) for item in history]

        return {
            "user_id": user_id,
            "days": days,
            "history": sanitized_history
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar histórico ELO: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico")


@router.get("/stats/global")
async def get_global_stats(ranking_service: RankingService = Depends(get_ranking_service)):
    """Obtém estatísticas globais do jogo"""
    try:
        stats = await ranking_service.get_global_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas globais: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar estatísticas")


@router.get("/tiers")
async def get_rank_tiers():
    """Retorna informações sobre os tiers de ranking"""
    from services.ranking_service import RankingService
    
    return {
        "tiers": [
            {
                "name": name,
                "min_elo": min_elo,
                "max_elo": max_elo
            }
            for name, min_elo, max_elo in RankingService.RANK_TIERS
        ]
    }


@router.get("/search")
async def search_players(
    query: str = Query(min_length=2),
    limit: int = Query(default=20, le=100),
    ranking_service: RankingService = Depends(get_ranking_service)
):
    """Busca jogadores por nome"""
    # TODO: Implementar busca por nome no MongoDB
    # Por enquanto, retornar vazio
    return {"results": []}

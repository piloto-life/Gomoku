"""
Rotas de Ranking e Estatísticas
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
import logging

from models.user import User
from routers.auth import get_current_user
from services.ranking_service import RankingService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ranking", tags=["ranking"])


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(default=100, le=1000),
    tier: Optional[str] = Query(default=None),
    min_games: int = Query(default=10),
    ranking_service: RankingService = Depends()
):
    """
    Obtém ranking (leaderboard)
    
    Args:
        limit: Número de jogadores (máx 1000)
        tier: Filtrar por tier (Bronze, Prata, Ouro, Platina, Diamante, Mestre)
        min_games: Mínimo de partidas para aparecer
    """
    try:
        leaderboard = await ranking_service.get_leaderboard(
            limit=limit,
            tier=tier,
            min_games=min_games
        )
        
        return {
            "total": len(leaderboard),
            "players": leaderboard
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar ranking")


@router.get("/player/{user_id}")
async def get_player_stats(
    user_id: str,
    ranking_service: RankingService = Depends()
):
    """Obtém estatísticas de um jogador"""
    stats = await ranking_service.get_player_stats(user_id)
    
    if not stats:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")
    
    return stats


@router.get("/me")
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    ranking_service: RankingService = Depends()
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
    
    return stats


@router.get("/history")
async def get_match_history(
    user_id: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=500),
    current_user: User = Depends(get_current_user),
    ranking_service: RankingService = Depends()
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
        
        return {
            "total": len(history),
            "matches": history
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar histórico: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico")


@router.get("/history/elo/{user_id}")
async def get_elo_history(
    user_id: str,
    days: int = Query(default=30, le=365),
    ranking_service: RankingService = Depends()
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
        
        return {
            "user_id": user_id,
            "days": days,
            "history": history
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar histórico ELO: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico")


@router.get("/stats/global")
async def get_global_stats(ranking_service: RankingService = Depends()):
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
    ranking_service: RankingService = Depends()
):
    """Busca jogadores por nome"""
    # TODO: Implementar busca por nome no MongoDB
    # Por enquanto, retornar vazio
    return {"results": []}

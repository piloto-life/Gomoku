"""
Sistema de Ranking com cálculo ELO
Modelo de ranking, histórico de partidas, estatísticas
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from pydantic import BaseModel, Field
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class PlayerStats(BaseModel):
    """Estatísticas de um jogador"""
    user_id: str
    username: str
    elo_rating: int = Field(default=1200, description="Rating ELO")
    wins: int = Field(default=0)
    losses: int = Field(default=0)
    draws: int = Field(default=0)
    total_games: int = Field(default=0)
    win_rate: float = Field(default=0.0)
    current_streak: int = Field(default=0, description="Sequência atual (+ vitórias, - derrotas)")
    best_streak: int = Field(default=0, description="Melhor sequência de vitórias")
    total_moves: int = Field(default=0)
    avg_moves_per_game: float = Field(default=0.0)
    fastest_win: Optional[int] = Field(default=None, description="Vitória mais rápida (em jogadas)")
    rank_position: Optional[int] = Field(default=None)
    rank_tier: Optional[str] = Field(default=None, description="Bronze, Prata, Ouro, Platina, Diamante, Mestre")
    last_played: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MatchHistory(BaseModel):
    """Histórico de uma partida"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    game_id: str
    player1_id: str
    player1_username: str
    player1_elo_before: int
    player1_elo_after: int
    player1_elo_change: int
    player2_id: str
    player2_username: str
    player2_elo_before: int
    player2_elo_after: int
    player2_elo_change: int
    winner_id: Optional[str] = None
    result: str  # "win", "loss", "draw"
    game_mode: str  # "pvp_online", "pvp_local", "pve"
    total_moves: int
    duration_seconds: Optional[int] = None
    played_at: datetime = Field(default_factory=datetime.utcnow)


class RankingService:
    """Serviço de ranking e estatísticas"""
    
    # Constantes para cálculo ELO
    K_FACTOR = 32  # Fator K padrão
    K_FACTOR_PROVISIONAL = 40  # Fator K para jogadores novos (<30 partidas)
    
    # Tiers de ranking
    RANK_TIERS = [
        ("Bronze", 0, 1199),
        ("Prata", 1200, 1399),
        ("Ouro", 1400, 1599),
        ("Platina", 1600, 1799),
        ("Diamante", 1800, 1999),
        ("Mestre", 2000, 9999)
    ]
    
    def __init__(self, db):
        self.db = db
    
    async def get_or_create_stats(self, user_id: str, username: str) -> PlayerStats:
        """Obtém ou cria estatísticas do jogador"""
        stats = await self.db.player_stats.find_one({"user_id": user_id})
        
        if not stats:
            # Criar estatísticas iniciais
            new_stats = PlayerStats(
                user_id=user_id,
                username=username
            )
            
            await self.db.player_stats.insert_one(new_stats.dict())
            return new_stats
        
        return PlayerStats(**stats)
    
    def calculate_elo_change(
        self, 
        rating_a: int, 
        rating_b: int, 
        result: float,  # 1.0 = vitória, 0.5 = empate, 0.0 = derrota
        k_factor: int = None
    ) -> int:
        """
        Calcula mudança no rating ELO
        
        Args:
            rating_a: Rating do jogador A
            rating_b: Rating do jogador B
            result: Resultado para jogador A (1.0, 0.5, ou 0.0)
            k_factor: Fator K (sensibilidade da mudança)
        
        Returns:
            Mudança no rating (pode ser negativo)
        """
        if k_factor is None:
            k_factor = self.K_FACTOR
        
        # Probabilidade esperada de vitória
        expected = 1 / (1 + 10 ** ((rating_b - rating_a) / 400))
        
        # Mudança no rating
        change = k_factor * (result - expected)
        
        return round(change)
    
    async def update_after_game(
        self,
        game_id: str,
        player1_id: str,
        player1_username: str,
        player2_id: str,
        player2_username: str,
        winner_id: Optional[str],
        game_mode: str,
        total_moves: int,
        duration_seconds: Optional[int] = None
    ) -> Dict:
        """
        Atualiza rankings após uma partida
        
        Args:
            game_id: ID do jogo
            player1_id: ID do jogador 1
            player1_username: Nome do jogador 1
            player2_id: ID do jogador 2
            player2_username: Nome do jogador 2
            winner_id: ID do vencedor (None para empate)
            game_mode: Modo de jogo
            total_moves: Total de jogadas
            duration_seconds: Duração em segundos
        
        Returns:
            Dict com mudanças de ELO e estatísticas atualizadas
        """
        # Apenas atualizar ranking para partidas online
        if game_mode != "pvp_online":
            logger.info(f"Partida {game_id} não é online, ranking não atualizado")
            return {"updated": False, "reason": "only_online_games"}
        
        # Obter estatísticas atuais
        stats1 = await self.get_or_create_stats(player1_id, player1_username)
        stats2 = await self.get_or_create_stats(player2_id, player2_username)
        
        # ELO antes da partida
        elo1_before = stats1.elo_rating
        elo2_before = stats2.elo_rating
        
        # Determinar resultado
        if winner_id is None:
            # Empate
            result1 = 0.5
            result2 = 0.5
            result_str = "draw"
        elif winner_id == player1_id:
            # Jogador 1 venceu
            result1 = 1.0
            result2 = 0.0
            result_str = "win"
        else:
            # Jogador 2 venceu
            result1 = 0.0
            result2 = 1.0
            result_str = "loss"
        
        # Calcular fator K (maior para jogadores novos)
        k1 = self.K_FACTOR_PROVISIONAL if stats1.total_games < 30 else self.K_FACTOR
        k2 = self.K_FACTOR_PROVISIONAL if stats2.total_games < 30 else self.K_FACTOR
        
        # Calcular mudanças no ELO
        elo1_change = self.calculate_elo_change(elo1_before, elo2_before, result1, k1)
        elo2_change = self.calculate_elo_change(elo2_before, elo1_before, result2, k2)
        
        # Novos ratings
        elo1_after = max(0, elo1_before + elo1_change)
        elo2_after = max(0, elo2_before + elo2_change)
        
        # Atualizar estatísticas jogador 1
        await self._update_player_stats(
            player1_id,
            elo1_after,
            result_str,
            total_moves,
            duration_seconds
        )
        
        # Atualizar estatísticas jogador 2
        result2_str = "win" if result_str == "loss" else ("loss" if result_str == "win" else "draw")
        await self._update_player_stats(
            player2_id,
            elo2_after,
            result2_str,
            total_moves,
            duration_seconds
        )
        
        # Registrar no histórico
        history = MatchHistory(
            game_id=game_id,
            player1_id=player1_id,
            player1_username=player1_username,
            player1_elo_before=elo1_before,
            player1_elo_after=elo1_after,
            player1_elo_change=elo1_change,
            player2_id=player2_id,
            player2_username=player2_username,
            player2_elo_before=elo2_before,
            player2_elo_after=elo2_after,
            player2_elo_change=elo2_change,
            winner_id=winner_id,
            result=result_str,
            game_mode=game_mode,
            total_moves=total_moves,
            duration_seconds=duration_seconds
        )
        
        await self.db.match_history.insert_one(history.dict())
        
        logger.info(
            f"Ranking atualizado - {player1_username}: {elo1_before} -> {elo1_after} ({elo1_change:+d}), "
            f"{player2_username}: {elo2_before} -> {elo2_after} ({elo2_change:+d})"
        )
        
        return {
            "updated": True,
            "player1": {
                "elo_before": elo1_before,
                "elo_after": elo1_after,
                "elo_change": elo1_change
            },
            "player2": {
                "elo_before": elo2_before,
                "elo_after": elo2_after,
                "elo_change": elo2_change
            }
        }
    
    async def _update_player_stats(
        self,
        user_id: str,
        new_elo: int,
        result: str,
        moves: int,
        duration: Optional[int]
    ):
        """Atualiza estatísticas de um jogador"""
        stats = await self.db.player_stats.find_one({"user_id": user_id})
        
        if not stats:
            return
        
        # Calcular novos valores
        total_games = stats["total_games"] + 1
        wins = stats["wins"] + (1 if result == "win" else 0)
        losses = stats["losses"] + (1 if result == "loss" else 0)
        draws = stats["draws"] + (1 if result == "draw" else 0)
        win_rate = wins / total_games if total_games > 0 else 0.0
        
        total_moves = stats["total_moves"] + moves
        avg_moves = total_moves / total_games
        
        # Atualizar sequência
        current_streak = stats.get("current_streak", 0)
        if result == "win":
            current_streak = current_streak + 1 if current_streak >= 0 else 1
        elif result == "loss":
            current_streak = current_streak - 1 if current_streak <= 0 else -1
        else:
            current_streak = 0
        
        best_streak = max(stats.get("best_streak", 0), current_streak)
        
        # Vitória mais rápida
        fastest_win = stats.get("fastest_win")
        if result == "win":
            if fastest_win is None or moves < fastest_win:
                fastest_win = moves
        
        # Determinar tier
        rank_tier = self._get_rank_tier(new_elo)
        
        # Atualizar no banco
        await self.db.player_stats.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "elo_rating": new_elo,
                    "wins": wins,
                    "losses": losses,
                    "draws": draws,
                    "total_games": total_games,
                    "win_rate": round(win_rate, 3),
                    "current_streak": current_streak,
                    "best_streak": best_streak,
                    "total_moves": total_moves,
                    "avg_moves_per_game": round(avg_moves, 1),
                    "fastest_win": fastest_win,
                    "rank_tier": rank_tier,
                    "last_played": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    def _get_rank_tier(self, elo: int) -> str:
        """Determina tier baseado no ELO"""
        for tier_name, min_elo, max_elo in self.RANK_TIERS:
            if min_elo <= elo <= max_elo:
                return tier_name
        return "Bronze"
    
    async def get_leaderboard(
        self,
        limit: int = 100,
        tier: Optional[str] = None,
        min_games: int = 0
    ) -> List[Dict]:
        """
        Obtém ranking (leaderboard)
        
        Args:
            limit: Número máximo de jogadores
            tier: Filtrar por tier específico
            min_games: Mínimo de partidas para aparecer
        
        Returns:
            Lista de jogadores ordenados por ELO
        """
        query = {"total_games": {"$gte": min_games}}
        
        if tier:
            query["rank_tier"] = tier
        
        players = await self.db.player_stats.find(query).sort(
            "elo_rating", -1
        ).limit(limit).to_list(length=limit)
        
        # Adicionar posição no ranking
        for idx, player in enumerate(players, 1):
            player["rank_position"] = idx
            
            # Atualizar no banco
            await self.db.player_stats.update_one(
                {"user_id": player["user_id"]},
                {"$set": {"rank_position": idx}}
            )
        
        return players
    
    async def get_player_stats(self, user_id: str) -> Optional[Dict]:
        """Obtém estatísticas de um jogador"""
        stats = await self.db.player_stats.find_one({"user_id": user_id})
        return stats
    
    async def get_match_history(
        self,
        user_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        Obtém histórico de partidas
        
        Args:
            user_id: Filtrar por jogador específico
            limit: Número máximo de partidas
        
        Returns:
            Lista de partidas ordenadas por data
        """
        query = {}
        
        if user_id:
            query = {
                "$or": [
                    {"player1_id": user_id},
                    {"player2_id": user_id}
                ]
            }
        
        matches = await self.db.match_history.find(query).sort(
            "played_at", -1
        ).limit(limit).to_list(length=limit)
        
        return matches
    
    async def get_player_rank_history(
        self,
        user_id: str,
        days: int = 30
    ) -> List[Dict]:
        """
        Obtém histórico de mudanças no ranking
        
        Args:
            user_id: ID do jogador
            days: Número de dias para buscar
        
        Returns:
            Lista de mudanças de ELO
        """
        since = datetime.utcnow() - timedelta(days=days)
        
        matches = await self.db.match_history.find({
            "$or": [{"player1_id": user_id}, {"player2_id": user_id}],
            "played_at": {"$gte": since}
        }).sort("played_at", 1).to_list(length=1000)
        
        history = []
        for match in matches:
            if match["player1_id"] == user_id:
                history.append({
                    "date": match["played_at"],
                    "elo": match["player1_elo_after"],
                    "change": match["player1_elo_change"],
                    "result": match["result"]
                })
            else:
                result = "win" if match["result"] == "loss" else ("loss" if match["result"] == "win" else "draw")
                history.append({
                    "date": match["played_at"],
                    "elo": match["player2_elo_after"],
                    "change": match["player2_elo_change"],
                    "result": result
                })
        
        return history
    
    async def get_global_stats(self) -> Dict:
        """Obtém estatísticas globais do jogo"""
        total_players = await self.db.player_stats.count_documents({})
        active_players = await self.db.player_stats.count_documents({
            "last_played": {"$gte": datetime.utcnow() - timedelta(days=7)}
        })
        total_games = await self.db.match_history.count_documents({})
        
        # Média de ELO
        pipeline = [
            {"$group": {
                "_id": None,
                "avg_elo": {"$avg": "$elo_rating"},
                "max_elo": {"$max": "$elo_rating"},
                "min_elo": {"$min": "$elo_rating"}
            }}
        ]
        
        agg_result = await self.db.player_stats.aggregate(pipeline).to_list(length=1)
        
        avg_elo = agg_result[0]["avg_elo"] if agg_result else 1200
        max_elo = agg_result[0]["max_elo"] if agg_result else 1200
        min_elo = agg_result[0]["min_elo"] if agg_result else 1200
        
        # Distribuição por tier
        tier_distribution = {}
        for tier_name, _, _ in self.RANK_TIERS:
            count = await self.db.player_stats.count_documents({"rank_tier": tier_name})
            tier_distribution[tier_name] = count
        
        return {
            "total_players": total_players,
            "active_players": active_players,
            "total_games": total_games,
            "avg_elo": round(avg_elo, 1),
            "max_elo": max_elo,
            "min_elo": min_elo,
            "tier_distribution": tier_distribution
        }

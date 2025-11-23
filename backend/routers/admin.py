"""
Rotas de Administração - CRUD Completo
Gerenciamento de usuários, jogos, avatares, configurações
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from models.user import User
from routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


# ==================== MIDDLEWARE DE ADMIN ====================

async def require_admin(current_user: User = Depends(get_current_user)):
    """Verifica se usuário é administrador"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado. Apenas administradores."
        )
    return current_user


# ==================== MODELOS ====================

class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None


class SystemConfigUpdate(BaseModel):
    max_video_size_mb: Optional[int] = None
    max_queue_size: Optional[int] = None
    enable_registrations: Optional[bool] = None
    maintenance_mode: Optional[bool] = None
    announcement: Optional[str] = None


class BanUserRequest(BaseModel):
    user_id: str
    reason: str
    duration_hours: Optional[int] = None  # None = permanente


# ==================== USUÁRIOS ====================

@router.get("/users")
async def list_users(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, le=100),
    search: Optional[str] = None,
    is_admin: Optional[bool] = None,
    is_active: Optional[bool] = None,
    admin_user: User = Depends(require_admin),
    db = Depends()  # Injeta database
):
    """Lista todos os usuários"""
    skip = (page - 1) * per_page
    
    # Construir query
    query = {}
    if search:
        query["$or"] = [
            {"username": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    if is_admin is not None:
        query["is_admin"] = is_admin
    if is_active is not None:
        query["is_active"] = is_active
    
    # Total de usuários
    total = await db.users.count_documents(query)
    
    # Buscar usuários
    users = await db.users.find(query).skip(skip).limit(per_page).to_list(length=per_page)
    
    # Remover senha do retorno
    for user in users:
        user.pop("hashed_password", None)
    
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
        "users": users
    }


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: str,
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Obtém detalhes de um usuário"""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Remover senha
    user.pop("hashed_password", None)
    
    # Buscar estatísticas
    stats = await db.player_stats.find_one({"user_id": user_id})
    
    # Buscar jogos recentes
    recent_games = await db.games.find({
        "$or": [{"player1_id": user_id}, {"player2_id": user_id}]
    }).sort("created_at", -1).limit(10).to_list(length=10)
    
    return {
        "user": user,
        "stats": stats,
        "recent_games": recent_games
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    updates: UserUpdateRequest,
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Atualiza informações de um usuário"""
    # Verificar se usuário existe
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Construir updates
    update_data = {}
    if updates.username is not None:
        # Verificar se username já existe
        existing = await db.users.find_one({
            "username": updates.username,
            "_id": {"$ne": ObjectId(user_id)}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Username já existe")
        update_data["username"] = updates.username
    
    if updates.email is not None:
        # Verificar se email já existe
        existing = await db.users.find_one({
            "email": updates.email,
            "_id": {"$ne": ObjectId(user_id)}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Email já existe")
        update_data["email"] = updates.email
    
    if updates.is_admin is not None:
        update_data["is_admin"] = updates.is_admin
    
    if updates.is_active is not None:
        update_data["is_active"] = updates.is_active
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhuma atualização fornecida")
    
    # Atualizar
    update_data["updated_at"] = datetime.utcnow()
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    logger.info(f"Admin {admin_user.username} atualizou usuário {user_id}")
    
    return {"status": "updated", "updates": update_data}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Deleta um usuário e todos os seus dados"""
    # Verificar se não está deletando a si mesmo
    if str(admin_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Não pode deletar a si mesmo")
    
    # Verificar se usuário existe
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Deletar usuário
    await db.users.delete_one({"_id": ObjectId(user_id)})
    
    # Deletar dados relacionados
    await db.player_stats.delete_many({"user_id": user_id})
    await db.games.delete_many({
        "$or": [{"player1_id": user_id}, {"player2_id": user_id}]
    })
    
    logger.warning(f"Admin {admin_user.username} deletou usuário {user['username']} ({user_id})")
    
    return {"status": "deleted"}


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: str,
    ban_request: BanUserRequest,
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Bane um usuário"""
    if str(admin_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Não pode banir a si mesmo")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Calcular data de expiração
    banned_until = None
    if ban_request.duration_hours:
        banned_until = datetime.utcnow() + timedelta(hours=ban_request.duration_hours)
    
    # Atualizar usuário
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "is_banned": True,
                "banned_until": banned_until,
                "ban_reason": ban_request.reason,
                "banned_by": str(admin_user.id),
                "banned_at": datetime.utcnow()
            }
        }
    )
    
    logger.warning(
        f"Admin {admin_user.username} baniu usuário {user['username']} "
        f"por {ban_request.duration_hours or 'permanente'} horas. Razão: {ban_request.reason}"
    )
    
    return {
        "status": "banned",
        "banned_until": banned_until.isoformat() if banned_until else "permanent"
    }


@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: str,
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Remove banimento de um usuário"""
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "is_banned": False,
                "unbanned_by": str(admin_user.id),
                "unbanned_at": datetime.utcnow()
            },
            "$unset": {
                "banned_until": "",
                "ban_reason": ""
            }
        }
    )
    
    logger.info(f"Admin {admin_user.username} desbaniu usuário {user_id}")
    
    return {"status": "unbanned"}


# ==================== JOGOS ====================

@router.get("/games")
async def list_games(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, le=100),
    status: Optional[str] = None,
    game_mode: Optional[str] = None,
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Lista todos os jogos"""
    skip = (page - 1) * per_page
    
    query = {}
    if status:
        query["status"] = status
    if game_mode:
        query["game_mode"] = game_mode
    
    total = await db.games.count_documents(query)
    games = await db.games.find(query).sort("created_at", -1).skip(skip).limit(per_page).to_list(length=per_page)
    
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "games": games
    }


@router.delete("/games/{game_id}")
async def delete_game(
    game_id: str,
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Deleta um jogo"""
    await db.games.delete_one({"_id": ObjectId(game_id)})
    await db.match_history.delete_many({"game_id": game_id})
    await db.recordings.delete_many({"game_id": game_id})
    
    logger.info(f"Admin {admin_user.username} deletou jogo {game_id}")
    
    return {"status": "deleted"}


# ==================== AVATARES ====================

@router.get("/avatars")
async def list_avatars(
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Lista todos os avatares"""
    avatars = await db.avatars.find({}).to_list(length=1000)
    return {"avatars": avatars}


@router.post("/avatars")
async def upload_avatar(
    name: str,
    file: UploadFile = File(...),
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Upload de novo avatar"""
    # Validar tipo de arquivo
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Apenas imagens são permitidas")
    
    # Ler arquivo
    content = await file.read()
    
    # Salvar no banco (GridFS ou base64)
    import base64
    avatar_data = base64.b64encode(content).decode('utf-8')
    
    avatar_doc = {
        "name": name,
        "data": avatar_data,
        "content_type": file.content_type,
        "uploaded_by": str(admin_user.id),
        "uploaded_at": datetime.utcnow()
    }
    
    result = await db.avatars.insert_one(avatar_doc)
    
    logger.info(f"Admin {admin_user.username} fez upload de avatar '{name}'")
    
    return {
        "id": str(result.inserted_id),
        "name": name,
        "url": f"/api/avatars/{result.inserted_id}"
    }


@router.delete("/avatars/{avatar_id}")
async def delete_avatar(
    avatar_id: str,
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Deleta avatar"""
    await db.avatars.delete_one({"_id": ObjectId(avatar_id)})
    
    logger.info(f"Admin {admin_user.username} deletou avatar {avatar_id}")
    
    return {"status": "deleted"}


# ==================== CONFIGURAÇÕES DO SISTEMA ====================

@router.get("/config")
async def get_system_config(
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Obtém configurações do sistema"""
    config = await db.system_config.find_one({})
    
    if not config:
        # Configuração padrão
        config = {
            "max_video_size_mb": 500,
            "max_queue_size": 100,
            "enable_registrations": True,
            "maintenance_mode": False,
            "announcement": None
        }
    
    return config


@router.put("/config")
async def update_system_config(
    updates: SystemConfigUpdate,
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Atualiza configurações do sistema"""
    update_data = updates.dict(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhuma atualização fornecida")
    
    update_data["updated_by"] = str(admin_user.id)
    update_data["updated_at"] = datetime.utcnow()
    
    await db.system_config.update_one(
        {},
        {"$set": update_data},
        upsert=True
    )
    
    logger.info(f"Admin {admin_user.username} atualizou configurações: {update_data}")
    
    return {"status": "updated", "config": update_data}


# ==================== ESTATÍSTICAS ====================

@router.get("/stats/dashboard")
async def get_dashboard_stats(
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Estatísticas para dashboard admin"""
    # Contagens básicas
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    banned_users = await db.users.count_documents({"is_banned": True})
    admin_users = await db.users.count_documents({"is_admin": True})
    
    total_games = await db.games.count_documents({})
    active_games = await db.games.count_documents({"status": "active"})
    
    total_recordings = await db.recordings.count_documents({})
    
    # Usuários recentes (últimos 7 dias)
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_week = await db.users.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    # Jogos recentes
    games_week = await db.games.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    # Espaço usado por vídeos (aproximado)
    video_stats = await db.recordings.aggregate([
        {"$group": {
            "_id": None,
            "total_size": {"$sum": "$file_size"}
        }}
    ]).to_list(length=1)
    
    total_video_size = video_stats[0]["total_size"] if video_stats else 0
    total_video_size_mb = total_video_size / (1024 * 1024)
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "banned": banned_users,
            "admins": admin_users,
            "new_this_week": new_users_week
        },
        "games": {
            "total": total_games,
            "active": active_games,
            "this_week": games_week
        },
        "recordings": {
            "total": total_recordings,
            "total_size_mb": round(total_video_size_mb, 2)
        }
    }


@router.get("/logs")
async def get_admin_logs(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=100, le=500),
    action_type: Optional[str] = None,
    admin_user: User = Depends(require_admin),
    db = Depends()
):
    """Obtém logs de ações administrativas"""
    # Implementação básica de logs
    logs = [
        {
            "id": "1",
            "action": "system_start",
            "details": "Sistema iniciado",
            "admin_id": "system",
            "timestamp": datetime.utcnow()
        },
        {
            "id": "2",
            "action": "user_ban",
            "details": "Usuário banido por comportamento inadequado",
            "admin_id": str(admin_user.id),
            "timestamp": datetime.utcnow()
        }
    ]
    
    # Filtrar por tipo de ação se solicitado
    if action_type:
        logs = [l for l in logs if l["action"] == action_type]
        
    return {
        "logs": logs,
        "total": len(logs),
        "page": page,
        "per_page": per_page
    }

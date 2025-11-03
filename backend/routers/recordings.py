"""
Rotas para gravação de vídeos com FFMPEG
"""
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
import logging

from models.user import User
from routers.auth import get_current_user
from services.ffmpeg_service import FFMPEGRecordingService, CanvasRecordingService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recordings", tags=["recordings"])


class StartRecordingRequest(BaseModel):
    game_id: str
    width: int = 1920
    height: int = 1080


class UploadChunkRequest(BaseModel):
    upload_id: str
    chunk_index: int
    chunk_data: str  # Base64 encoded


@router.post("/start")
async def start_recording(
    request: StartRecordingRequest,
    current_user: User = Depends(get_current_user),
    recording_service: FFMPEGRecordingService = Depends()
):
    """Inicia gravação de uma partida"""
    try:
        result = await recording_service.start_recording(
            game_id=request.game_id,
            width=request.width,
            height=request.height
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao iniciar gravação: {e}")
        raise HTTPException(status_code=500, detail="Erro ao iniciar gravação")


@router.post("/stop/{game_id}")
async def stop_recording(
    game_id: str,
    current_user: User = Depends(get_current_user),
    recording_service: FFMPEGRecordingService = Depends()
):
    """Para gravação e salva vídeo"""
    try:
        result = await recording_service.stop_recording(game_id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao parar gravação: {e}")
        raise HTTPException(status_code=500, detail="Erro ao parar gravação")


@router.get("/status/{game_id}")
async def get_recording_status(
    game_id: str,
    current_user: User = Depends(get_current_user),
    recording_service: FFMPEGRecordingService = Depends()
):
    """Obtém status da gravação"""
    status = await recording_service.get_recording_status(game_id)
    return status


@router.get("/list")
async def list_recordings(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    recording_service: FFMPEGRecordingService = Depends()
):
    """Lista gravações do usuário"""
    recordings = await recording_service.list_recordings(
        user_id=str(current_user.id),
        limit=limit
    )
    return recordings


@router.get("/video/{video_id}")
async def get_video(
    video_id: str,
    recording_service: FFMPEGRecordingService = Depends()
):
    """Stream de vídeo"""
    try:
        grid_out = await recording_service.get_video_stream(video_id)
        
        async def video_stream():
            while True:
                chunk = await grid_out.read(65536)  # 64KB chunks
                if not chunk:
                    break
                yield chunk
        
        return StreamingResponse(
            video_stream(),
            media_type="video/webm",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(grid_out.length)
            }
        )
        
    except Exception as e:
        logger.error(f"Erro ao buscar vídeo {video_id}: {e}")
        raise HTTPException(status_code=404, detail="Vídeo não encontrado")


@router.delete("/video/{video_id}")
async def delete_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    recording_service: FFMPEGRecordingService = Depends()
):
    """Deleta vídeo"""
    # TODO: Verificar se usuário tem permissão
    
    success = await recording_service.delete_recording(video_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Vídeo não encontrado")
    
    return {"status": "deleted"}


# Rotas para upload de chunks (gravação via browser)

@router.post("/upload/init")
async def init_upload(
    game_id: str,
    current_user: User = Depends(get_current_user),
    canvas_service: CanvasRecordingService = Depends()
):
    """Inicia upload de vídeo gravado no browser"""
    upload_id = await canvas_service.init_upload(game_id)
    return {"upload_id": upload_id}


@router.post("/upload/chunk")
async def upload_chunk(
    request: UploadChunkRequest,
    current_user: User = Depends(get_current_user),
    canvas_service: CanvasRecordingService = Depends()
):
    """Upload de chunk de vídeo"""
    import base64
    
    try:
        chunk_data = base64.b64decode(request.chunk_data)
        
        await canvas_service.upload_chunk(
            request.upload_id,
            chunk_data,
            request.chunk_index
        )
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Erro ao receber chunk: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar chunk")


@router.post("/upload/finalize/{upload_id}")
async def finalize_upload(
    upload_id: str,
    current_user: User = Depends(get_current_user),
    canvas_service: CanvasRecordingService = Depends()
):
    """Finaliza upload de vídeo"""
    try:
        result = await canvas_service.finalize_upload(upload_id)
        return result
        
    except Exception as e:
        logger.error(f"Erro ao finalizar upload: {e}")
        raise HTTPException(status_code=500, detail="Erro ao finalizar upload")

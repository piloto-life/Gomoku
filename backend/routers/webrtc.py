"""
Rotas WebRTC para videochat
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Optional, Dict
from pydantic import BaseModel
import logging
import json

from models.user import User
from routers.auth import get_current_user, get_current_user_ws
from services.webrtc_service import WebRTCSignalingService, WEBRTC_CONFIG

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webrtc", tags=["webrtc"])

# Instância global do serviço de sinalização
signaling_service = WebRTCSignalingService()


class InitiateCallRequest(BaseModel):
    callee_id: str
    room_id: Optional[str] = None


class CallActionRequest(BaseModel):
    room_id: str


class SignalRequest(BaseModel):
    room_id: str
    sdp: Optional[str] = None
    candidate: Optional[Dict] = None


@router.get("/config")
async def get_webrtc_config():
    """Retorna configuração WebRTC (servidores STUN/TURN)"""
    return WEBRTC_CONFIG


@router.post("/call/initiate")
async def initiate_call(
    request: InitiateCallRequest,
    current_user: User = Depends(get_current_user)
):
    """Inicia chamada de vídeo"""
    try:
        call_info = await signaling_service.initiate_call(
            caller_id=str(current_user.id),
            callee_id=request.callee_id,
            room_id=request.room_id
        )
        
        return call_info
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao iniciar chamada: {e}")
        raise HTTPException(status_code=500, detail="Erro ao iniciar chamada")


@router.post("/call/accept")
async def accept_call(
    request: CallActionRequest,
    current_user: User = Depends(get_current_user)
):
    """Aceita chamada de vídeo"""
    try:
        call_info = await signaling_service.accept_call(
            room_id=request.room_id,
            user_id=str(current_user.id)
        )
        
        return call_info
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao aceitar chamada: {e}")
        raise HTTPException(status_code=500, detail="Erro ao aceitar chamada")


@router.post("/call/reject")
async def reject_call(
    request: CallActionRequest,
    current_user: User = Depends(get_current_user)
):
    """Rejeita chamada de vídeo"""
    try:
        result = await signaling_service.reject_call(
            room_id=request.room_id,
            user_id=str(current_user.id)
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao rejeitar chamada: {e}")
        raise HTTPException(status_code=500, detail="Erro ao rejeitar chamada")


@router.post("/call/end")
async def end_call(
    request: CallActionRequest,
    current_user: User = Depends(get_current_user)
):
    """Encerra chamada de vídeo"""
    try:
        result = await signaling_service.end_call(request.room_id)
        return result
        
    except Exception as e:
        logger.error(f"Erro ao encerrar chamada: {e}")
        raise HTTPException(status_code=500, detail="Erro ao encerrar chamada")


@router.get("/call/active")
async def get_active_calls(current_user: User = Depends(get_current_user)):
    """Lista chamadas ativas"""
    calls = signaling_service.get_active_calls()
    return {"calls": calls}


@router.get("/call/status")
async def get_user_call_status(current_user: User = Depends(get_current_user)):
    """Verifica se usuário está em chamada"""
    room_id = signaling_service.is_user_in_call(str(current_user.id))
    
    if room_id:
        return {"in_call": True, "room_id": room_id}
    else:
        return {"in_call": False}


# WebSocket para sinalização em tempo real

@router.websocket("/signal")
async def websocket_signaling(websocket: WebSocket):
    """
    WebSocket para sinalização WebRTC
    Transmite ofertas, respostas e candidatos ICE entre peers
    """
    await websocket.accept()
    
    user_id = None
    
    try:
        # Autenticar usuário
        auth_message = await websocket.receive_json()
        
        if auth_message.get("type") != "auth":
            await websocket.send_json({"error": "Authentication required"})
            await websocket.close()
            return
        
        token = auth_message.get("token")
        
        # Validar token (simplificado)
        # TODO: Implementar validação real
        user_id = auth_message.get("user_id")
        
        # Registrar conexão
        await signaling_service.connect(user_id, websocket)
        
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id
        })
        
        # Enviar sinais pendentes
        pending_signals = await signaling_service.get_pending_signals(user_id)
        for signal in pending_signals:
            await websocket.send_json(signal)
        
        # Loop de mensagens
        while True:
            message = await websocket.receive_json()
            message_type = message.get("type")
            
            if message_type == "offer":
                # Enviar oferta WebRTC
                await signaling_service.send_offer(
                    room_id=message["room_id"],
                    sender_id=user_id,
                    sdp=message["sdp"]
                )
                
            elif message_type == "answer":
                # Enviar resposta WebRTC
                await signaling_service.send_answer(
                    room_id=message["room_id"],
                    sender_id=user_id,
                    sdp=message["sdp"]
                )
                
            elif message_type == "ice_candidate":
                # Enviar candidato ICE
                await signaling_service.send_ice_candidate(
                    room_id=message["room_id"],
                    sender_id=user_id,
                    candidate=message["candidate"]
                )
                
            elif message_type == "ping":
                # Keepalive
                await websocket.send_json({"type": "pong"})
                
            else:
                logger.warning(f"Tipo de mensagem desconhecido: {message_type}")
        
    except WebSocketDisconnect:
        logger.info(f"WebSocket desconectado: {user_id}")
        
    except Exception as e:
        logger.error(f"Erro no WebSocket de sinalização: {e}")
        
    finally:
        if user_id:
            await signaling_service.disconnect(user_id)

"""
Serviço de WebRTC para videochat P2P
Gerencia sinalização (signaling) entre peers
"""
import asyncio
from typing import Dict, Optional, Set
from datetime import datetime
from fastapi import WebSocket
import logging
import json

logger = logging.getLogger(__name__)


class WebRTCSignalingService:
    """
    Serviço de sinalização WebRTC para videochat
    Gerencia ofertas, respostas e candidatos ICE entre peers
    """
    
    def __init__(self):
        # Conexões WebSocket ativas: {user_id: WebSocket}
        self.connections: Dict[str, WebSocket] = {}
        
        # Chamadas ativas: {room_id: {user1_id, user2_id}}
        self.active_calls: Dict[str, Dict] = {}
        
        # Fila de sinalização
        self.signal_queue: Dict[str, list] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        """Registra conexão WebSocket do usuário"""
        self.connections[user_id] = websocket
        logger.info(f"Usuário {user_id} conectado ao WebRTC signaling")
    
    async def disconnect(self, user_id: str):
        """Remove conexão do usuário"""
        if user_id in self.connections:
            del self.connections[user_id]
        
        # Remover de chamadas ativas
        for room_id, call_info in list(self.active_calls.items()):
            if user_id in [call_info.get("caller_id"), call_info.get("callee_id")]:
                await self.end_call(room_id)
        
        logger.info(f"Usuário {user_id} desconectado do WebRTC signaling")
    
    async def initiate_call(
        self, 
        caller_id: str, 
        callee_id: str, 
        room_id: Optional[str] = None
    ) -> Dict:
        """
        Inicia chamada de vídeo
        
        Args:
            caller_id: ID do usuário que está chamando
            callee_id: ID do usuário sendo chamado
            room_id: ID da sala (geralmente game_id)
        
        Returns:
            Informações da chamada criada
        """
        if not room_id:
            room_id = f"{caller_id}_{callee_id}_{datetime.utcnow().timestamp()}"
        
        # Verificar se usuários estão conectados
        if caller_id not in self.connections:
            raise ValueError(f"Caller {caller_id} não está conectado")
        
        if callee_id not in self.connections:
            raise ValueError(f"Callee {callee_id} não está conectado")
        
        # Criar chamada
        call_info = {
            "room_id": room_id,
            "caller_id": caller_id,
            "callee_id": callee_id,
            "status": "ringing",
            "created_at": datetime.utcnow().isoformat()
        }
        
        self.active_calls[room_id] = call_info
        
        # Notificar callee sobre chamada recebida
        await self._send_signal(callee_id, {
            "type": "incoming_call",
            "room_id": room_id,
            "caller_id": caller_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        logger.info(f"Chamada iniciada: {caller_id} -> {callee_id} (room: {room_id})")
        
        return call_info
    
    async def accept_call(self, room_id: str, user_id: str) -> Dict:
        """Aceita chamada de vídeo"""
        if room_id not in self.active_calls:
            raise ValueError(f"Chamada {room_id} não encontrada")
        
        call_info = self.active_calls[room_id]
        
        if call_info["callee_id"] != user_id:
            raise ValueError("Usuário não autorizado a aceitar esta chamada")
        
        call_info["status"] = "active"
        call_info["accepted_at"] = datetime.utcnow().isoformat()
        
        # Notificar caller que chamada foi aceita
        await self._send_signal(call_info["caller_id"], {
            "type": "call_accepted",
            "room_id": room_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        logger.info(f"Chamada aceita: room {room_id}")
        
        return call_info
    
    async def reject_call(self, room_id: str, user_id: str) -> Dict:
        """Rejeita chamada de vídeo"""
        if room_id not in self.active_calls:
            raise ValueError(f"Chamada {room_id} não encontrada")
        
        call_info = self.active_calls[room_id]
        
        if call_info["callee_id"] != user_id:
            raise ValueError("Usuário não autorizado a rejeitar esta chamada")
        
        # Notificar caller que chamada foi rejeitada
        await self._send_signal(call_info["caller_id"], {
            "type": "call_rejected",
            "room_id": room_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Remover chamada
        del self.active_calls[room_id]
        
        logger.info(f"Chamada rejeitada: room {room_id}")
        
        return {"status": "rejected"}
    
    async def end_call(self, room_id: str) -> Dict:
        """Encerra chamada de vídeo"""
        if room_id not in self.active_calls:
            return {"status": "not_found"}
        
        call_info = self.active_calls[room_id]
        
        # Notificar ambos os participantes
        for user_id in [call_info["caller_id"], call_info["callee_id"]]:
            if user_id in self.connections:
                await self._send_signal(user_id, {
                    "type": "call_ended",
                    "room_id": room_id,
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        # Remover chamada
        del self.active_calls[room_id]
        
        logger.info(f"Chamada encerrada: room {room_id}")
        
        return {"status": "ended"}
    
    async def send_offer(
        self, 
        room_id: str, 
        sender_id: str, 
        sdp: str
    ) -> Dict:
        """
        Envia oferta WebRTC (SDP)
        
        Args:
            room_id: ID da sala
            sender_id: ID do remetente
            sdp: Session Description Protocol
        """
        if room_id not in self.active_calls:
            raise ValueError(f"Chamada {room_id} não encontrada")
        
        call_info = self.active_calls[room_id]
        
        # Determinar destinatário
        recipient_id = (
            call_info["callee_id"] 
            if sender_id == call_info["caller_id"] 
            else call_info["caller_id"]
        )
        
        # Enviar oferta para o outro peer
        await self._send_signal(recipient_id, {
            "type": "webrtc_offer",
            "room_id": room_id,
            "sender_id": sender_id,
            "sdp": sdp,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        logger.info(f"Oferta WebRTC enviada: {sender_id} -> {recipient_id} (room: {room_id})")
        
        return {"status": "sent"}
    
    async def send_answer(
        self, 
        room_id: str, 
        sender_id: str, 
        sdp: str
    ) -> Dict:
        """
        Envia resposta WebRTC (SDP)
        
        Args:
            room_id: ID da sala
            sender_id: ID do remetente
            sdp: Session Description Protocol
        """
        if room_id not in self.active_calls:
            raise ValueError(f"Chamada {room_id} não encontrada")
        
        call_info = self.active_calls[room_id]
        
        # Determinar destinatário
        recipient_id = (
            call_info["callee_id"] 
            if sender_id == call_info["caller_id"] 
            else call_info["caller_id"]
        )
        
        # Enviar resposta para o outro peer
        await self._send_signal(recipient_id, {
            "type": "webrtc_answer",
            "room_id": room_id,
            "sender_id": sender_id,
            "sdp": sdp,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        logger.info(f"Resposta WebRTC enviada: {sender_id} -> {recipient_id} (room: {room_id})")
        
        return {"status": "sent"}
    
    async def send_ice_candidate(
        self, 
        room_id: str, 
        sender_id: str, 
        candidate: Dict
    ) -> Dict:
        """
        Envia candidato ICE
        
        Args:
            room_id: ID da sala
            sender_id: ID do remetente
            candidate: Informações do candidato ICE
        """
        if room_id not in self.active_calls:
            raise ValueError(f"Chamada {room_id} não encontrada")
        
        call_info = self.active_calls[room_id]
        
        # Determinar destinatário
        recipient_id = (
            call_info["callee_id"] 
            if sender_id == call_info["caller_id"] 
            else call_info["caller_id"]
        )
        
        # Enviar candidato ICE para o outro peer
        await self._send_signal(recipient_id, {
            "type": "ice_candidate",
            "room_id": room_id,
            "sender_id": sender_id,
            "candidate": candidate,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {"status": "sent"}
    
    async def _send_signal(self, user_id: str, message: Dict):
        """Envia mensagem de sinalização para usuário específico"""
        if user_id not in self.connections:
            logger.warning(f"Usuário {user_id} não conectado, mensagem não enviada")
            
            # Armazenar em fila para envio posterior
            if user_id not in self.signal_queue:
                self.signal_queue[user_id] = []
            self.signal_queue[user_id].append(message)
            return
        
        try:
            websocket = self.connections[user_id]
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Erro ao enviar sinal para {user_id}: {e}")
            # Marcar conexão como inválida
            if user_id in self.connections:
                del self.connections[user_id]
    
    async def get_pending_signals(self, user_id: str) -> list:
        """Obtém sinais pendentes para usuário"""
        if user_id not in self.signal_queue:
            return []
        
        signals = self.signal_queue[user_id]
        del self.signal_queue[user_id]
        return signals
    
    def get_active_calls(self) -> list:
        """Lista todas as chamadas ativas"""
        return list(self.active_calls.values())
    
    def is_user_in_call(self, user_id: str) -> Optional[str]:
        """Verifica se usuário está em chamada, retorna room_id ou None"""
        for room_id, call_info in self.active_calls.items():
            if user_id in [call_info["caller_id"], call_info["callee_id"]]:
                return room_id
        return None


# Configuração de servidores STUN/TURN para WebRTC
WEBRTC_CONFIG = {
    "iceServers": [
        # Servidores STUN públicos (Google)
        {"urls": "stun:stun.l.google.com:19302"},
        {"urls": "stun:stun1.l.google.com:19302"},
        {"urls": "stun:stun2.l.google.com:19302"},
        
        # TURN servers (necessário configurar próprio servidor)
        # {
        #     "urls": "turn:seu-servidor-turn.com:3478",
        #     "username": "username",
        #     "credential": "password"
        # }
    ],
    "iceCandidatePoolSize": 10
}

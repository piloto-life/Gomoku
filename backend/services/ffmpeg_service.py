"""
Serviço de gravação de partidas com FFMPEG
Grava tela do jogo em WebM, 4 Mbit/s, 24 FPS
Armazena vídeos no MongoDB GridFS
"""
import asyncio
import subprocess
import os
import tempfile
from datetime import datetime
from typing import Optional, Dict
from pathlib import Path
import gridfs
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class FFMPEGRecordingService:
    """Serviço para gravação de partidas com FFMPEG"""
    
    def __init__(self, db):
        self.db = db
        self.fs = AsyncIOMotorGridFSBucket(db)
        self.active_recordings: Dict[str, subprocess.Popen] = {}
        self.temp_files: Dict[str, str] = {}
    
    async def start_recording(
        self, 
        game_id: str, 
        width: int = 1920, 
        height: int = 1080
    ) -> Dict:
        """
        Inicia gravação de uma partida
        
        Args:
            game_id: ID do jogo
            width: Largura do vídeo
            height: Altura do vídeo
        
        Returns:
            Dict com status da gravação
        """
        if game_id in self.active_recordings:
            raise ValueError(f"Gravação já em andamento para jogo {game_id}")
        
        # Criar arquivo temporário
        temp_dir = tempfile.gettempdir()
        temp_file = os.path.join(temp_dir, f"gomoku_{game_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.webm")
        
        # Comando FFMPEG
        # Nota: Este exemplo grava a tela. Para captura de canvas HTML,
        # seria necessário usar uma solução como Puppeteer + FFMPEG
        ffmpeg_cmd = [
            'ffmpeg',
            '-y',  # Sobrescrever arquivo se existir
            '-f', 'gdigrab',  # Windows screen capture
            '-framerate', '24',  # 24 FPS
            '-video_size', f'{width}x{height}',
            '-i', 'desktop',  # Capturar desktop
            '-c:v', 'libvpx-vp9',  # Codec VP9
            '-b:v', '4M',  # 4 Mbit/s
            '-deadline', 'realtime',  # Baixa latência
            '-cpu-used', '8',  # Velocidade de encoding
            temp_file
        ]
        
        try:
            # Iniciar processo FFMPEG
            process = subprocess.Popen(
                ffmpeg_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            
            self.active_recordings[game_id] = process
            self.temp_files[game_id] = temp_file
            
            # Registrar no banco
            await self.db.recordings.insert_one({
                "_id": ObjectId(),
                "game_id": game_id,
                "status": "recording",
                "started_at": datetime.utcnow(),
                "temp_file": temp_file,
                "video_id": None
            })
            
            logger.info(f"Gravação iniciada para jogo {game_id}")
            
            return {
                "status": "recording",
                "game_id": game_id,
                "started_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro ao iniciar gravação: {e}")
            raise
    
    async def stop_recording(self, game_id: str) -> Dict:
        """
        Para gravação e salva vídeo no GridFS
        
        Args:
            game_id: ID do jogo
        
        Returns:
            Dict com informações do vídeo salvo
        """
        if game_id not in self.active_recordings:
            raise ValueError(f"Nenhuma gravação ativa para jogo {game_id}")
        
        process = self.active_recordings[game_id]
        temp_file = self.temp_files[game_id]
        
        try:
            # Enviar sinal SIGTERM para parar FFMPEG gracefully
            process.terminate()
            
            # Aguardar processo finalizar (timeout 10s)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            
            # Aguardar arquivo ser escrito completamente
            await asyncio.sleep(2)
            
            # Verificar se arquivo existe
            if not os.path.exists(temp_file):
                raise FileNotFoundError(f"Arquivo de vídeo não encontrado: {temp_file}")
            
            # Upload para GridFS
            file_size = os.path.getsize(temp_file)
            
            with open(temp_file, 'rb') as video_file:
                video_id = await self.fs.upload_from_stream(
                    f"game_{game_id}.webm",
                    video_file,
                    metadata={
                        "game_id": game_id,
                        "content_type": "video/webm",
                        "uploaded_at": datetime.utcnow(),
                        "size": file_size
                    }
                )
            
            # Atualizar registro no banco
            await self.db.recordings.update_one(
                {"game_id": game_id, "status": "recording"},
                {
                    "$set": {
                        "status": "completed",
                        "finished_at": datetime.utcnow(),
                        "video_id": str(video_id),
                        "file_size": file_size
                    }
                }
            )
            
            # Limpar recursos
            del self.active_recordings[game_id]
            del self.temp_files[game_id]
            
            # Deletar arquivo temporário
            try:
                os.remove(temp_file)
            except:
                pass
            
            logger.info(f"Gravação concluída para jogo {game_id}, video_id: {video_id}")
            
            return {
                "status": "completed",
                "game_id": game_id,
                "video_id": str(video_id),
                "file_size": file_size,
                "url": f"/api/videos/{video_id}"
            }
            
        except Exception as e:
            logger.error(f"Erro ao parar gravação: {e}")
            
            # Limpar recursos em caso de erro
            if game_id in self.active_recordings:
                del self.active_recordings[game_id]
            if game_id in self.temp_files:
                del self.temp_files[game_id]
            
            # Atualizar status como erro
            await self.db.recordings.update_one(
                {"game_id": game_id, "status": "recording"},
                {"$set": {"status": "error", "error": str(e)}}
            )
            
            raise
    
    async def get_video_stream(self, video_id: str):
        """
        Obtém stream de vídeo do GridFS
        
        Args:
            video_id: ID do vídeo no GridFS
        
        Returns:
            AsyncIOMotorGridOut stream
        """
        try:
            grid_out = await self.fs.open_download_stream(ObjectId(video_id))
            return grid_out
        except Exception as e:
            logger.error(f"Erro ao buscar vídeo {video_id}: {e}")
            raise
    
    async def get_recording_status(self, game_id: str) -> Dict:
        """Obtém status da gravação de um jogo"""
        recording = await self.db.recordings.find_one({"game_id": game_id})
        
        if not recording:
            return {"status": "not_started"}
        
        return {
            "status": recording.get("status"),
            "started_at": recording.get("started_at"),
            "finished_at": recording.get("finished_at"),
            "video_id": recording.get("video_id"),
            "file_size": recording.get("file_size")
        }
    
    async def list_recordings(self, user_id: Optional[str] = None, limit: int = 50) -> list:
        """Lista gravações disponíveis"""
        query = {"status": "completed"}
        
        if user_id:
            # Buscar jogos do usuário
            games = await self.db.games.find(
                {"$or": [{"player1_id": user_id}, {"player2_id": user_id}]}
            ).to_list(length=None)
            
            game_ids = [g["_id"] for g in games]
            query["game_id"] = {"$in": game_ids}
        
        recordings = await self.db.recordings.find(query).limit(limit).to_list(length=limit)
        
        return [
            {
                "id": str(r["_id"]),
                "game_id": r["game_id"],
                "video_id": r["video_id"],
                "started_at": r.get("started_at"),
                "finished_at": r.get("finished_at"),
                "file_size": r.get("file_size"),
                "url": f"/api/videos/{r['video_id']}"
            }
            for r in recordings
        ]
    
    async def delete_recording(self, video_id: str) -> bool:
        """Deleta gravação do GridFS"""
        try:
            await self.fs.delete(ObjectId(video_id))
            await self.db.recordings.delete_one({"video_id": video_id})
            logger.info(f"Vídeo {video_id} deletado com sucesso")
            return True
        except Exception as e:
            logger.error(f"Erro ao deletar vídeo {video_id}: {e}")
            return False
    
    async def cleanup_temp_files(self):
        """Limpa arquivos temporários órfãos"""
        for temp_file in self.temp_files.values():
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except:
                pass


# Alternativa: Gravação via Canvas (Browser-side)
# Para gravar o canvas do jogo no browser e enviar para backend

class CanvasRecordingService:
    """
    Serviço para receber chunks de vídeo do frontend (MediaRecorder API)
    e salvar no MongoDB GridFS
    """
    
    def __init__(self, db):
        self.db = db
        self.fs = AsyncIOMotorGridFSBucket(db)
        self.upload_streams: Dict[str, ObjectId] = {}
    
    async def init_upload(self, game_id: str, content_type: str = "video/webm") -> str:
        """
        Inicia upload de vídeo
        
        Returns:
            upload_id para envio de chunks
        """
        upload_id = ObjectId()
        
        await self.db.recording_uploads.insert_one({
            "_id": upload_id,
            "game_id": game_id,
            "content_type": content_type,
            "started_at": datetime.utcnow(),
            "status": "uploading",
            "chunks_received": 0
        })
        
        self.upload_streams[str(upload_id)] = upload_id
        
        return str(upload_id)
    
    async def upload_chunk(self, upload_id: str, chunk_data: bytes, chunk_index: int):
        """Recebe chunk de vídeo do frontend"""
        await self.db.recording_chunks.insert_one({
            "upload_id": upload_id,
            "chunk_index": chunk_index,
            "data": chunk_data,
            "received_at": datetime.utcnow()
        })
        
        await self.db.recording_uploads.update_one(
            {"_id": ObjectId(upload_id)},
            {"$inc": {"chunks_received": 1}}
        )
    
    async def finalize_upload(self, upload_id: str) -> Dict:
        """Finaliza upload, concatena chunks e salva no GridFS"""
        # Buscar todos os chunks ordenados
        chunks = await self.db.recording_chunks.find(
            {"upload_id": upload_id}
        ).sort("chunk_index", 1).to_list(length=None)
        
        # Concatenar chunks
        video_data = b"".join([c["data"] for c in chunks])
        
        # Upload para GridFS
        upload_info = await self.db.recording_uploads.find_one({"_id": ObjectId(upload_id)})
        
        video_id = await self.fs.upload_from_stream(
            f"game_{upload_info['game_id']}.webm",
            video_data,
            metadata={
                "game_id": upload_info["game_id"],
                "content_type": upload_info["content_type"],
                "uploaded_at": datetime.utcnow(),
                "size": len(video_data)
            }
        )
        
        # Atualizar status
        await self.db.recording_uploads.update_one(
            {"_id": ObjectId(upload_id)},
            {
                "$set": {
                    "status": "completed",
                    "video_id": str(video_id),
                    "finished_at": datetime.utcnow()
                }
            }
        )
        
        # Limpar chunks
        await self.db.recording_chunks.delete_many({"upload_id": upload_id})
        
        return {
            "video_id": str(video_id),
            "size": len(video_data),
            "url": f"/api/videos/{video_id}"
        }

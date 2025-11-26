from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import FileResponse
from typing import List, Optional
import shutil
import os
from datetime import datetime
from bson import ObjectId
import subprocess
import json

from routers.auth import get_current_user
from database import get_collection
from models.user import UserPublic

router = APIRouter()

UPLOAD_DIR = "uploads/recordings"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Limites
MAX_RECORDINGS_PER_USER = 5
MAX_DURATION_SECONDS = 300  # 5 minutos

def get_video_duration(file_path: str) -> float:
    """Usa ffprobe para obter a duração exata do vídeo em segundos."""
    try:
        result = subprocess.run(
            [
                "ffprobe", 
                "-v", "error", 
                "-show_entries", "format=duration", 
                "-of", "default=noprint_wrappers=1:nokey=1", 
                file_path
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT
        )
        return float(result.stdout)
    except Exception as e:
        print(f"Erro ao verificar duração: {e}")
        return 0.0

@router.post("/upload")
async def upload_recording(
    file: UploadFile = File(...),
    game_id: str = Form(...),
    duration: Optional[float] = Form(None), # Duração estimada pelo frontend
    current_user: UserPublic = Depends(get_current_user)
):
    try:
        recordings_collection = await get_collection("recordings")

        # 1. Salvar arquivo temporariamente
        filename = f"{current_user.id}_{datetime.utcnow().timestamp()}.webm"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Verificar Duração Real (Backend Validation)
        real_duration = get_video_duration(file_path)
        
        if real_duration > MAX_DURATION_SECONDS:
            os.remove(file_path) # Deleta o arquivo se for muito longo
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"A gravação excede o limite de 5 minutos ({int(real_duration)}s)."
            )

        # 3. Verificar Cota do Usuário (FIFO)
        user_recordings = await recordings_collection.find(
            {"user_id": current_user.id}
        ).sort("created_at", 1).to_list(length=100)

        if len(user_recordings) >= MAX_RECORDINGS_PER_USER:
            # Identificar o mais antigo (o primeiro da lista ordenada por data asc)
            oldest = user_recordings[0]
            
            # Remover arquivo físico
            oldest_path = oldest.get("file_path")
            if oldest_path and os.path.exists(oldest_path):
                try:
                    os.remove(oldest_path)
                except Exception as e:
                    print(f"Erro ao deletar arquivo antigo: {e}")
            
            # Remover do banco
            await recordings_collection.delete_one({"_id": oldest["_id"]})

        # 4. Salvar Metadados no Banco
        recording_doc = {
            "user_id": current_user.id,
            "game_id": game_id,
            "filename": filename,
            "file_path": file_path,
            "duration": real_duration,
            "size": os.path.getsize(file_path),
            "created_at": datetime.utcnow()
        }
        
        result = await recordings_collection.insert_one(recording_doc)

        return {
            "id": str(result.inserted_id),
            "message": "Gravação salva com sucesso",
            "duration": real_duration
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro no upload: {e}")
        raise HTTPException(status_code=500, detail="Falha ao salvar gravação")

@router.get("/list")
async def list_my_recordings(current_user: UserPublic = Depends(get_current_user)):
    """Lista as gravações do usuário atual."""
    recordings_collection = await get_collection("recordings")
    cursor = recordings_collection.find({"user_id": current_user.id}).sort("created_at", -1)
    results = await cursor.to_list(length=MAX_RECORDINGS_PER_USER)
    
    # Serializar ObjectId e formatar data
    for rec in results:
        rec["id"] = str(rec["_id"])
        del rec["_id"]
        if "created_at" in rec:
            rec["created_at"] = rec["created_at"].isoformat()
            
    return results

@router.get("/download/{recording_id}")
async def download_recording(recording_id: str, current_user: UserPublic = Depends(get_current_user)):
    """Permite baixar a gravação se pertencer ao usuário."""
    recordings_collection = await get_collection("recordings")
    
    try:
        oid = ObjectId(recording_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")

    recording = await recordings_collection.find_one({"_id": oid})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Gravação não encontrada")
        
    if recording["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    file_path = recording["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo de vídeo não encontrado no servidor")

    return FileResponse(
        path=file_path,
        filename=recording["filename"],
        media_type="video/webm"
    )

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import uuid
import os
import io
from bson import ObjectId

from database import get_collection
from models.user import UserPublic
from routers.auth import get_current_user

router = APIRouter(prefix="/api/recordings", tags=["recordings"])

# In-memory storage for upload sessions (in production, use Redis or database)
upload_sessions = {}


class UploadInitResponse(BaseModel):
    upload_id: str
    chunk_size: int


class ChunkUploadResponse(BaseModel):
    chunk_number: int
    received: bool


class FinalizeRequest(BaseModel):
    game_id: str
    filename: str
    duration: Optional[int] = None


@router.post("/upload/init", response_model=UploadInitResponse)
async def initialize_upload(
    current_user: UserPublic = Depends(get_current_user)
):
    """Initialize a multipart upload session"""
    
    upload_id = str(uuid.uuid4())
    upload_sessions[upload_id] = {
        "user_id": current_user.id,
        "chunks": {},
        "created_at": datetime.utcnow()
    }
    
    # Clean up old sessions (older than 1 hour)
    cutoff_time = datetime.utcnow() - timedelta(hours=1)
    expired_sessions = [
        uid for uid, session in upload_sessions.items()
        if session["created_at"] < cutoff_time
    ]
    for uid in expired_sessions:
        del upload_sessions[uid]
    
    return UploadInitResponse(
        upload_id=upload_id,
        chunk_size=262144  # 256KB chunks
    )


@router.post("/upload/chunk", response_model=ChunkUploadResponse)
async def upload_chunk(
    upload_id: str = Form(...),
    chunk_number: int = Form(...),
    chunk: UploadFile = File(...),
    current_user: UserPublic = Depends(get_current_user)
):
    """Upload a video chunk"""
    
    if upload_id not in upload_sessions:
        raise HTTPException(status_code=404, detail="Upload session not found")
    
    session = upload_sessions[upload_id]
    
    # Verify user owns this upload session
    if session["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Read and store chunk
    chunk_data = await chunk.read()
    session["chunks"][chunk_number] = chunk_data
    
    return ChunkUploadResponse(
        chunk_number=chunk_number,
        received=True
    )


@router.post("/upload/finalize/{upload_id}")
async def finalize_upload(
    upload_id: str,
    finalize_data: FinalizeRequest,
    current_user: UserPublic = Depends(get_current_user)
):
    """Finalize upload and save recording to database"""
    
    if upload_id not in upload_sessions:
        raise HTTPException(status_code=404, detail="Upload session not found")
    
    session = upload_sessions[upload_id]
    
    # Verify user owns this upload session
    if session["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Assemble chunks in order
    sorted_chunks = sorted(session["chunks"].items())
    video_data = b"".join([chunk_data for _, chunk_data in sorted_chunks])
    
    # Create recordings directory if it doesn't exist
    recordings_dir = "recordings"
    os.makedirs(recordings_dir, exist_ok=True)
    
    # Save file
    file_extension = os.path.splitext(finalize_data.filename)[1] or ".webm"
    safe_filename = f"{upload_id}{file_extension}"
    file_path = os.path.join(recordings_dir, safe_filename)
    
    with open(file_path, "wb") as f:
        f.write(video_data)
    
    # Save metadata to database
    collection = await get_collection("recordings")
    recording_doc = {
        "game_id": finalize_data.game_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "upload_id": upload_id,
        "filename": safe_filename,
        "original_filename": finalize_data.filename,
        "file_path": file_path,
        "file_size": len(video_data),
        "duration": finalize_data.duration,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=15)  # 15 days retention
    }
    
    result = await collection.insert_one(recording_doc)
    
    # Clean up session
    del upload_sessions[upload_id]
    
    return {
        "id": str(result.inserted_id),
        "message": "Recording saved successfully",
        "file_size": len(video_data),
        "url": f"/api/recordings/{result.inserted_id}"
    }


@router.get("/{recording_id}")
async def get_recording(
    recording_id: str,
    current_user: UserPublic = Depends(get_current_user)
):
    """Get a recording by ID"""
    
    collection = await get_collection("recordings")
    recording = await collection.find_one({"_id": ObjectId(recording_id)})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    # Verify user has access (owner or game participant)
    if recording["user_id"] != current_user.id:
        # Check if user was in the game
        games_collection = await get_collection("games")
        game = await games_collection.find_one({"_id": ObjectId(recording["game_id"])})
        
        if not game:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        user_in_game = (
            game.get("players", {}).get("black", {}).get("id") == current_user.id or
            game.get("players", {}).get("white", {}).get("id") == current_user.id
        )
        
        if not user_in_game:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Stream the video file
    file_path = recording["file_path"]
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Recording file not found")
    
    def iterfile():
        with open(file_path, "rb") as f:
            yield from f
    
    return StreamingResponse(
        iterfile(),
        media_type="video/webm",
        headers={
            "Content-Disposition": f'inline; filename="{recording["original_filename"]}"'
        }
    )


@router.delete("/{recording_id}")
async def delete_recording(
    recording_id: str,
    current_user: UserPublic = Depends(get_current_user)
):
    """Delete a recording"""
    
    collection = await get_collection("recordings")
    recording = await collection.find_one({"_id": ObjectId(recording_id)})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    # Only owner or admin can delete
    if recording["user_id"] != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete file
    file_path = recording["file_path"]
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete from database
    await collection.delete_one({"_id": ObjectId(recording_id)})
    
    return {"message": "Recording deleted successfully"}

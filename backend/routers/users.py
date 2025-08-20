from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from models.user import User, UserUpdate
from routers.auth import get_current_user
from database import get_collection

router = APIRouter()

@router.get("/", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    """Get list of all users"""
    users_collection = await get_collection("users")
    users = []
    async for user_doc in users_collection.find({}, {"password_hash": 0}):
        users.append(User(**user_doc))
    return users

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Get user by ID"""
    users_collection = await get_collection("users")
    user_doc = await users_collection.find_one({"_id": user_id}, {"password_hash": 0})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(**user_doc)

@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update current user profile"""
    users_collection = await get_collection("users")
    
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if update_data:
        await users_collection.update_one(
            {"_id": current_user.id},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user_doc = await users_collection.find_one(
        {"_id": current_user.id}, 
        {"password_hash": 0}
    )
    
    return User(**updated_user_doc)

@router.get("/online/count")
async def get_online_users_count():
    """Get count of online users"""
    # For now, return mock data
    # TODO: Implement real online user tracking with WebSocket
    return {"online_count": 5}

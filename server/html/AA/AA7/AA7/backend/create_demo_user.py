import asyncio
from datetime import datetime
from passlib.context import CryptContext

from database import connect_to_mongo, get_collection, close_mongo_connection
from models.user import UserInDB, UserProfile, Location, UserStats

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_demo_user():
    """Create a demo user for testing"""
    
    # Connect to database
    await connect_to_mongo()
    users_collection = await get_collection("users")
    
    # Check if demo user already exists
    existing_user = await users_collection.find_one({"email": "demo@gomoku.com"})
    if existing_user:
        print("Demo user already exists!")
        return
    
    # Create demo user
    location = Location(city="São Paulo", state="SP", country="Brasil")
    profile = UserProfile(name="Demo Player", age=25, location=location)
    stats = UserStats(
        games_played=10,
        games_won=7,
        games_lost=3,
        current_score=1200
    )
    
    demo_user = UserInDB(
        username="demo",
        email="demo@gomoku.com",
        profile=profile,
        password_hash=pwd_context.hash("demo123"),
        stats=stats,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    # Insert into database
    result = await users_collection.insert_one(demo_user.dict(by_alias=True))
    print(f"Demo user created with ID: {result.inserted_id}")

async def main():
    print("Creating demo user...")
    await create_demo_user()
    await close_mongo_connection()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
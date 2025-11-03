from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: AsyncIOMotorClient = None
    database = None

database = Database()

async def get_database():
    return database.database

async def connect_to_mongo():
    """Create database connection"""
    try:
        database.client = AsyncIOMotorClient(
            os.getenv("MONGODB_URL", "mongodb://admin:password@localhost:27017/gomoku_db?authSource=admin")
        )
        database.database = database.client.gomoku_db
        
        # Test connection
        await database.client.admin.command('ping')
        print("✅ Connected to MongoDB successfully!")
        
    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if database.client:
        database.client.close()
        print("🔌 Disconnected from MongoDB")

async def get_collection(collection_name: str):
    """Get a collection from the database"""
    return database.database[collection_name]

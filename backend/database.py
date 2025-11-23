from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv
import certifi

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
            os.getenv("MONGODB_URL", "mongodb+srv://gomoku:UfSRpZPBfHaO9ADl@gomoku.ggs5g4x.mongodb.net/?appName=Gomoku"),
            tlsCAFile=certifi.where()
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

async def get_fs():
    """Get GridFS bucket"""
    from motor.motor_asyncio import AsyncIOMotorGridFSBucket
    return AsyncIOMotorGridFSBucket(database.database)

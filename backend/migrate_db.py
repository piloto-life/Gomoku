import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv
from datetime import datetime, timezone
import bcrypt

load_dotenv()

async def run_migrations():
    """Run database migrations"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
        db = client.gomoku_db

        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas successfully!")

        # Create collections if they don't exist
        collections = ['users', 'games', 'matches', 'rankings']
        for collection_name in collections:
            if collection_name not in await db.list_collection_names():
                await db.create_collection(collection_name)
                print(f"✅ Created collection: {collection_name}")
            else:
                print(f"ℹ️  Collection {collection_name} already exists")

        # Create indexes
        print("📝 Creating indexes...")

        # Users indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        print("✅ Users indexes created")

        # Games indexes
        await db.games.create_index([("created_at", -1)])
        await db.games.create_index("players")
        print("✅ Games indexes created")

        # Matches indexes
        await db.matches.create_index("game_id")
        print("✅ Matches indexes created")

        # Rankings indexes
        await db.rankings.create_index("user_id")
        await db.rankings.create_index([("score", -1)])
        print("✅ Rankings indexes created")

        # Check if admin user exists
        admin_user = await db.users.find_one({"username": "admin"})
        if admin_user:
            print("ℹ️  Admin user already exists")
        else:
            # Create default admin user
            password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            admin_data = {
                "username": "admin",
                "email": "admin@gomoku.com",
                "password_hash": password_hash,
                "is_admin": True,
                "created_at": datetime.now(timezone.utc),
                "profile": {
                    "name": "Administrator",
                    "age": None,
                    "location": {
                        "city": "",
                        "state": "",
                        "country": ""
                    },
                    "avatar_url": ""
                },
                "stats": {
                    "games_played": 0,
                    "games_won": 0,
                    "games_lost": 0,
                    "current_score": 0
                },
                "is_active": True
            }
            await db.users.insert_one(admin_data)
            print("✅ Default admin user created")

        print("🎉 Database migrations completed successfully!")

    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise
    except Exception as e:
        print(f"❌ Migration error: {e}")
        raise
    finally:
        if 'client' in locals():
            client.close()
            print("🔌 Disconnected from MongoDB")

if __name__ == "__main__":
    asyncio.run(run_migrations())
import asyncio
import logging
from database import connect_to_mongo, close_mongo_connection, get_database
from services.ranking_service import RankingService

logging.basicConfig(level=logging.DEBUG)

async def main():
    try:
        await connect_to_mongo()
        db = await get_database()
        svc = RankingService(db)
        print("Calling get_leaderboard...")
        leaderboard = await svc.get_leaderboard(limit=10, tier=None, min_games=0)
        print(f"Leaderboard length: {len(leaderboard)}")
        for p in leaderboard[:5]:
            print(p)
    except Exception as e:
        import traceback
        print("Exception while calling get_leaderboard:")
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == '__main__':
    asyncio.run(main())

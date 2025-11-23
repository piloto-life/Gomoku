import asyncio
from database import connect_to_mongo, close_mongo_connection
from app import app
from fastapi.testclient import TestClient

async def setup_db():
    await connect_to_mongo()

asyncio.run(setup_db())

client = TestClient(app)
resp = client.get('/api/ranking/leaderboard?limit=10&min_games=0')
print('STATUS:', resp.status_code)
try:
    print(resp.json())
except Exception as e:
    print('Response content:', resp.content)

asyncio.run(close_mongo_connection())

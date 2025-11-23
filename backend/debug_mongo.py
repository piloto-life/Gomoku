import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import sys

# URI from your recent edit
URI = "mongodb+srv://gomoku:UfSRpZPBfHaO9ADl@gomoku.ggs5g4x.mongodb.net/?appName=Gomoku"

async def test_connect():
    print(f"Python Version: {sys.version}")
    print(f"Testing connection to: {URI}")
    
    print("\n--- Attempt 1: Certifi ---")
    try:
        client = AsyncIOMotorClient(URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("✅ SUCCESS! Connected with certifi.")
        return
    except Exception as e:
        print(f"❌ FAILED: {e}")

    print("\n--- Attempt 2: No SSL Verification (tlsAllowInvalidCertificates=True) ---")
    try:
        client = AsyncIOMotorClient(URI, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("✅ SUCCESS! Connected with verification disabled.")
        return
    except Exception as e:
        print(f"❌ FAILED: {e}")

    print("\n--- Attempt 3: Default Settings ---")
    try:
        client = AsyncIOMotorClient(URI, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("✅ SUCCESS! Connected with defaults.")
        return
    except Exception as e:
        print(f"❌ FAILED: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(test_connect())
    except KeyboardInterrupt:
        print("\nInterrupted.")

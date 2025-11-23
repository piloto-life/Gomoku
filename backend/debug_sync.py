import pymongo
import certifi
import sys

URI = "mongodb+srv://gomoku:UfSRpZPBfHaO9ADl@gomoku.ggs5g4x.mongodb.net/?appName=Gomoku"

print(f"PyMongo Version: {pymongo.__version__}")

try:
    print("Attempting connection with certifi...")
    client = pymongo.MongoClient(URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("SUCCESS with certifi")
except Exception as e:
    print(f"FAILED with certifi: {e}")

try:
    print("Attempting connection with tlsAllowInvalidCertificates=True...")
    client = pymongo.MongoClient(URI, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("SUCCESS with tlsAllowInvalidCertificates=True")
except Exception as e:
    print(f"FAILED with tlsAllowInvalidCertificates=True: {e}")

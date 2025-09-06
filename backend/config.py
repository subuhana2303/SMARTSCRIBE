import os
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smartscribe")

# Global database connection
_client = None
_database = None

def get_database():
    global _client, _database
    if _database is None:
        _client = AsyncIOMotorClient(MONGODB_URL)
        _database = _client[DATABASE_NAME]
    return _database

async def close_database():
    global _client
    if _client:
        _client.close()

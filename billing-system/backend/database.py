from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/billing_system")
client = AsyncIOMotorClient(MONGO_URI)
db = client.billing_system

async def get_db():
    return db

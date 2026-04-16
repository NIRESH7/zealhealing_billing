from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/")
MONGO_DB = os.getenv("MONGO_DB", "zeal_billing_db")
client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB]

async def get_db():
    return db

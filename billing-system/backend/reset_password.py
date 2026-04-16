import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.zeal_billing_db
    new_hash = pwd_context.hash("adminpassword123")
    result = await db.users.update_one(
        {"username": "zeal_admin"},
        {"$set": {"hashed_password": new_hash}}
    )
    print(f"Modified: {result.modified_count}")
    client.close()

asyncio.run(reset())

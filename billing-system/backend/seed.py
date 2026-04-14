import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from passlib.context import CryptContext

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client.billing_system

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def seed_user():
    username = "admin"
    password = "adminpassword123"
    
    existing = await db.users.find_one({"username": username})
    if existing:
        print(f"User '{username}' already exists.")
        return
        
    hashed_password = get_password_hash(password)
    user_doc = {
        "username": username,
        "hashed_password": hashed_password,
        "role": "admin"
    }
    
    await db.users.insert_one(user_doc)
    print(f"Successfully inserted user '{username}' with role 'admin'.")

if __name__ == "__main__":
    asyncio.run(seed_user())

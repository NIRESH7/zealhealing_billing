import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/")
MONGO_DB = os.getenv("MONGO_DB", "zeal_billing_db")
client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB]

import bcrypt

def get_password_hash(password):
    # Hash a password for the first time
    # (bcrypt.hashpw expects bytes, so encode the password)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

async def seed_user():
    username = os.getenv("ADMIN_USERNAME", "zeal_admin")
    password = os.getenv("ADMIN_PASSWORD", "zeal_password123")
    
    existing = await db.users.find_one({"username": username})
    if existing:
        print(f"User '{username}' already exists in {MONGO_DB}.")
        return
        
    hashed_password = get_password_hash(password)
    user_doc = {
        "username": username,
        "hashed_password": hashed_password,
        "role": "admin"
    }
    
    await db.users.insert_one(user_doc)
    print(f"Successfully inserted user '{username}' with role 'admin' into {MONGO_DB}.")

if __name__ == "__main__":
    asyncio.run(seed_user())

import asyncio
import os
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB = os.getenv("MONGO_DB", "zeal_billing_db")

async def create_user(username, password, role="admin"):
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB]
    
    # Hash password using bcrypt (same as auth.py)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    hashed_password = hashed.decode('utf-8')
    
    user_data = {
        "username": username,
        "hashed_password": hashed_password,
        "role": role
    }
    
    # Upsert user
    result = await db.users.update_one(
        {"username": username},
        {"$set": user_data},
        upsert=True
    )
    
    if result.upserted_id:
        print(f"SUCCESS: Created user '{username}' with role '{role}'")
    else:
        print(f"SUCCESS: Updated password for user '{username}'")
    
    client.close()

if __name__ == "__main__":
    # Create the admin user from screenshot
    asyncio.run(create_user("admin", "admin123"))
    # Also create the one they tried to register
    asyncio.run(create_user("admin1", "admin1234"))

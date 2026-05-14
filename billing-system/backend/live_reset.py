import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

async def reset_password(username, password):
    # Connect to the MongoDB container
    client = AsyncIOMotorClient("mongodb://mongodb:27017")
    db = client.zeal_billing_db
    
    # Hash the password manually with bcrypt
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    # Upsert the user (create if doesn't exist)
    result = await db.users.update_one(
        {"username": username},
        {"$set": {
            "hashed_password": hashed,
            "role": "admin"
        }},
        upsert=True
    )
    
    if result.upserted_id:
        print(f"User '{username}' created successfully.")
    else:
        print(f"User '{username}' password updated successfully.")
    
    client.close()

if __name__ == "__main__":
    import sys
    user = sys.argv[1] if len(sys.argv) > 1 else "zeal_admin"
    pw = sys.argv[2] if len(sys.argv) > 2 else "zeal_password12"
    asyncio.run(reset_password(user, pw))

import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def reset_db():
    uri = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
    db_name = os.getenv("MONGO_DB", "zeal_billing_db")
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    await client.drop_database(db_name)
    print(f"Dropped database: {db_name}")

if __name__ == "__main__":
    asyncio.run(reset_db())

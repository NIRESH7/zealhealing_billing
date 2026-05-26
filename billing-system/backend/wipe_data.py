import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def wipe():
    mongo_url = os.getenv("MONGO_URL", os.getenv("MONGO_URI", "mongodb://localhost:27017"))
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client.zeal_billing_db
    await db.transactions.delete_many({})
    await db.customers.delete_many({})
    print("Ledger and Customer data wiped clean successfully.")

if __name__ == "__main__":
    asyncio.run(wipe())

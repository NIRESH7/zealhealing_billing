import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB = os.getenv("MONGO_DB", "zeal_billing_db")

# Adjust sys.path to find utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from utils import generate_invoice_pdf

async def regenerate():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB]
    
    print("Fetching all transactions from DB...")
    cursor = db.transactions.find({})
    txs = await cursor.to_list(length=None)
    print(f"Found {len(txs)} transactions. Starting regeneration...")
    
    count = 0
    for tx in txs:
        try:
            # We must map ObjectId to string or pass raw dict
            # generate_invoice_pdf handles raw dict with '_id'
            url = generate_invoice_pdf(tx)
            await db.transactions.update_one({"_id": tx["_id"]}, {"$set": {"invoice_url": url}})
            count += 1
            print(f"[{count}/{len(txs)}] Regenerated: {tx.get('name')} | {tx.get('date')} -> {url}")
        except Exception as e:
            print(f"Failed for tx {tx.get('_id')}: {e}")
            
    print(f"Regenerated {count} invoices successfully.")
    client.close()

if __name__ == "__main__":
    asyncio.run(regenerate())

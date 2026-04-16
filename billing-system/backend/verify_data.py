import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.zeal_billing_db
    
    transactions = await db.transactions.find().to_list(length=100)
    for t in transactions:
        print(f"Product: {repr(t.get('product'))}, Amount: {t.get('amount')}, Status: {t.get('status')}")

asyncio.run(main())

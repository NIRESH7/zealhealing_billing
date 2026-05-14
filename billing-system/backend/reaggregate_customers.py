import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def reaggregate():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    db = client.zeal_billing_db
    
    print("Clearing existing customers...")
    await db.customers.delete_many({})
    
    print("Fetching all transactions...")
    cursor = db.transactions.find({"status": "Verified"})
    transactions = await cursor.to_list(length=100000)
    
    print(f"Processing {len(transactions)} transactions...")
    customer_data = {} # (phone, name_lower) -> {name, total_spent, total_transactions}
    
    for tx in transactions:
        phone = tx.get("phone")
        name = str(tx.get("name", "Unknown")).strip()
        name_lower = name.lower()
        amount = tx.get("amount", 0)
        
        key = (phone, name_lower)
        if key not in customer_data:
            customer_data[key] = {"name": name, "phone": phone, "total_spent": 0, "total_transactions": 0}
        
        customer_data[key]["total_spent"] += amount
        customer_data[key]["total_transactions"] += 1
        
    if customer_data:
        print(f"Upserting {len(customer_data)} unique customers...")
        docs = list(customer_data.values())
        await db.customers.insert_many(docs)
    
    print("Done!")
    client.close()

if __name__ == "__main__":
    asyncio.run(reaggregate())

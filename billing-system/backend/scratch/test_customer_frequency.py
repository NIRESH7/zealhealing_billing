import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

# Add backend dir to path to import database
sys.path.append(os.path.join(os.getcwd(), "backend"))

async def test_top_customers():
    # Use the same DB connection logic as the app
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.zeal_billing_db # Adjusted DB name
    
    # Mock parameters
    min_visits = 2
    
    # Simple check: Aggregate transactions
    pipeline = [
        {"$match": {"status": "Verified"}},
        {"$group": {
            "_id": "$phone",
            "name": {"$first": "$name"},
            "count": {"$sum": 1},
            "revenue": {"$sum": "$amount"}
        }},
        {"$match": {"count": {"$gte": min_visits}}},
        {"$sort": {"count": -1, "revenue": -1}},
        {"$limit": 6}
    ]
    
    cursor = db.transactions.aggregate(pipeline)
    results = await cursor.to_list(length=6)
    
    print(f"Found {len(results)} top customers with min_visits={min_visits}")
    for r in results:
        print(f" - {r['name']} ({r['_id']}): {r['count']} visits, Revenue: {r['revenue']}")

if __name__ == "__main__":
    asyncio.run(test_top_customers())

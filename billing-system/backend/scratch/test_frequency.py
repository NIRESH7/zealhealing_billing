import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.zeal_billing_db
    
    # Check current data for top customers with min_visits=1
    min_visits = 1
    query = {"status": "Verified"}
    
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$phone",
            "name": {"$first": "$name"},
            "phone": {"$first": "$phone"},
            "count": {"$sum": 1},
            "revenue": {"$sum": "$amount"}
        }}
    ]
    
    if min_visits and min_visits > 0:
        pipeline.append({"$match": {"count": {"$gte": min_visits}}})
    
    pipeline.extend([
        {"$sort": {"count": -1, "revenue": -1}},
        {"$limit": 6}
    ])
    
    print("Pipeline:", pipeline)
    cursor = db.transactions.aggregate(pipeline)
    results = await cursor.to_list(length=6)
    
    print("Results for min_visits=1 (Exact Match):")
    for r in results:
        print(f"Name: {r['name']}, Count: {r['count']}")

    # Test with min_visits=2
    min_visits = 2
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$phone",
            "name": {"$first": "$name"},
            "phone": {"$first": "$phone"},
            "count": {"$sum": 1},
            "revenue": {"$sum": "$amount"}
        }}
    ]
    if min_visits and min_visits > 0:
        pipeline.append({"$match": {"count": {"$gte": min_visits}}})
    
    cursor = db.transactions.aggregate(pipeline)
    results = await cursor.to_list(length=6)
    print("\nResults for min_visits=2 (Exact Match):")
    for r in results:
        print(f"Name: {r['name']}, Count: {r['count']}")

if __name__ == "__main__":
    asyncio.run(test())

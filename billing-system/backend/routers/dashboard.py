from fastapi import APIRouter, Depends
from database import get_db
from auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(db=Depends(get_db), current_user=Depends(get_current_user)):
    total_customers = await db.customers.count_documents({})
    
    # aggregation for total revenue
    pipeline = [
        {"$match": {"status": "Verified"}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$amount"}}}
    ]
    revenue_cursor = db.transactions.aggregate(pipeline)
    revenue_result = await revenue_cursor.to_list(length=1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    # get recent transactions count
    total_transactions = await db.transactions.count_documents({})
    verified_transactions = await db.transactions.count_documents({"status": "Verified"})
    pending_transactions = await db.transactions.count_documents({"status": "Pending"})
    
    return {
        "total_revenue": total_revenue,
        "total_customers": total_customers,
        "total_transactions": total_transactions,
        "verified_transactions": verified_transactions,
        "pending_transactions": pending_transactions,
        "system_health": 99.9, # Mocked for UI
        "pending_sync": pending_transactions
    }

@router.get("/history")
async def get_dashboard_history(db=Depends(get_db), current_user=Depends(get_current_user)):
    # Get transaction volume for the last 7 days
    history = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    # Mock data for demonstration if no real history exists, 
    # but normally we'd aggregate by date
    for day in days:
        history.append({"day": day, "value": 40 + (datetime.now().microsecond % 40)})
        
    return history

@router.get("/activity")
async def get_dashboard_activity(db=Depends(get_db), current_user=Depends(get_current_user)):
    # Fetch recent transactions as activity
    cursor = db.transactions.find().sort("date", -1).limit(4)
    activities = await cursor.to_list(length=4)
    
    result = []
    for act in activities:
        result.append({
            "timestamp": act.get("date", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
            "event": f"Invoice Batch #{act.get('invoice_number', 'N/A')} Generated",
            "status": act.get("status", "Pending").upper(),
            "user": act.get("customer_name", "System"),
            "reference": act.get("invoice_number", "INV-0000")
        })
    return result

@router.get("/top-courses")
async def get_top_courses(db=Depends(get_db), current_user=Depends(get_current_user)):
    pipeline = [
        {"$group": {
            "_id": {"$toLower": {"$trim": {"input": "$product"}}},
            "revenue": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"revenue": -1}},
        {"$limit": 3}
    ]
    cursor = db.transactions.aggregate(pipeline)
    courses = await cursor.to_list(length=3)
    
    result = []
    for course in courses:
        raw_name = course.get("_id") or "Unknown"
        name = str(raw_name).title()
        if name.lower() == "ai" or name.lower() == "a.i." or name.lower() == "a.i":
            name = "AI"
            
        result.append({
            "name": name,
            "revenue": course.get("revenue", 0),
            "count": course.get("count", 0),
            "initials": "".join([n[0] for n in name.split()[:2]]) if name.strip() else "XX"
        })
    return result

@router.get("/customers")
async def get_customers(skip: int = 0, limit: int = 50, db=Depends(get_db), current_user=Depends(get_current_user)):
    cursor = db.customers.find().sort("total_spent", -1).skip(skip).limit(limit)
    customers = await cursor.to_list(length=limit)
    for c in customers:
        c["id"] = str(c["_id"])
        del c["_id"]
    total = await db.customers.count_documents({})
    return {"total": total, "items": customers}

from fastapi import APIRouter, Depends, Query
from database import get_db
from auth import get_current_user
from datetime import datetime, timedelta
from typing import Optional, List

router = APIRouter()

def get_filter_query(products: Optional[List[str]], names: Optional[List[str]], year: Optional[str]):
    query = {"status": "Verified"}
    if products:
        clean_products = [p for p in products if p and p != "All" and p != "Products"]
        if clean_products: query["product"] = {"$in": clean_products}
    if names:
        clean_names = [n for n in names if n and n != "All" and n != "Customers"]
        if clean_names: query["name"] = {"$in": clean_names}
    if year and year != "All" and year != "Period":
        try:
            year_int = int(year)
            start_date = datetime(year_int, 1, 1)
            end_date = datetime(year_int + 1, 1, 1)
            query["timestamp"] = {"$gte": start_date, "$lt": end_date}
        except: pass
    return query

@router.get("/filters")
async def get_dashboard_filters(db=Depends(get_db), current_user=Depends(get_current_user)):
    products = await db.transactions.distinct("product", {"status": "Verified"})
    products = sorted([p for p in products if p])
    customers_cursor = db.customers.find({}, {"name": 1}).sort("name", 1)
    customers = await customers_cursor.to_list(length=1000)
    customer_names = [c["name"] for c in customers if c.get("name")]
    pipeline = [{"$project": {"year": {"$year": "$timestamp"}}}, {"$group": {"_id": "$year"}}, {"$sort": {"_id": -1}}]
    year_cursor = db.transactions.aggregate(pipeline)
    years_res = await year_cursor.to_list(length=10)
    years = [str(y["_id"]) for y in years_res if y["_id"]]
    return {"products": products, "customers": customer_names, "years": years if years else [str(datetime.now().year)]}

@router.get("/stats")
async def get_dashboard_stats(product: Optional[List[str]] = Query(None), name: Optional[List[str]] = Query(None), year: Optional[str] = None, db=Depends(get_db), current_user=Depends(get_current_user)):
    query = get_filter_query(product, name, year)
    pipeline = [{"$match": query}, {"$group": {"_id": None, "total_revenue": {"$sum": "$amount"}, "count": {"$sum": 1}}}]
    result_cursor = db.transactions.aggregate(pipeline)
    result = await result_cursor.to_list(length=1)
    stats = result[0] if result else {"total_revenue": 0, "count": 0}
    return {"total_revenue": stats["total_revenue"], "total_transactions": stats["count"], "pending_sync": await db.transactions.count_documents({"status": "Pending"}), "system_health": 99.9, "verified_transactions": stats["count"], "active_licenses": stats["count"] // 5 + 10}

@router.get("/history")
async def get_dashboard_history(
    view_type: str = "monthly", 
    year: Optional[str] = None, 
    product: Optional[List[str]] = Query(None), 
    name: Optional[List[str]] = Query(None), 
    db=Depends(get_db), 
    current_user=Depends(get_current_user)
):
    query = get_filter_query(product, name, year)
    now = datetime.now()
    
    # Apply Time Filtering based on view_type
    if view_type == "daily":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query["timestamp"] = {"$gte": start_date}
    elif view_type == "weekly":
        start_date = now - timedelta(days=now.weekday())
        query["timestamp"] = {"$gte": start_date}
    elif view_type == "monthly":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        query["timestamp"] = {"$gte": start_date}
    elif view_type == "yearly":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        query["timestamp"] = {"$gte": start_date}

    # Group by PRODUCT as requested by the user
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$product",
            "value": {"$sum": "$amount"}
        }},
        {"$sort": {"value": -1}}, # Show highest earners first
        {"$limit": 8} # Keep it neat
    ]
    
    cursor = db.transactions.aggregate(pipeline)
    results = await cursor.to_list(length=8)
    
    return [{"day": str(r["_id"] or "Unknown"), "value": r["value"]} for r in results]

@router.get("/activity")
async def get_dashboard_activity(db=Depends(get_db), current_user=Depends(get_current_user)):
    cursor = db.transactions.find().sort("timestamp", -1).limit(6)
    activities = await cursor.to_list(length=6)
    result = []
    for act in activities:
        result.append({"timestamp": act.get("date") or act["timestamp"].strftime("%d/%m/%y"), "event": f"Billing Logged: {act.get('product', 'Generic Service')}", "status": act.get("status", "Pending").upper(), "user": act.get("name", "Unknown"), "reference": act.get("transaction_id", "TRX-XXXX")})
    return result

@router.get("/top-courses")
async def get_top_courses(product: Optional[List[str]] = Query(None), name: Optional[List[str]] = Query(None), year: Optional[str] = None, db=Depends(get_db), current_user=Depends(get_current_user)):
    query = get_filter_query(product, name, year)
    pipeline = [{"$match": query}, {"$group": {"_id": "$product", "revenue": {"$sum": "$amount"}, "count": {"$sum": 1}}}, {"$sort": {"revenue": -1}}, {"$limit": 6}]
    cursor = db.transactions.aggregate(pipeline)
    courses = await cursor.to_list(length=6)
    result = []
    for course in courses:
        raw_name = course.get("_id") or "Unknown"
        display_name = str(raw_name).strip()
        result.append({"name": display_name if display_name else "Generic", "revenue": course.get("revenue", 0), "count": course.get("count", 0), "initials": "".join([n[0] for n in display_name.split()[:2]]).upper() if display_name else "XX"})
    return result

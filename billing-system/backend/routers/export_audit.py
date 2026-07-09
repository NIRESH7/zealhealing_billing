from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone, timedelta, time
from database import get_db
from auth import get_current_user, get_current_active_admin

router = APIRouter()

def serialize_audit_log(log) -> dict:
    log["id"] = str(log["_id"])
    del log["_id"]
    if isinstance(log.get("exported_at"), datetime):
        log["exported_at"] = log["exported_at"].isoformat()
    return log

@router.get("/logs")
async def get_audit_logs(
    search: Optional[str] = None,
    filter_type: Optional[str] = None, # today, week, month, fy, custom
    custom_start: Optional[str] = None, # YYYY-MM-DD
    custom_end: Optional[str] = None, # YYYY-MM-DD
    db=Depends(get_db),
    current_user=Depends(get_current_active_admin) # Only admin or permitted staff
):
    query = {}
    
    # 1. Date filter boundaries
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
    
    weekday = now.weekday()
    week_start = today_start - timedelta(days=weekday)
    
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    if now.month >= 4:
        fy_start = datetime(now.year, 4, 1, tzinfo=timezone.utc)
    else:
        fy_start = datetime(now.year - 1, 4, 1, tzinfo=timezone.utc)
        
    if filter_type == "today":
        query["exported_at"] = {"$gte": today_start}
    elif filter_type == "week":
        query["exported_at"] = {"$gte": week_start}
    elif filter_type == "month":
        query["exported_at"] = {"$gte": month_start}
    elif filter_type == "fy":
        query["exported_at"] = {"$gte": fy_start}
    elif filter_type == "custom":
        custom_query = {}
        if custom_start:
            try:
                dt_start = datetime.strptime(custom_start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                custom_query["$gte"] = dt_start
            except ValueError:
                pass
        if custom_end:
            try:
                dt_end = datetime.strptime(custom_end, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
                custom_query["$lte"] = dt_end
            except ValueError:
                pass
        if custom_query:
            query["exported_at"] = custom_query

    # 2. Search parameter
    if search:
        search = search.strip()
        date_query = None
        try:
            parsed_date = datetime.strptime(search, "%Y-%m-%d")
            day_start = datetime.combine(parsed_date.date(), time.min, tzinfo=timezone.utc)
            day_end = datetime.combine(parsed_date.date(), time.max, tzinfo=timezone.utc)
            date_query = {"exported_at": {"$gte": day_start, "$lte": day_end}}
        except ValueError:
            pass
            
        if date_query:
            if "exported_at" in query:
                # Merge if filter_type date range is also present
                query["$and"] = [
                    {"exported_at": query["exported_at"]},
                    date_query
                ]
            else:
                query.update(date_query)
        else:
            query["$or"] = [
                {"exported_by": {"$regex": search, "$options": "i"}},
                {"filename": {"$regex": search, "$options": "i"}},
                {"filter_mode": {"$regex": search, "$options": "i"}}
            ]
            
    cursor = db.export_audit_logs.find(query).sort("exported_at", -1)
    logs = await cursor.to_list(length=200)
    return [serialize_audit_log(log) for log in logs]

@router.get("/logs/{log_id}/details")
async def get_audit_log_details(
    log_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_active_admin)
):
    try:
        log = await db.export_audit_logs.find_one({"_id": ObjectId(log_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid log ID format")
        
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
        
    # Reconstruct query from log filter criteria
    query = {}
    
    start_date = log.get("date_range", {}).get("start")
    end_date = log.get("date_range", {}).get("end")
    products = log.get("selected_products", [])
    filter_mode = log.get("filter_mode", "date")
    
    # Date range
    if filter_mode in ("date", "both") and (start_date or end_date):
        date_filter = {}
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                date_filter["$gte"] = start_dt
            except ValueError:
                pass
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
                date_filter["$lte"] = end_dt
            except ValueError:
                pass
        if date_filter:
            query["timestamp"] = date_filter
            
    # Product filter
    if filter_mode in ("product", "both") and products:
        import re
        product_patterns = [{"product": {"$regex": re.escape(p), "$options": "i"}} for p in products]
        if "$or" in query:
            existing_or = query.pop("$or")
            query["$and"] = [{"$or": existing_or}, {"$or": product_patterns}]
        else:
            query["$or"] = product_patterns
            
    cursor = db.transactions.find(query).sort("timestamp", -1)
    transactions = await cursor.to_list(length=1000)
    
    serialized_txs = []
    for tx in transactions:
        serialized_txs.append({
            "id": str(tx["_id"]),
            "invoice_number": tx.get("invoice_number", "N/A"),
            "date": tx.get("date", ""),
            "name": tx.get("name", "N/A"),
            "phone": tx.get("phone", ""),
            "total_amount": float(tx.get("total_amount", 0.0)),
            "paid_amount": float(tx.get("paid_amount", 0.0)),
            "balance": float(tx.get("balance", 0.0)),
            "invoice_items": tx.get("invoice_items", [])
        })
        
    return {
        "log": serialize_audit_log(log),
        "transactions": serialized_txs
    }

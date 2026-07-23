from fastapi import APIRouter, Depends, Query
from database import get_db
from auth import get_current_user
from datetime import datetime, timedelta
from typing import Optional, List
from utils import get_transaction_fy

router = APIRouter()

def get_filter_query(products: Optional[List[str]], names: Optional[List[str]], year: Optional[str], start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {"status": "Verified"}
    if products:
        clean_products = [p for p in products if p and p != "All" and p != "Products"]
        if clean_products: query["invoice_items.name"] = {"$in": clean_products}
    if names:
        clean_names = [n for n in names if n and n != "All" and n != "Customers"]
        if clean_names: query["name"] = {"$in": clean_names}
    
    date_filter = {}
    if start_date:
        try:
            date_filter["$gte"] = datetime.strptime(start_date, "%Y-%m-%d")
        except:
            try:
                date_filter["$gte"] = datetime.fromisoformat(start_date)
            except:
                pass
    if end_date:
        try:
            dt = datetime.strptime(end_date, "%Y-%m-%d")
            date_filter["$lte"] = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        except:
            try:
                date_filter["$lte"] = datetime.fromisoformat(end_date)
            except:
                pass

    if date_filter:
        query["timestamp"] = date_filter
    elif year and year != "All" and year != "Period":
        if "-" in year:
            try:
                parts = year.split("-")
                start_yy = int(parts[0])
                end_yy = int(parts[1])
                # Convert 2-digit years to 4-digit years (assuming 2000s)
                start_year = 2000 + start_yy
                end_year = 2000 + end_yy
                # Financial year starts April 1st of start_year
                start_d = datetime(start_year, 4, 1)
                # Financial year ends March 31st of end_year, so exclusive boundary is April 1st of end_year
                end_d = datetime(end_year, 4, 1)
                query["timestamp"] = {"$gte": start_d, "$lt": end_d}
            except: pass
        else:
            try:
                year_int = int(year)
                start_d = datetime(year_int, 1, 1)
                end_d = datetime(year_int + 1, 1, 1)
                query["timestamp"] = {"$gte": start_d, "$lt": end_d}
            except: pass
    return query

@router.get("/filters")
async def get_dashboard_filters(db=Depends(get_db)):
    products = await db.transactions.distinct("invoice_items.name", {"status": "Verified"})
    products = sorted([p for p in products if p])
    customers_cursor = db.customers.find({}, {"name": 1}).sort("name", 1)
    customers = await customers_cursor.to_list(length=1000)
    customer_names = [c["name"] for c in customers if c.get("name")]
    
    # Aggregate to get distinct months and years to build financial years list dynamically
    pipeline = [
        {"$match": {"status": "Verified", "timestamp": {"$ne": None}}},
        {"$project": {
            "year": {"$year": "$timestamp"},
            "month": {"$month": "$timestamp"}
        }},
        {"$group": {
            "_id": {"year": "$year", "month": "$month"}
        }}
    ]
    year_cursor = db.transactions.aggregate(pipeline)
    years_res = await year_cursor.to_list(length=100)
    fy_set = set()
    for item in years_res:
        g = item["_id"]
        y = g.get("year")
        m = g.get("month")
        if y and m:
            if m >= 4:
                fy = f"{y % 100}-{(y + 1) % 100}"
            else:
                fy = f"{(y - 1) % 100}-{y % 100}"
            fy_set.add(fy)
    years = sorted(list(fy_set), reverse=True)
    
    # Calculate Max Visits for dynamic filter range
    max_visits_res = await db.customers.find_one(sort=[("total_transactions", -1)])
    max_visits = max_visits_res.get("total_transactions", 0) if max_visits_res else 0
    
    return {
        "products": products, 
        "customers": customer_names, 
        "years": years if years else [f"{datetime.now().year % 100}-{(datetime.now().year + 1) % 100}"],
        "max_visits": max_visits
    }

@router.get("/stats")
async def get_dashboard_stats(product: Optional[List[str]] = Query(None), name: Optional[List[str]] = Query(None), year: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, db=Depends(get_db), current_user=Depends(get_current_user)):
    query = get_filter_query(product, name, year, start_date, end_date)
    
    # Check if any filter is active
    is_filtered = bool(product or name or (year and year != "All") or start_date or end_date)
    
    kpi_query = dict(query)
    if not is_filtered:
        # Default to current month in IST (+05:30)
        now_utc = datetime.utcnow()
        now_ist = now_utc + timedelta(hours=5, minutes=30)
        ist_year = now_ist.year
        ist_month = now_ist.month
        
        # Calculate boundaries of current month in IST, translated back to UTC
        start_ist = datetime(ist_year, ist_month, 1, 0, 0, 0)
        utc_start = start_ist - timedelta(hours=5, minutes=30)
        
        if ist_month == 12:
            next_ist = datetime(ist_year + 1, 1, 1, 0, 0, 0)
        else:
            next_ist = datetime(ist_year, ist_month + 1, 1, 0, 0, 0)
        utc_next = next_ist - timedelta(hours=5, minutes=30)
        
        kpi_query["timestamp"] = {"$gte": utc_start, "$lt": utc_next}

    clean_products = []
    if product:
        clean_products = [p for p in product if p and p != "All" and p != "Products"]

    if clean_products:
        pipeline = [
            {"$match": kpi_query},
            {"$unwind": "$invoice_items"},
            {"$match": {"invoice_items.name": {"$in": clean_products}}},
            {"$group": {
                "_id": "$_id",
                "tx_revenue": {"$sum": "$invoice_items.total"},
                "total_amount": {"$first": "$total_amount"},
                "paid_amount": {"$first": "$paid_amount"},
                "balance": {"$first": "$balance"}
            }},
            {"$project": {
                "tx_revenue": 1,
                "tx_collected": {
                    "$cond": [
                        {"$gt": ["$total_amount", 0]},
                        {"$multiply": [
                            "$tx_revenue",
                            {"$divide": [{"$ifNull": ["$paid_amount", 0]}, "$total_amount"]}
                        ]},
                        0
                    ]
                },
                "tx_balance": {
                    "$cond": [
                        {"$gt": ["$total_amount", 0]},
                        {"$multiply": [
                            "$tx_revenue",
                            {"$divide": [{"$ifNull": ["$balance", 0]}, "$total_amount"]}
                        ]},
                        0
                    ]
                }
            }},
            {"$group": {
                "_id": None,
                "total_revenue": {"$sum": "$tx_revenue"},
                "total_collected": {"$sum": "$tx_collected"},
                "total_balance": {"$sum": "$tx_balance"},
                "count": {"$sum": 1}
            }}
        ]
    else:
        pipeline = [
            {"$match": kpi_query}, 
            {"$group": {
                "_id": None, 
                "total_revenue": {"$sum": "$total_amount"}, 
                "total_collected": {"$sum": "$paid_amount"},
                "total_balance": {"$sum": "$balance"},
                "count": {"$sum": 1}
            }}
        ]
        
    result_cursor = db.transactions.aggregate(pipeline)
    result = await result_cursor.to_list(length=1)
    stats = result[0] if result else {"total_revenue": 0, "total_collected": 0, "total_balance": 0, "count": 0}
    
    # Safe match query for year-month-day-week projection (excluding null/missing timestamps)
    breakdown_match = dict(query)
    breakdown_match["timestamp"] = {"$ne": None}
    
    if clean_products:
        breakdown_pipeline = [
            {"$match": breakdown_match},
            {"$unwind": "$invoice_items"},
            {"$match": {"invoice_items.name": {"$in": clean_products}}},
            {"$project": {
                "year": {"$year": {"date": "$timestamp", "timezone": "+05:30"}},
                "month": {"$month": {"date": "$timestamp", "timezone": "+05:30"}},
                "day": {"$dayOfMonth": {"date": "$timestamp", "timezone": "+05:30"}},
                "week": {"$isoWeek": {"date": "$timestamp", "timezone": "+05:30"}},
                "item_total": "$invoice_items.total"
            }},
            {"$group": {
                "_id": {
                    "year": "$year", 
                    "month": "$month", 
                    "day": "$day",
                    "week": "$week"
                },
                "revenue": {"$sum": "$item_total"}
            }}
        ]
    else:
        breakdown_pipeline = [
            {"$match": breakdown_match},
            {"$project": {
                "year": {"$year": {"date": "$timestamp", "timezone": "+05:30"}},
                "month": {"$month": {"date": "$timestamp", "timezone": "+05:30"}},
                "day": {"$dayOfMonth": {"date": "$timestamp", "timezone": "+05:30"}},
                "week": {"$isoWeek": {"date": "$timestamp", "timezone": "+05:30"}},
                "total_amount": 1
            }},
            {"$group": {
                "_id": {
                    "year": "$year", 
                    "month": "$month", 
                    "day": "$day",
                    "week": "$week"
                },
                "revenue": {"$sum": "$total_amount"}
            }}
        ]
    breakdown_cursor = db.transactions.aggregate(breakdown_pipeline)
    breakdown_res = await breakdown_cursor.to_list(length=1000)

    # Process Month-wise, Financial Year-wise, Week-wise, and Day-wise revenue
    MONTH_NAMES = {
        1: "January", 2: "February", 3: "March", 4: "April",
        5: "May", 6: "June", 7: "July", 8: "August",
        9: "September", 10: "October", 11: "November", 12: "December"
    }
    month_revenue_map = {}
    fy_revenue_map = {}
    week_revenue_map = {}
    day_revenue_map = {}

    for item in breakdown_res:
        g = item["_id"]
        y = g.get("year")
        m = g.get("month")
        d = g.get("day")
        w = g.get("week")
        rev = item.get("revenue", 0.0)
        
        if y and m and d:
            ym_key = (y, m)
            month_revenue_map[ym_key] = month_revenue_map.get(ym_key, 0.0) + rev
            
            # Existing financial year logic:
            if m >= 4:
                fy = f"{y % 100}-{(y + 1) % 100}"
            else:
                fy = f"{(y - 1) % 100}-{y % 100}"
            fy_revenue_map[fy] = fy_revenue_map.get(fy, 0.0) + rev
            
            # Week-wise
            week_key = (y, w) if w is not None else (y, 0)
            week_revenue_map[week_key] = week_revenue_map.get(week_key, 0.0) + rev
            
            # Day-wise
            day_key = (y, m, d)
            day_revenue_map[day_key] = day_revenue_map.get(day_key, 0.0) + rev

    # Sort Month-wise revenue by Year (Descending) -> Month (Descending)
    sorted_month_years = sorted(month_revenue_map.keys(), reverse=True)
    month_wise = []
    for (y, m) in sorted_month_years:
        month_wise.append({
            "month": f"{MONTH_NAMES[m]} {y}",
            "revenue": month_revenue_map[(y, m)]
        })

    fy_wise = []
    sorted_fys = sorted(list(fy_revenue_map.keys()))
    for fy in sorted_fys:
        fy_wise.append({
            "fy": f"FY {fy}",
            "revenue": fy_revenue_map[fy]
        })

    week_wise = []
    sorted_weeks = sorted(list(week_revenue_map.keys()), reverse=True)
    for wk in sorted_weeks:
        wy, ww = wk
        week_wise.append({
            "week": f"Week {ww}, {wy}",
            "revenue": week_revenue_map[wk]
        })

    day_wise = []
    sorted_days = sorted(list(day_revenue_map.keys()), reverse=True)
    for dy in sorted_days:
        dy_y, dy_m, dy_d = dy
        month_abbr = MONTH_NAMES[dy_m][:3]
        date_str = f"{dy_d:02d} {month_abbr} {dy_y}"
        day_wise.append({
            "date": date_str,
            "revenue": day_revenue_map[dy]
        })

    return {
        "total_revenue": stats["total_revenue"], 
        "total_collected": stats["total_collected"],
        "total_balance": stats["total_balance"],
        "total_transactions": stats["count"], 
        "pending_sync": await db.transactions.count_documents({"status": "Pending"}), 
        "system_health": 99.9, 
        "verified_transactions": stats["count"], 
        "active_licenses": stats["count"] // 5 + 10,
        "month_wise_revenue": month_wise,
        "fy_wise_revenue": fy_wise,
        "week_wise_revenue": week_wise,
        "day_wise_revenue": day_wise
    }


@router.get("/history")
async def get_dashboard_history(
    view_type: str = "monthly", 
    year: Optional[str] = None, 
    product: Optional[List[str]] = Query(None), 
    name: Optional[List[str]] = Query(None), 
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db=Depends(get_db), 
    current_user=Depends(get_current_user)
):
    query = get_filter_query(product, name, year, start_date, end_date)
    
    # Use current time in IST (+05:30)
    now_utc = datetime.utcnow()
    now = now_utc + timedelta(hours=5, minutes=30)
    
    # Apply Time Filtering based on view_type only if custom date filter and Financial Year filter are not present
    if not start_date and not end_date and (not year or year == "All"):
        if view_type == "daily":
            start_d = now.replace(hour=0, minute=0, second=0, microsecond=0)
            start_d_utc = start_d - timedelta(hours=5, minutes=30)
            query["timestamp"] = {"$gte": start_d_utc}
        elif view_type == "weekly":
            start_d = now - timedelta(days=now.weekday())
            start_d = start_d.replace(hour=0, minute=0, second=0, microsecond=0)
            start_d_utc = start_d - timedelta(hours=5, minutes=30)
            query["timestamp"] = {"$gte": start_d_utc}
        elif view_type == "monthly":
            start_d = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            start_d_utc = start_d - timedelta(hours=5, minutes=30)
            query["timestamp"] = {"$gte": start_d_utc}
        elif view_type == "yearly":
            start_d = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            start_d_utc = start_d - timedelta(hours=5, minutes=30)
            query["timestamp"] = {"$gte": start_d_utc}

    pipeline = [
        {"$match": query},
        {"$unwind": "$invoice_items"},
    ]
    
    if product:
        clean_products = [p for p in product if p and p != "All"]
        if clean_products:
            pipeline.append({"$match": {"invoice_items.name": {"$in": clean_products}}})

    # Project date intervals in IST timezone
    pipeline.append({
        "$project": {
            "year": {"$year": {"date": "$timestamp", "timezone": "+05:30"}},
            "month": {"$month": {"date": "$timestamp", "timezone": "+05:30"}},
            "day": {"$dayOfMonth": {"date": "$timestamp", "timezone": "+05:30"}},
            "week": {"$isoWeek": {"date": "$timestamp", "timezone": "+05:30"}},
            "item_total": "$invoice_items.total"
        }
    })

    # Group dynamically based on view_type
    if view_type == "daily":
        pipeline.extend([
            {"$group": {
                "_id": {
                    "year": "$year",
                    "month": "$month",
                    "day": "$day"
                },
                "value": {"$sum": "$item_total"}
            }},
            {"$sort": {"_id.year": -1, "_id.month": -1, "_id.day": -1}}
        ])
    elif view_type == "weekly":
        pipeline.extend([
            {"$group": {
                "_id": {
                    "year": "$year",
                    "week": "$week"
                },
                "value": {"$sum": "$item_total"}
            }},
            {"$sort": {"_id.year": -1, "_id.week": -1}}
        ])
    elif view_type == "monthly":
        pipeline.extend([
            {"$group": {
                "_id": {
                    "year": "$year",
                    "month": "$month"
                },
                "value": {"$sum": "$item_total"}
            }},
            {"$sort": {"_id.year": -1, "_id.month": -1}}
        ])
    elif view_type == "yearly":
        pipeline.extend([
            {"$group": {
                "_id": "$year",
                "value": {"$sum": "$item_total"}
            }},
            {"$sort": {"_id": -1}}
        ])

    pipeline.append({"$limit": 8})

    cursor = db.transactions.aggregate(pipeline)
    results = await cursor.to_list(length=8)

    MONTH_NAMES = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
        5: "May", 6: "Jun", 7: "Jul", 8: "Aug",
        9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
    }

    formatted_results = []
    for r in results:
        g = r["_id"]
        val = r["value"]
        if view_type == "daily":
            y = g.get("year")
            m = g.get("month")
            d = g.get("day")
            day_label = f"{d:02d} {MONTH_NAMES[m]} {y}" if (y and m and d) else "Unknown"
        elif view_type == "weekly":
            y = g.get("year")
            w = g.get("week")
            day_label = f"W{w}, {y}" if (y and w) else "Unknown"
        elif view_type == "monthly":
            y = g.get("year")
            m = g.get("month")
            day_label = f"{MONTH_NAMES[m]} {y}" if (y and m) else "Unknown"
        elif view_type == "yearly":
            day_label = str(g) if g else "Unknown"
        else:
            day_label = str(g or "Unknown")

        formatted_results.append({
            "day": day_label,
            "value": val
        })

    # Return chronological oldest to newest (by reversing descending order)
    formatted_results.reverse()
    return formatted_results

@router.get("/activity")
async def get_dashboard_activity(
    product: Optional[List[str]] = Query(None),
    name: Optional[List[str]] = Query(None),
    year: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = get_filter_query(product, name, year, start_date, end_date)
    cursor = db.transactions.find(query).sort("timestamp", -1).limit(6)
    activities = await cursor.to_list(length=6)
    result = []
    for act in activities:
        fy = get_transaction_fy(act)
        inv_num = act.get("invoice_number", act.get("transaction_id", "")[:6])
        ref_label = f"ZH/FY{fy}/{inv_num}" if inv_num else act.get("transaction_id", "TRX-XXXX")
        result.append({
            "timestamp": act.get("date") or act["timestamp"].strftime("%d/%m/%y"),
            "event": f"Billing Logged: {act.get('product', 'Generic Service')}",
            "status": act.get("status", "Pending").upper(),
            "user": act.get("name", "Unknown"),
            "reference": ref_label
        })
    return result

@router.get("/top-courses")
async def get_top_courses(product: Optional[List[str]] = Query(None), name: Optional[List[str]] = Query(None), year: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, db=Depends(get_db), current_user=Depends(get_current_user)):
    query = get_filter_query(product, name, year, start_date, end_date)
    pipeline = [
        {"$match": query},
        {"$unwind": "$invoice_items"},
    ]
    
    # If filtering by specific products, ensure we only aggregate those after unwinding
    if product:
        clean_products = [p for p in product if p and p != "All"]
        if clean_products:
            pipeline.append({"$match": {"invoice_items.name": {"$in": clean_products}}})

    pipeline.extend([
        {"$group": {
            "_id": "$invoice_items.name", 
            "revenue": {"$sum": "$invoice_items.total"}, 
            "count": {"$sum": "$invoice_items.qty"}
        }}, 
        {"$sort": {"revenue": -1}}, 
        {"$limit": 6}
    ])
    cursor = db.transactions.aggregate(pipeline)
    courses = await cursor.to_list(length=6)
    result = []
    for course in courses:
        raw_name = course.get("_id") or "Unknown"
        display_name = str(raw_name).strip().title()
        result.append({
            "name": display_name if display_name else "Generic", 
            "revenue": course.get("revenue", 0), 
            "count": int(course.get("count", 0)), 
            "initials": "".join([n[0] for n in display_name.split()[:2]]).upper() if display_name else "XX"
        })
    return result

@router.get("/top-customers")
async def get_top_customers(
    product: Optional[List[str]] = Query(None),
    name: Optional[List[str]] = Query(None),
    year: Optional[str] = None,
    min_visits: Optional[int] = Query(None),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get top customers with dynamic filtering by product, name, and year."""
    query = get_filter_query(product, name, year, start_date, end_date)
    
    # Aggregate transactions to get counts and revenue per customer within the filtered set.
    # We normalize the phone by trimming whitespace and use upper-cased name as
    # a fallback key when the phone is null/empty so that the same real-world
    # customer is never split across multiple buckets.
    clean_products = []
    if product:
        clean_products = [p for p in product if p and p != "All" and p != "Products"]

    if clean_products:
        pipeline = [
            {"$match": query},
            {"$unwind": "$invoice_items"},
            {"$match": {"invoice_items.name": {"$in": clean_products}}},
            {"$group": {
                "_id": "$_id",
                "phone": {"$first": "$phone"},
                "name": {"$first": "$name"},
                "tx_revenue": {"$sum": "$invoice_items.total"}
            }},
            {"$addFields": {
                "_norm_phone": {"$trim": {"input": {"$ifNull": ["$phone", ""]}}},
                "_norm_name": {"$toUpper": {"$trim": {"input": {"$ifNull": ["$name", "Unknown"]}}}}
            }},
            {"$addFields": {
                "_group_key": {
                    "$cond": {
                        "if": {"$eq": ["$_norm_phone", ""]},
                        "then": "$_norm_name",
                        "else": "$_norm_phone"
                    }
                }
            }},
            {"$group": {
                "_id": "$_group_key",
                "name": {"$first": "$name"},
                "phone": {"$first": "$phone"},
                "count": {"$sum": 1},
                "revenue": {"$sum": "$tx_revenue"}
            }}
        ]
    else:
        pipeline = [
            {"$match": query},
            {"$addFields": {
                "_norm_phone": {"$trim": {"input": {"$ifNull": ["$phone", ""]}}},
                "_norm_name": {"$toUpper": {"$trim": {"input": {"$ifNull": ["$name", "Unknown"]}}}}
            }},
            {"$addFields": {
                "_group_key": {
                    "$cond": {
                        "if": {"$eq": ["$_norm_phone", ""]},
                        "then": "$_norm_name",
                        "else": "$_norm_phone"
                    }
                }
            }},
            {"$group": {
                "_id": "$_group_key",
                "name": {"$first": "$name"},
                "phone": {"$first": "$phone"},
                "count": {"$sum": 1},
                "revenue": {"$sum": "$total_amount"}
            }}
        ]
    
    # Apply exact visit-count filter AFTER grouping
    if min_visits is not None and min_visits > 0:
        pipeline.append({"$match": {"count": {"$eq": min_visits}}})
    
    # Sort by visit frequency, then revenue
    pipeline.extend([
        {"$sort": {"count": -1, "revenue": -1}},
        {"$limit": 6}
    ])
    
    cursor = db.transactions.aggregate(pipeline)
    customers = await cursor.to_list(length=6)
    
    result = []
    for c in customers:
        display_name = c.get("name", "Unknown")
        result.append({
            "name": display_name,
            "phone": c.get("phone", "N/A"),
            "count": c.get("count", 0),
            "revenue": c.get("revenue", 0),
            "initials": "".join([n[0] for n in display_name.split()[:2]]).upper() if display_name else "UU"
        })
    return result


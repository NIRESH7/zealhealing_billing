import io
import os
import re
import uuid
import random
import asyncio
from typing import List
from datetime import datetime
from decimal import Decimal
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from database import get_db
from models import TransactionCreate
from auth import get_current_user
from utils import generate_invoice_pdf, send_whatsapp_invoice
from ai_utils import get_smart_product_match
import openpyxl
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from zipfile import ZipFile
import traceback

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/manual")
async def create_transaction_manual(transaction: TransactionCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    tx_dict = transaction.model_dump()
    
    # If it's a single product manual entry, structure it for generate_invoice_pdf
    if not tx_dict.get("invoice_items"):
        # CASE-INSENSITIVE MATCH
        product = await db.products.find_one({"name": {"$regex": f"^{re.escape(tx_dict['product'])}$", "$options": "i"}})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product '{tx_dict['product']}' (Case Insensitive) not found.")
        
        location = tx_dict.get("location", "India")
        price = Decimal(str(product["price_india"] if location == "India" else product["price_abroad"]))
        if price <= 0:
            raise HTTPException(status_code=400, detail=f"Product '{tx_dict['product']}' has 0 price. Blocked.")
        
        gst_rate = Decimal(str(product["gst_rate"] if location == "India" else 0))
        
        qty = Decimal("1")
        item_subtotal = price * qty
        gst_amount = item_subtotal * gst_rate / 100
        item_total = item_subtotal + gst_amount
        
        tx_dict["invoice_items"] = [{
            "name": product["name"],
            "qty": int(qty),
            "price": float(price),
            "gst_rate": float(gst_rate),
            "gst_amount": float(gst_amount),
            "total": float(item_total),
            "hsn": product.get("hsn_code", "9983")
        }]
        tx_dict["gst_breakdown"] = [{
            "rate": float(gst_rate),
            "cgst": float(gst_amount/2),
            "sgst": float(gst_amount/2),
            "total": float(gst_amount)
        }]
        tx_dict["amount"] = float(item_subtotal)
        tx_dict["gst_total"] = float(gst_amount)
        tx_dict["total_amount"] = float(item_total)
    
    tx_dict["status"] = "Pending"
    tx_dict["timestamp"] = datetime.utcnow()
    tx_dict["added_by"] = current_user["username"]
    
    # Normalize and Update Customer
    normalized_name = tx_dict["name"].strip()
    await db.customers.update_one(
        {"phone": tx_dict["phone"], "name": {"$regex": f"^{re.escape(normalized_name)}$", "$options": "i"}},
        {"$set": {"name": normalized_name}, "$inc": {"total_spent": tx_dict["amount"], "total_transactions": 1}},
        upsert=True
    )
    
    result = await db.transactions.insert_one(tx_dict)
    tx_dict["id"] = str(result.inserted_id)
    
    # Generate Invoice immediately
    invoice_url = generate_invoice_pdf(tx_dict)
    await db.transactions.update_one({"_id": result.inserted_id}, {"$set": {"invoice_url": invoice_url}})
    tx_dict["invoice_url"] = invoice_url
    
    if "_id" in tx_dict:
        del tx_dict["_id"]
    return tx_dict

async def get_next_sequence(db, name):
    """Get next sequence value for a counter (sequential IDs)"""
    counter = await db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=True
    )
    return counter["sequence_value"]

@router.post("/upload")
async def upload_transactions(file: UploadFile = File(...), db=Depends(get_db), current_user=Depends(get_current_user)):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    contents = await file.read()
    try:
        wb = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        
        all_transactions = []
        batch_id = str(uuid.uuid4())
        
        for sheet in wb.worksheets:
            rows = list(sheet.iter_rows(values_only=False))
            if not rows: continue
            
            # Check for New Format headers
            # 1. Normalize Headers (Strip spaces and lower case)
            header_vals = [str(c.value).lower().strip() if c.value else "" for c in rows[0]]
            
            # Robust mapping
            def find_idx(possible_names, default=-1):
                for name in possible_names:
                    if name.lower().strip() in header_vals:
                        return header_vals.index(name.lower().strip())
                return default

            col_map = {
                "date": find_idx(["date", "billing date", "time"], 0),
                "name": find_idx(["name", "customer", "customer name"], 1),
                "phone": find_idx(["phone", "contact", "contact no", "mobile"], 2),
                "transaction_id": find_idx(["txn id", "transaction id", "transaction_id", "ref id", "gpay id"], 3),
                "amount": find_idx(["amount", "total", "price", "paid", "paid amount", "received"], 4),
                "items": find_idx(["details", "product", "items"], 5),
                "location": find_idx(["location", "region"], -1),
                "shipping": find_idx(["shipping", "delivery"], -1)
            }

            is_new_format = col_map["location"] != -1 and "items" in header_vals
            
            # Detect start_idx (Skip headers)
            start_idx = 1
            for i, row in enumerate(rows):
                # If this row looks like a header (contains "name" or "phone" in actual value)
                row_vals = [str(c.value).lower() if c.value else "" for c in row]
                if any(x in row_vals for x in ["name", "phone", "contact", "customer", "txn id"]):
                    start_idx = i + 1
                    break

            current_date = "-" 
            
            # Cache product names for AI matching (OPTIMIZED: Outside row loop)
            cursor_p = db.products.find({}, {"name": 1})
            all_product_names = [p["name"] for p in await cursor_p.to_list(length=1000)]
            
            for row in rows[start_idx:]:
                if not any(c.value for c in row): continue 
                
                # 1. Capture Sticky Date
                d_val = row[col_map["date"]].value if col_map["date"] < len(row) else None
                if d_val:
                    if hasattr(d_val, "strftime"):
                        current_date = d_val.strftime('%d/%m/%y')
                    else:
                        d_str = str(d_val).strip()
                        # Match 01/01/2024 or 2024-01-01
                        if re.match(r'^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', d_str) or re.match(r'^\d{4}[/-]\d{1,2}[/-]\d{1,2}', d_str):
                            current_date = d_str
                        elif len(d_str) > 5: # Fallback for other date strings
                            current_date = d_str[:15]

                # 2. Extract Identity
                raw_name = str(row[col_map["name"]].value if len(row) > col_map["name"] else "").strip()
                raw_phone = str(row[col_map["phone"]].value if len(row) > col_map["phone"] else "").strip()
                raw_tx_id = str(row[col_map["transaction_id"]].value if len(row) > col_map["transaction_id"] else "").strip()
                raw_excel_amount = row[col_map["amount"]].value if col_map["amount"] != -1 and len(row) > col_map["amount"] else None
                
                if not raw_name or raw_name.lower() in ["none", "nan", "total", "customer name"]: continue
                
                phone = "".join(re.findall(r'\d+', raw_phone))
                if len(phone) > 12: phone = phone[:12]
                if not phone: continue

                # 3. Handle Product & Pricing Logic (USER Logic Implementation)
                items_str = ""
                location = "India"
                shipping = 0
                
                if is_new_format:
                    location = str(row[col_map["location"]].value or "India").strip().capitalize()
                    items_str = str(row[col_map["items"]].value or "").strip()
                    shipping = float(row[col_map["shipping"]].value or 0) if col_map["shipping"] != -1 else 0
                else:
                    # Old Format fallback
                    items_str = str(row[col_map["items"]].value or "").strip()
                    location = "India"
                    shipping = 0

                # --- Calculation Engine (Decimal High Precision) ---
                parsed_items = []
                for part in items_str.split(","):
                    part = part.strip()
                    if not part: continue
                    match = re.match(r"(.*)\((\d+)\)", part)
                    if match:
                        name = match.group(1).strip()
                        qty = Decimal(match.group(2))
                        parsed_items.append((name, qty))
                    else:
                        parsed_items.append((part, Decimal("1")))

                invoice_items_details = []
                subtotal = Decimal("0")
                total_gst = Decimal("0")
                gst_summary = {} 


                for item_name, qty in parsed_items:
                    # 1. Try Exact/Case-Insensitive Match
                    clean_item_name = " ".join(item_name.split()).strip()
                    product = await db.products.find_one({"name": {"$regex": f"^{re.escape(clean_item_name)}$", "$options": "i"}})
                    
                    if not product:
                        # 2. SMART AI FALLBACK
                        suggested_name = await get_smart_product_match(clean_item_name, all_product_names)
                        if suggested_name:
                            product = await db.products.find_one({"name": suggested_name})
                    
                    if not product:
                        # Final attempt: search for the name inside the product name or vice versa (relaxed)
                        product = await db.products.find_one({"name": {"$regex": re.escape(clean_item_name), "$options": "i"}})
                    
                    if not product:
                        raise HTTPException(status_code=400, detail=f"Product '{item_name}' not found. Please ensure it exists in the Products database.")
                    
                    price = Decimal(str(product["price_india"] if location == "India" else product["price_abroad"]))
                    gst_rate = Decimal(str(product["gst_rate"] if location == "India" else 0))
                    
                    # Rounding each step
                    # PREFER EXCEL AMOUNT IF SINGLE ITEM (Legacy logic check)
                    # If the user specifically wants the Excel amount to override the DB total for single items:
                    # (Currently commented out to follow Turn 4 rule: ALWAYS USE OFFICIAL PRICE)
                    # if raw_excel_amount and len(parsed_items) == 1:
                    #     try:
                    #         item_total = Decimal(str(raw_excel_amount)).quantize(Decimal("0.01"))
                    #         item_subtotal = (item_total / (1 + gst_rate/100)).quantize(Decimal("0.01"))
                    #         gst_amount = item_total - item_subtotal
                    #         price = (item_subtotal / qty).quantize(Decimal("0.01"))
                    #     except:
                    #         item_subtotal = (price * qty).quantize(Decimal("0.01"))
                    #         gst_amount = (item_subtotal * gst_rate / 100).quantize(Decimal("0.01"))
                    # else:
                    
                    item_subtotal = (price * qty).quantize(Decimal("0.01"))
                    gst_amount = (item_subtotal * gst_rate / 100).quantize(Decimal("0.01"))
                    
                    item_total = item_subtotal + gst_amount
                    
                    subtotal += item_subtotal
                    total_gst += gst_amount
                    
                    # Grouping
                    gst_key = float(gst_rate)
                    gst_summary[gst_key] = gst_summary.get(gst_key, 0) + float(gst_amount)
                    
                    invoice_items_details.append({
                        "name": product["name"],
                        "qty": int(qty),
                        "price": float(price),
                        "gst_rate": float(gst_rate),
                        "gst_amount": float(gst_amount),
                        "total": float(item_total.quantize(Decimal("0.01"))),
                        "hsn": product.get("hsn_code", product.get("hsn", "9983"))
                    })

                grand_total = subtotal + total_gst + Decimal(str(shipping)).quantize(Decimal("0.01"))
                
                gst_breakdown = []
                for rate, val in gst_summary.items():
                    gst_breakdown.append({
                        "rate": rate,
                        "cgst": val / 2,
                        "sgst": val / 2,
                        "total": val
                    })

                # Clean Transaction ID
                first_id = raw_tx_id.split("\n")[0].split("\r")[0].strip()
                clean_tx_id = "".join([c if c.isalnum() else "_" for c in first_id]).upper()[:30]
                if not clean_tx_id or clean_tx_id.lower() in ["nan", "total"]: continue

                # Check if this exact transaction (ID + Customer) already exists to avoid duplicates
                existing = await db.transactions.find_one({
                    "transaction_id": clean_tx_id, 
                    "name": raw_name
                })
                if existing: continue

                # Get Sequential Invoice Number
                invoice_num = await get_next_sequence(db, "invoice_number")

                # Calculate Balance (Official Total - Excel Paid Amount)
                paid_val = None
                balance = None
                if raw_excel_amount is not None and str(raw_excel_amount).strip() != "":
                    try:
                        clean_amt_str = re.sub(r'[^\d.]', '', str(raw_excel_amount))
                        if clean_amt_str:
                            paid_val_dec = Decimal(clean_amt_str).quantize(Decimal("0.01"))
                            paid_val = float(paid_val_dec)
                            bal = float(grand_total - paid_val_dec)
                            # Only show positive balance (pending amount); negative means overpaid/tax-included
                            balance = bal if bal > 0 else None
                    except Exception:
                        pass

                # 4. Build Record
                tx_obj = {
                    "name": raw_name,
                    "phone": phone,
                    "transaction_id": clean_tx_id,
                    "amount": float(subtotal), 
                    "product": items_str, 
                    "date": current_date, 
                    "location": location,
                    "invoice_items": invoice_items_details,
                    "gst_breakdown": gst_breakdown,
                    "shipping": float(shipping),
                    "gst_total": float(total_gst),
                    "total_amount": float(grand_total),
                    "paid_amount": paid_val,
                    "balance": balance,
                    "status": "Verified",
                    "timestamp": datetime.utcnow(),
                    "invoice_number": invoice_num,
                    "added_by": current_user["username"],
                    "batch_id": batch_id
                }
                all_transactions.append(tx_obj)

        if all_transactions:
            result = await db.transactions.insert_many(all_transactions)
            for i, tx in enumerate(all_transactions):
                tx["_id"] = result.inserted_ids[i]
                # Normalize and Update Customer
                normalized_name = tx["name"].strip()
                await db.customers.update_one(
                    {"phone": tx["phone"], "name": {"$regex": f"^{re.escape(normalized_name)}$", "$options": "i"}},
                    {"$set": {"name": normalized_name}, "$inc": {"total_spent": tx["amount"], "total_transactions": 1}},
                    upsert=True
                )
                invoice_url = generate_invoice_pdf(tx)
                await db.transactions.update_one({"_id": tx["_id"]}, {"$set": {"invoice_url": invoice_url}})

        return {"message": f"Processed {len(all_transactions)} transactions", "batch_id": batch_id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_transactions(skip: int = 0, limit: int = 50, status: str = None, search: str = None, latest_batch_only: bool = False, db=Depends(get_db), current_user=Depends(get_current_user)):
    query = {}
    if status and status != "All": query["status"] = status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"transaction_id": {"$regex": search, "$options": "i"}},
            {"product": {"$regex": search, "$options": "i"}}
        ]
    if latest_batch_only:
        latest = await db.transactions.find_one(sort=[("timestamp", -1)])
        if latest: query["batch_id"] = latest.get("batch_id")
            
    cursor = db.transactions.find(query).sort([("timestamp", -1)]).skip(skip).limit(limit)
    transactions = await cursor.to_list(length=limit)
    
    serialized = []
    for tx in transactions:
        tx["id"] = str(tx["_id"])
        del tx["_id"]
        if "timestamp" in tx and hasattr(tx["timestamp"], "isoformat"):
            tx["timestamp"] = tx["timestamp"].isoformat()
        serialized.append(tx)
        
    total = await db.transactions.count_documents(query)
    return {"total": total, "items": serialized}

@router.delete("/{tx_id}")
async def delete_transaction(tx_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if tx:
        await db.customers.update_one(
            {"phone": tx["phone"]},
            {"$inc": {"total_spent": -tx["amount"], "total_transactions": -1}}
        )
        await db.customers.delete_many({"total_transactions": {"$lte": 0}})
        await db.transactions.delete_one({"_id": ObjectId(tx_id)})
    return {"message": "Deleted"}

@router.put("/{tx_id}")
async def update_transaction(tx_id: str, payload: dict, db=Depends(get_db), current_user=Depends(get_current_user)):
    # Update transaction details
    # Note: This is a simple update, we don't recalculate GST here to allow manual overrides if needed
    update_data = {k: v for k, v in payload.items() if k not in ["_id", "id", "added_by", "timestamp"]}
    result = await db.transactions.update_one({"_id": ObjectId(tx_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Updated"}

@router.post("/bulk-delete")
async def bulk_delete(payload: dict, db=Depends(get_db), current_user=Depends(get_current_user)):
    is_delete_all = payload.get("deleteAll", False)
    
    if is_delete_all:
        await db.transactions.delete_many({})
        await db.customers.delete_many({})
        await db.whatsapp_batches.delete_many({})
        return {"message": "Database wiped clean."}
    else:
        ids_raw = payload.get("ids", [])
        if not ids_raw:
            return {"message": "No IDs provided"}
            
        ids = [ObjectId(i) for i in ids_raw]
        cursor = db.transactions.find({"_id": {"$in": ids}})
        transactions_to_delete = await cursor.to_list(length=len(ids))
        
        for tx in transactions_to_delete:
            phone = tx.get("phone")
            amount = tx.get("amount", 0)
            if phone:
                await db.customers.update_one(
                    {"phone": phone},
                    {"$inc": {"total_spent": -amount, "total_transactions": -1}}
                )
        
        await db.customers.delete_many({"total_transactions": {"$lte": 0}})
        await db.transactions.delete_many({"_id": {"$in": ids}})
        return {"message": f"Deleted {len(ids)} transactions."}

@router.post("/{tx_id}/generate-invoice")
async def create_invoice(tx_id: str, db=Depends(get_db)):
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    try:
        url = generate_invoice_pdf(tx)
        await db.transactions.update_one({"_id": ObjectId(tx_id)}, {"$set": {"invoice_url": url}})
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{tx_id}/send-whatsapp")
async def send_whatsapp(tx_id: str, db=Depends(get_db)):
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    return send_whatsapp_invoice(tx["phone"], tx["invoice_url"])

async def process_bulk_whatsapp(batch_id: str, ids: List[str], db):
    await db.whatsapp_batches.update_one(
        {"batch_id": batch_id},
        {"$set": {"status": "processing", "total": len(ids), "processed": 0}}
    )

    for i, tx_id in enumerate(ids):
        try:
            tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
            if not tx: continue
            
            await db.whatsapp_batches.update_one(
                {"batch_id": batch_id, "items.tx_id": tx_id},
                {"$set": {"items.$.status": "sending"}}
            )

            invoice_url = tx.get("invoice_url")
            if not invoice_url:
                invoice_url = generate_invoice_pdf(tx)
                await db.transactions.update_one({"_id": ObjectId(tx_id)}, {"$set": {"invoice_url": invoice_url}})
            
            send_whatsapp_invoice(tx["phone"], invoice_url)
            
            await db.whatsapp_batches.update_one(
                {"batch_id": batch_id, "items.tx_id": tx_id},
                {"$set": {"items.$.status": "sent", "items.$.sent_at": datetime.utcnow()}}
            )
            await db.whatsapp_batches.update_one({"batch_id": batch_id}, {"$inc": {"processed": 1}})
            
            if i < len(ids) - 1:
                await asyncio.sleep(random.uniform(30, 50))
                
        except Exception as e:
            await db.whatsapp_batches.update_one(
                {"batch_id": batch_id, "items.tx_id": tx_id},
                {"$set": {"items.$.status": "error", "items.$.error": str(e)}}
            )

    await db.whatsapp_batches.update_one({"batch_id": batch_id}, {"$set": {"status": "completed", "completed_at": datetime.utcnow()}})

@router.post("/bulk-whatsapp")
async def bulk_send_whatsapp(payload: dict, background_tasks: BackgroundTasks, db=Depends(get_db)):
    ids = payload.get("ids", [])
    batch_id = str(uuid.uuid4())
    
    batch_items = []
    for tx_id in ids:
        tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
        if tx:
            batch_items.append({
                "tx_id": tx_id,
                "name": tx["name"],
                "phone": tx["phone"],
                "status": "queued"
            })
            
    await db.whatsapp_batches.insert_one({
        "batch_id": batch_id,
        "status": "queued",
        "total": len(ids),
        "processed": 0,
        "items": batch_items,
        "created_at": datetime.utcnow()
    })

    background_tasks.add_task(process_bulk_whatsapp, batch_id, ids, db)
    return {"message": f"Bulk sending started", "batch_id": batch_id}

@router.get("/whatsapp/batch/{batch_id}")
async def get_whatsapp_batch(batch_id: str, db=Depends(get_db)):
    batch = await db.whatsapp_batches.find_one({"batch_id": batch_id})
    if not batch: raise HTTPException(status_code=404, detail="Batch not found")
    batch["id"] = str(batch["_id"])
    del batch["_id"]
    return batch

@router.get("/batch-status")
async def get_current_batch_status(db=Depends(get_db)):
    batch = await db.whatsapp_batches.find_one(sort=[("created_at", -1)])
    if not batch: return {"status": "none", "items": []}
    batch["id"] = str(batch["_id"])
    del batch["_id"]
    return batch

@router.post("/bulk-export")
async def bulk_export(payload: dict, db=Depends(get_db)):
    ids = [ObjectId(i) for i in payload.get("ids", [])]
    cursor = db.transactions.find({"_id": {"$in": ids}})
    txs = await cursor.to_list(length=len(ids))
    
    zip_buffer = io.BytesIO()
    with ZipFile(zip_buffer, "w") as zip_file:
        for tx in txs:
            invoice_path = tx.get("invoice_url") or generate_invoice_pdf(tx)
            file_path = os.path.join(os.getcwd(), invoice_path.lstrip("/"))
            if os.path.exists(file_path):
                safe_name = f"Invoice_{tx.get('transaction_id', str(tx['_id']))}.pdf"
                zip_file.write(file_path, safe_name)
    
    zip_buffer.seek(0)
    return StreamingResponse(zip_buffer, media_type="application/x-zip-compressed", headers={"Content-Disposition": f"attachment; filename=Invoices.zip"})

@router.post("/export-analytics")
async def export_analytics(payload: dict, db=Depends(get_db), current_user=Depends(get_current_user)):
    """Export analytics report as Excel with date and/or product filters."""
    
    start_date = payload.get("start_date")  # "YYYY-MM-DD"
    end_date = payload.get("end_date")      # "YYYY-MM-DD"
    products = payload.get("products", [])   # list of product name strings
    
    query = {}
    
    # Date filter — parse date field (stored as DD/MM/YY string) via timestamp
    if start_date or end_date:
        date_filter = {}
        if start_date:
            try:
                date_filter["$gte"] = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                pass
        if end_date:
            try:
                # End of day
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
                date_filter["$lte"] = end_dt
            except ValueError:
                pass
        if date_filter:
            query["timestamp"] = date_filter
    
    # Product filter — match any product in the items string
    if products and len(products) > 0:
        product_patterns = [{"product": {"$regex": re.escape(p), "$options": "i"}} for p in products]
        if "$or" in query:
            existing_or = query.pop("$or")
            query["$and"] = [{"$or": existing_or}, {"$or": product_patterns}]
        else:
            query["$or"] = product_patterns
    
    cursor = db.transactions.find(query).sort([("timestamp", -1)])
    transactions = await cursor.to_list(length=100000)
    
    # Create Excel workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Analytics Report"
    
    # Styles
    header_font = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
    header_fill = PatternFill(start_color="1e293b", end_color="1e293b", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    thin_border = Border(
        left=Side(style="thin", color="e2e8f0"),
        right=Side(style="thin", color="e2e8f0"),
        top=Side(style="thin", color="e2e8f0"),
        bottom=Side(style="thin", color="e2e8f0")
    )
    data_font = Font(name="Calibri", size=10)
    currency_font = Font(name="Calibri", size=10, bold=True)
    
    # Title row
    ws.merge_cells("A1:J1")
    title_cell = ws["A1"]
    title_cell.value = "ZEAL HEALING — Analytics Report"
    title_cell.font = Font(name="Calibri", bold=True, size=14, color="10b981")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Filter info row
    ws.merge_cells("A2:J2")
    filter_parts = []
    if start_date:
        filter_parts.append(f"From: {start_date}")
    if end_date:
        filter_parts.append(f"To: {end_date}")
    if products:
        filter_parts.append(f"Products: {', '.join(products)}")
    if not filter_parts:
        filter_parts.append("All Data (No Filters)")
    ws["A2"].value = " | ".join(filter_parts)
    ws["A2"].font = Font(name="Calibri", size=10, italic=True, color="64748b")
    ws["A2"].alignment = Alignment(horizontal="center")
    
    # Generated date
    ws.merge_cells("A3:J3")
    ws["A3"].value = f"Generated: {datetime.now().strftime('%d/%m/%Y %I:%M %p')}"
    ws["A3"].font = Font(name="Calibri", size=9, italic=True, color="94a3b8")
    ws["A3"].alignment = Alignment(horizontal="center")
    
    # Headers at row 5
    headers = ["#", "Date", "Customer", "Phone", "Transaction ID", "Items/Product", "Subtotal (₹)", "GST (₹)", "Total (₹)", "Paid (₹)", "Balance (₹)", "Status"]
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=5, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border
    
    # Data rows
    total_revenue = 0
    total_gst_sum = 0
    total_paid = 0
    
    for row_idx, tx in enumerate(transactions, 6):
        ws.cell(row=row_idx, column=1, value=row_idx - 5).font = data_font
        ws.cell(row=row_idx, column=2, value=tx.get("date", "-")).font = data_font
        ws.cell(row=row_idx, column=3, value=tx.get("name", "-")).font = data_font
        ws.cell(row=row_idx, column=4, value=tx.get("phone", "-")).font = data_font
        ws.cell(row=row_idx, column=5, value=tx.get("transaction_id", "-")).font = data_font
        ws.cell(row=row_idx, column=6, value=tx.get("product", "-")).font = data_font
        
        subtotal = tx.get("amount", 0)
        gst = tx.get("gst_total", 0)
        total_amt = tx.get("total_amount", 0)
        paid = tx.get("paid_amount") or 0
        balance = tx.get("balance") or 0
        
        ws.cell(row=row_idx, column=7, value=round(subtotal, 2)).font = currency_font
        ws.cell(row=row_idx, column=8, value=round(gst, 2)).font = currency_font
        ws.cell(row=row_idx, column=9, value=round(total_amt, 2)).font = currency_font
        ws.cell(row=row_idx, column=10, value=round(paid, 2)).font = currency_font
        ws.cell(row=row_idx, column=11, value=round(balance, 2)).font = currency_font
        ws.cell(row=row_idx, column=12, value=tx.get("status", "-")).font = data_font
        
        for c in range(1, 13):
            ws.cell(row=row_idx, column=c).border = thin_border
            ws.cell(row=row_idx, column=c).alignment = Alignment(horizontal="center", vertical="center")
        
        total_revenue += total_amt
        total_gst_sum += gst
        total_paid += paid
    
    # Summary row
    summary_row = len(transactions) + 6
    summary_fill = PatternFill(start_color="f0fdf4", end_color="f0fdf4", fill_type="solid")
    summary_font = Font(name="Calibri", bold=True, size=11, color="10b981")
    
    ws.merge_cells(start_row=summary_row, start_column=1, end_row=summary_row, end_column=6)
    ws.cell(row=summary_row, column=1, value="TOTALS").font = summary_font
    ws.cell(row=summary_row, column=1).alignment = Alignment(horizontal="right")
    ws.cell(row=summary_row, column=7, value=round(total_revenue - total_gst_sum, 2)).font = summary_font
    ws.cell(row=summary_row, column=8, value=round(total_gst_sum, 2)).font = summary_font
    ws.cell(row=summary_row, column=9, value=round(total_revenue, 2)).font = summary_font
    ws.cell(row=summary_row, column=10, value=round(total_paid, 2)).font = summary_font
    ws.cell(row=summary_row, column=11, value=round(total_revenue - total_paid, 2)).font = summary_font
    
    for c in range(1, 13):
        ws.cell(row=summary_row, column=c).fill = summary_fill
        ws.cell(row=summary_row, column=c).border = thin_border
    
    # Column widths
    col_widths = [6, 12, 20, 15, 22, 30, 14, 12, 14, 14, 14, 12]
    for i, w in enumerate(col_widths, 1):
        ws.column_dimensions[chr(64 + i) if i <= 26 else ""].width = w
    # Fix column L
    ws.column_dimensions["A"].width = col_widths[0]
    ws.column_dimensions["B"].width = col_widths[1]
    ws.column_dimensions["C"].width = col_widths[2]
    ws.column_dimensions["D"].width = col_widths[3]
    ws.column_dimensions["E"].width = col_widths[4]
    ws.column_dimensions["F"].width = col_widths[5]
    ws.column_dimensions["G"].width = col_widths[6]
    ws.column_dimensions["H"].width = col_widths[7]
    ws.column_dimensions["I"].width = col_widths[8]
    ws.column_dimensions["J"].width = col_widths[9]
    ws.column_dimensions["K"].width = col_widths[10]
    ws.column_dimensions["L"].width = col_widths[11]
    
    # Save to buffer
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    filename = f"Zeal_Analytics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

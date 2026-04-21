import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List
from datetime import datetime, date as date_type
from decimal import Decimal
from bson import ObjectId
from database import get_db
from models import TransactionCreate, TransactionDB
from auth import get_current_user
from utils import generate_invoice_pdf, send_whatsapp_invoice, get_hsn_details
from ai_utils import get_smart_product_match
import uuid
import shutil
import os
import re

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
    
    await db.customers.update_one(
        {"phone": tx_dict["phone"]},
        {"$set": {"name": tx_dict["name"]}, "$inc": {"total_spent": tx_dict["amount"], "total_transactions": 1}},
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

@router.post("/upload")
async def upload_transactions(file: UploadFile = File(...), db=Depends(get_db), current_user=Depends(get_current_user)):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    contents = await file.read()
    try:
        import openpyxl
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
                "amount": find_idx(["amount", "total", "price"], 4),
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

                # Cache product names for AI matching
                cursor = db.products.find({}, {"name": 1})
                all_product_names = [p["name"] for p in await cursor.to_list(length=1000)]

                for item_name, qty in parsed_items:
                    # 1. Try Exact/Case-Insensitive Match
                    product = await db.products.find_one({"name": {"$regex": f"^{re.escape(item_name)}$", "$options": "i"}})
                    
                    if not product:
                        # 2. SMART AI FALLBACK
                        suggested_name = await get_smart_product_match(item_name, all_product_names)
                        if suggested_name:
                            product = await db.products.find_one({"name": suggested_name})
                    
                    if not product:
                        raise HTTPException(status_code=400, detail=f"Product '{item_name}' not found.")
                    
                    price = Decimal(str(product["price_india"] if location == "India" else product["price_abroad"]))
                    # STRICT RULE: Abroad = 0% GST
                    gst_rate = Decimal(str(product["gst_rate"] if location == "India" else 0))
                    
                    # Rounding each step
                    item_subtotal = (price * qty).quantize(Decimal("0.01"))
                    gst_amount = (item_subtotal * gst_rate / 100).quantize(Decimal("0.01"))
                    item_total = item_subtotal + gst_amount
                    
                    subtotal += item_subtotal
                    total_gst += gst_amount
                    
                    # Split for India
                    if location == "India":
                        cgst = (gst_amount / 2).quantize(Decimal("0.01"))
                        sgst = gst_amount - cgst # Ensures sum = total_gst
                    else:
                        cgst = Decimal("0")
                        sgst = Decimal("0")

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
                        "hsn": product.get("hsn_code", "9983")
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

                existing = await db.transactions.find_one({"transaction_id": clean_tx_id})

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
                    "status": "Verified",
                    "timestamp": datetime.utcnow(),
                    "added_by": current_user["username"],
                    "batch_id": batch_id
                }
                all_transactions.append(tx_obj)

        if all_transactions:
            result = await db.transactions.insert_many(all_transactions)
            for i, tx in enumerate(all_transactions):
                tx["_id"] = result.inserted_ids[i]
                await db.customers.update_one(
                    {"phone": tx["phone"]},
                    {"$set": {"name": tx["name"]}, "$inc": {"total_spent": tx["amount"], "total_transactions": 1}},
                    upsert=True
                )
                invoice_url = generate_invoice_pdf(tx)
                await db.transactions.update_one({"_id": tx["_id"]}, {"$set": {"invoice_url": invoice_url}})

        return {"message": f"Processed {len(all_transactions)} transactions", "batch_id": batch_id}
    except Exception as e:
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
            
    cursor = db.transactions.find(query).sort([("timestamp", -1), ("excel_row_index", 1)]).skip(skip).limit(limit)
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
async def delete_transaction(tx_id: str, db=Depends(get_db)):
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if tx:
        # Decrement customer stats
        await db.customers.update_one(
            {"phone": tx["phone"]},
            {"$inc": {"total_spent": -tx["amount"], "total_transactions": -1}}
        )
        # Cleanup customers with no transactions
        await db.customers.delete_many({"total_transactions": {"$lte": 0}})
        await db.transactions.delete_one({"_id": ObjectId(tx_id)})
    return {"message": "Deleted"}

@router.post("/bulk-delete")
async def bulk_delete(payload: dict, db=Depends(get_db)):
    if payload.get("deleteAll"):
        await db.transactions.delete_many({})
        await db.customers.delete_many({}) # Wipe customer frequency too
    else:
        ids = [ObjectId(i) for i in payload.get("ids", [])]
        # In a high-perf scenario, we'd decrement each customer here, 
        # but for bulk selection, users usually want a fresh start or specific removals.
        await db.transactions.delete_many({"_id": {"$in": ids}})
    return {"message": "Deleted"}

@router.post("/{tx_id}/generate-invoice")
async def create_invoice(tx_id: str, db=Depends(get_db)):
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    url = generate_invoice_pdf(tx)
    await db.transactions.update_one({"_id": ObjectId(tx_id)}, {"$set": {"invoice_url": url}})
    return {"url": url}

@router.post("/{tx_id}/send-whatsapp")
async def send_whatsapp(tx_id: str, db=Depends(get_db)):
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    return send_whatsapp_invoice(tx["phone"], tx["invoice_url"])

@router.post("/bulk-export")
async def bulk_export(payload: dict, db=Depends(get_db)):
    from zipfile import ZipFile
    import io
    
    ids = [ObjectId(i) for i in payload.get("ids", [])]
    if not ids:
        # If no IDs, maybe export all matching current filters?
        # For now, just return error
        raise HTTPException(status_code=400, detail="No IDs provided")
        
    cursor = db.transactions.find({"_id": {"$in": ids}})
    txs = await cursor.to_list(length=len(ids))
    
    zip_buffer = io.BytesIO()
    with ZipFile(zip_buffer, "w") as zip_file:
        for tx in txs:
            # Ensure PDF exists
            invoice_path = tx.get("invoice_url")
            if not invoice_path:
                from utils import generate_invoice_pdf
                invoice_path = generate_invoice_pdf(tx)
                await db.transactions.update_one({"_id": tx["_id"]}, {"$set": {"invoice_url": invoice_path}})
            
            # Static path logic
            file_path = os.path.join(os.getcwd(), invoice_path.lstrip("/"))
            if os.path.exists(file_path):
                # Clean filename for zip
                safe_name = f"Invoice_{tx.get('transaction_id', tx['_id'])}.pdf"
                zip_file.write(file_path, safe_name)
    
    zip_buffer.seek(0)
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        zip_buffer,
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": f"attachment; filename=Zeal_Invoices_{datetime.now().strftime('%Y%m%d_%H%M')}.zip"}
    )

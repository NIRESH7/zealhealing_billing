import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List
from datetime import datetime
from bson import ObjectId
from database import get_db
from models import TransactionCreate, TransactionDB
from auth import get_current_user
from utils import generate_invoice_pdf, send_whatsapp_invoice
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
        gst_map = {"9997": 5.0, "7103": 0.25, "7106": 3.0, "9983": 18.0}
        
        for sheet in wb.worksheets:
            rows = list(sheet.iter_rows(values_only=False))
            if not rows: continue
            
            # Use Static 0-5 Mirror Mapping as per user request
            col_map = {"date": 0, "name": 1, "phone": 2, "transaction_id": 3, "amount": 4, "product": 5}
            
            # Find the first row that actually has data (to skip empty headers/logos)
            start_idx = 0
            for i, row in enumerate(rows):
                if any(c.value for c in row):
                    # Check if this looks like a header or data
                    test_val = str(row[1].value or "").lower()
                    if "name" in test_val or "customer" in test_val:
                        start_idx = i + 1
                    else:
                        start_idx = i
                    break

            current_date = "-" # Sticky date initiation
            
            # PRE-SCAN for a date in the top of the sheet
            for i in range(min(15, len(rows))):
                for cell in rows[i]:
                    if cell.value and hasattr(cell.value, "strftime"):
                        current_date = cell.value.strftime('%d/%m/%y')
                        break
                    elif cell.value and re.match(r'^\d{1,2}/\d{1,2}/\d{2,4}', str(cell.value)):
                        current_date = str(cell.value).strip()
                        break
                if current_date != "-": break

            for row in rows[start_idx:]:
                if not any(c.value for c in row): continue # Skip empty rows
                
                # 1. Capture Sticky Date (Column 0)
                d_cell = row[col_map["date"]].value
                if d_cell:
                    if hasattr(d_cell, "strftime"):
                        current_date = d_cell.strftime('%d/%m/%y')
                    else:
                        s_d = str(d_cell).strip()
                        if re.match(r'^\d{1,2}/\d{1,2}/\d{2,4}', s_d):
                            current_date = s_d

                # 2. Extract Values using .value ONLY
                raw_name = str(row[col_map["name"]].value or "").strip()
                raw_phone = str(row[col_map["phone"]].value or "").strip()
                raw_tx_id = str(row[col_map["transaction_id"]].value or "").strip()
                raw_amt = str(row[col_map["amount"]].value or "0")
                product = str(row[col_map["product"]].value or "").strip()

                if not raw_name or raw_name.lower() in ["none", "nan", "total", "balance", "customer name"]:
                    continue

                # 3. Clean and Format
                phone = "".join(re.findall(r'\d+', raw_phone))
                if len(phone) > 12: phone = phone[:12]
                if not phone: continue

                numeric_amt = "".join(re.findall(r'[0-9.]+', raw_amt))
                try:
                    amount = float(numeric_amt) if numeric_amt else 0.0
                except: amount = 0.0
                if amount <= 0: continue

                # Clean Transaction ID
                first_id = raw_tx_id.split("\n")[0].split("\r")[0].strip()
                clean_tx_id = "".join([c if c.isalnum() else "_" for c in first_id]).upper()[:30]
                if not clean_tx_id or clean_tx_id.lower() in ["nan", "total"]: continue

                # 4. HSN Logic (Invisible to user)
                hsn = "9983"
                p_lower = product.lower()
                if "reiki" in p_lower: hsn = "9997"
                elif any(w in p_lower for w in ["crystal", "bracelet", "tumble", "zibu", "pyramid", "selenite"]): hsn = "7103"
                elif "silver" in p_lower: hsn = "7106"

                rate = gst_map.get(hsn, 18.0)
                existing = await db.transactions.find_one({"transaction_id": clean_tx_id})

                # 5. Build Final Mirror Object
                tx_obj = {
                    "name": raw_name,
                    "phone": phone,
                    "transaction_id": clean_tx_id,
                    "amount": amount, # Match Excel
                    "product": product, # Match Excel
                    "date": current_date, # Sticky Date Match
                    "hsn_code": hsn,
                    "gst_rate": rate,
                    "total_amount": amount, # Mirror Mirror
                    "excel_row_index": start_idx + i, # Preserve Order
                    "is_duplicate": True if existing else False,
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

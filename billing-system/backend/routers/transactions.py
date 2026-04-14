import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List
import pandas as pd
from datetime import datetime
from bson import ObjectId
from database import get_db
from models import TransactionCreate, TransactionDB
from auth import get_current_user
from utils import generate_invoice_pdf, send_whatsapp_invoice
import uuid
import shutil
import os

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/manual")
async def create_transaction_manual(transaction: TransactionCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    # Create manual transaction
    tx_dict = transaction.model_dump()
    tx_dict["status"] = "Pending"
    tx_dict["timestamp"] = datetime.utcnow()
    tx_dict["added_by"] = current_user["username"]
    
    # insert customer if not exist or update
    await db.customers.update_one(
        {"phone": tx_dict["phone"]},
        {"$set": {"name": tx_dict["name"]}, "$inc": {"total_spent": tx_dict["amount"], "total_transactions": 1}},
        upsert=True
    )
    
    result = await db.transactions.insert_one(tx_dict)
    tx_dict["_id"] = result.inserted_id
    tx_dict["id"] = str(result.inserted_id)
    return tx_dict

@router.post("/upload")
async def upload_transactions(file: UploadFile = File(...), db=Depends(get_db), current_user=Depends(get_current_user)):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Normalize columns: trim whitespace and handle case-insensitivity
        df.columns = [str(c).strip() for c in df.columns]
        col_map = {c.lower(): c for c in df.columns}
        
        required_cols = ["Name", "Phone", "Transaction ID", "Amount", "Product"]
        mapped_cols = {}
        
        for req in required_cols:
            found = False
            # Check for exact case-insensitive match
            if req.lower() in col_map:
                mapped_cols[req] = col_map[req.lower()]
                found = True
            
            if not found:
                # Add some common variations
                variations = {
                    "Name": ["customer name", "customer", "full name"],
                    "Phone": ["phone number", "mobile", "contact"],
                    "Transaction ID": ["tx id", "txn id", "transactionid"],
                    "Amount": ["price", "total", "cost", "amount paid"],
                    "Product": ["item", "description", "product name", "course"],
                    "Email": ["email address", "email id"]
                }
                for var in variations.get(req, []):
                    if var in col_map:
                        mapped_cols[req] = col_map[var]
                        found = True
                        break
            
            if not found:
                found_cols = list(df.columns)
                raise HTTPException(
                    status_code=400, 
                    detail=f"Missing column: '{req}'. Found columns: {found_cols}. Please use the template for the correct format."
                )
        
        df = df.dropna(how='all')
        records = df.to_dict("records")
        transactions = []
        batch_id = str(uuid.uuid4())
        
        for row in records:
            # Handle optional email mapping
            email_val = None
            for e_var in ["email", "email address", "email id"]:
                if e_var in col_map:
                    val = row[col_map[e_var]]
                    if pd.notna(val):
                        email_val = str(val)
                    break

            raw_phone = str(row[mapped_cols["Phone"]])
            if raw_phone.endswith('.0'):
                raw_phone = raw_phone[:-2]
                
            raw_amount = str(row[mapped_cols["Amount"]])
            clean_amount = ''.join(c for c in raw_amount if c.isdigit() or c == '.')
            amount_val = float(clean_amount) if clean_amount else 0.0

            tx = {
                "name": str(row[mapped_cols["Name"]]),
                "phone": raw_phone,
                "email": email_val,
                "transaction_id": str(row[mapped_cols["Transaction ID"]]),
                "amount": amount_val,
                "product": str(row[mapped_cols["Product"]]),
                "status": "Verified",   # Auto-verify on upload
                "timestamp": datetime.utcnow(),
                "added_by": current_user["username"],
                "batch_id": batch_id
            }
            transactions.append(tx)
            
            # update customer
            await db.customers.update_one(
                {"phone": tx["phone"]},
                {"$set": {"name": tx["name"]}, "$inc": {"total_spent": tx["amount"], "total_transactions": 1}},
                upsert=True
            )
            
        if transactions:
            result = await db.transactions.insert_many(transactions)
            inserted_ids = result.inserted_ids
            
            # Auto-generate invoices for all uploaded transactions
            for i, tx in enumerate(transactions):
                tx["_id"] = inserted_ids[i]
                invoice_url = generate_invoice_pdf(tx)
                await db.transactions.update_one(
                    {"_id": inserted_ids[i]},
                    {"$set": {"invoice_url": invoice_url}}
                )
            
        return {"message": f"Successfully uploaded and generated bills for {len(transactions)} transactions", "batch_id": batch_id}

        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_transactions(skip: int = 0, limit: int = 50, status: str = None, search: str = None, latest_batch_only: bool = False, db=Depends(get_db), current_user=Depends(get_current_user)):
    query = {}
    if status and status != "All":
        query["status"] = status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"transaction_id": {"$regex": search, "$options": "i"}},
            {"product": {"$regex": search, "$options": "i"}}
        ]
        
    if latest_batch_only:
        latest_tx = await db.transactions.find_one(sort=[("timestamp", -1)])
        if latest_tx and "batch_id" in latest_tx:
            query["batch_id"] = latest_tx["batch_id"]
            
    cursor = db.transactions.find(query).sort("timestamp", -1).skip(skip).limit(limit)
    transactions = await cursor.to_list(length=limit)
    
    # Safely serialize MongoDB objects
    serialized = []
    for tx in transactions:
        tx["id"] = str(tx["_id"])
        del tx["_id"]  # Remove ObjectId which can't be serialized
        # Convert datetime fields to ISO strings
        if "timestamp" in tx and hasattr(tx["timestamp"], "isoformat"):
            tx["timestamp"] = tx["timestamp"].isoformat()
        if "verified_at" in tx and hasattr(tx.get("verified_at"), "isoformat"):
            tx["verified_at"] = tx["verified_at"].isoformat()
        if "whatsapp_sent_at" in tx and hasattr(tx.get("whatsapp_sent_at"), "isoformat"):
            tx["whatsapp_sent_at"] = tx["whatsapp_sent_at"].isoformat()
        serialized.append(tx)
        
    total = await db.transactions.count_documents(query)
    return {"total": total, "items": serialized}


@router.post("/{tx_id}/payment-proof")
async def upload_payment_proof(tx_id: str, file: UploadFile = File(...), db=Depends(get_db), current_user=Depends(get_current_user)):
    file_ext = file.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"/uploads/{file_name}"
    
    result = await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"payment_proof": file_url}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found or proof already same")
        
    return {"message": "Payment proof uploaded", "url": file_url}

@router.put("/{tx_id}/verify")
async def verify_transaction(tx_id: str, payload: dict, db=Depends(get_db), current_user=Depends(get_current_user)):
    new_status = payload.get("status") # Verified or Rejected
    if new_status not in ["Verified", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    result = await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"status": new_status, "verified_by": current_user["username"], "verified_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    return {"message": f"Transaction marked as {new_status}"}

@router.post("/{tx_id}/generate-invoice")
async def create_invoice(tx_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    invoice_url = generate_invoice_pdf(tx)
    
    await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"invoice_url": invoice_url}}
    )
    return {"message": "Invoice generated", "url": invoice_url}

@router.post("/{tx_id}/send-whatsapp")
async def send_whatsapp(tx_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if not tx.get("invoice_url"):
        raise HTTPException(status_code=400, detail="Invoice not generated yet")
        
    res = send_whatsapp_invoice(tx["phone"], tx["invoice_url"])
    
    if res.get("status") == "success":
        await db.transactions.update_one(
            {"_id": ObjectId(tx_id)},
            {"$set": {"whatsapp_sent": True, "whatsapp_sent_at": datetime.utcnow()}}
        )
    
    return res

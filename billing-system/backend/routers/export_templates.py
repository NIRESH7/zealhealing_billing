from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone
from database import get_db
from auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter()

class ExportTemplateCreate(BaseModel):
    template_name: str
    filter_mode: str
    date_preset: Optional[str] = None
    custom_start_date: Optional[str] = None
    custom_end_date: Optional[str] = None
    selected_products: List[str] = []

class ExportTemplateUpdate(BaseModel):
    template_name: Optional[str] = None
    filter_mode: Optional[str] = None
    date_preset: Optional[str] = None
    custom_start_date: Optional[str] = None
    custom_end_date: Optional[str] = None
    selected_products: Optional[List[str]] = None
    last_used: Optional[datetime] = None

def serialize_template(t) -> dict:
    t["id"] = str(t["_id"])
    del t["_id"]
    if isinstance(t.get("created_at"), datetime):
        t["created_at"] = t["created_at"].isoformat()
    if isinstance(t.get("last_used"), datetime):
        t["last_used"] = t["last_used"].isoformat()
    return t

@router.get("/")
async def get_templates(db=Depends(get_db), current_user=Depends(get_current_user)):
    username = current_user["username"]
    cursor = db.export_templates.find({"created_by": username}).sort("template_name", 1)
    templates = await cursor.to_list(length=100)
    return [serialize_template(t) for t in templates]

@router.post("/")
async def create_template(payload: ExportTemplateCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    username = current_user["username"]
    
    # Check for duplicate name
    existing = await db.export_templates.find_one({
        "created_by": username,
        "template_name": payload.template_name
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A template with this name already exists."
        )
        
    doc = payload.model_dump()
    doc["created_by"] = username
    doc["created_at"] = datetime.now(timezone.utc)
    doc["last_used"] = datetime.now(timezone.utc)
    
    result = await db.export_templates.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_template(doc)

@router.put("/{template_id}")
async def update_template(template_id: str, payload: ExportTemplateUpdate, db=Depends(get_db), current_user=Depends(get_current_user)):
    username = current_user["username"]
    
    try:
        obj_id = ObjectId(template_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid template ID format")
        
    existing = await db.export_templates.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")
        
    if existing["created_by"] != username:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this template")
        
    # If renaming, check for duplicate name
    if payload.template_name and payload.template_name != existing["template_name"]:
        dup = await db.export_templates.find_one({
            "created_by": username,
            "template_name": payload.template_name,
            "_id": {"$ne": obj_id}
        })
        if dup:
            raise HTTPException(
                status_code=400,
                detail="A template with this name already exists."
            )
            
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    # If last_used is explicitly passed or if we are applying a template
    # we can set it. If it's a general update, we can also set last_used to utcnow
    if "last_used" not in update_data and any(k in update_data for k in ["filter_mode", "date_preset", "custom_start_date"]):
        update_data["last_used"] = datetime.now(timezone.utc)
        
    await db.export_templates.update_one(
        {"_id": obj_id},
        {"$set": update_data}
    )
    
    updated = await db.export_templates.find_one({"_id": obj_id})
    return serialize_template(updated)

@router.delete("/{template_id}")
async def delete_template(template_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    username = current_user["username"]
    
    try:
        obj_id = ObjectId(template_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid template ID format")
        
    existing = await db.export_templates.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")
        
    if existing["created_by"] != username:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this template")
        
    await db.export_templates.delete_one({"_id": obj_id})
    return {"success": True, "message": "Template deleted successfully"}

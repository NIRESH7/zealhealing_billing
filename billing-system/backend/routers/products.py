from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from bson import ObjectId
from database import get_db
from models import ProductCreate, ProductDB
from auth import get_current_user

router = APIRouter()

@router.post("/")
async def create_product(product: ProductCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage products")
    
    product_dict = product.model_dump()
    result = await db.products.insert_one(product_dict)
    product_dict["id"] = str(result.inserted_id)
    if "_id" in product_dict:
        del product_dict["_id"]
    return product_dict

@router.get("/")
async def get_products(category: str = None, search: str = None, db=Depends(get_db)):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
        
    cursor = db.products.find(query)
    products = await cursor.to_list(length=1000)
    
    serialized = []
    for p in products:
        p["id"] = str(p["_id"])
        del p["_id"]
        serialized.append(p)
    return serialized

@router.put("/{product_id}")
async def update_product(product_id: str, product: ProductCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage products")
    
    await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": product.model_dump()}
    )
    return {"message": "Updated"}

@router.delete("/{product_id}")
async def delete_product(product_id: str, db=Depends(get_db), current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage products")
    
    await db.products.delete_one({"_id": ObjectId(product_id)})
    return {"message": "Deleted"}

@router.post("/seed")
async def seed_products(products: List[ProductCreate], db=Depends(get_db), current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage products")
    
    # Optional: Clear existing products?
    # await db.products.delete_many({})
    
    product_dicts = [p.model_dump() for p in products]
    if product_dicts:
        await db.products.insert_many(product_dicts)
    return {"message": f"Seeded {len(product_dicts)} products"}

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema, *args, **kwargs):
        field_schema.update(type="string")

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "staff" # admin or staff

class UserDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    username: str
    hashed_password: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class TransactionCreate(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    transaction_id: str
    amount: float
    product: str

class TransactionDB(TransactionCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    payment_proof: Optional[str] = None # image url
    status: str = "Pending" # Pending, Verified, Rejected
    invoice_url: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CustomerDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    phone: str
    total_spent: float = 0
    total_transactions: int = 0

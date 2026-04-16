from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId
from pydantic.functional_validators import BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

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
    date: Optional[str] = None
    hsn_code: Optional[str] = None
    qty: int = 1

class TransactionDB(TransactionCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    payment_proof: Optional[str] = None # image url
    status: str = "Pending" # Pending, Verified, Rejected
    invoice_url: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_duplicate: bool = False
    gst_rate: float = 0
    cgst: float = 0
    sgst: float = 0
    total_amount: float = 0

class CustomerDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    phone: str
    total_spent: float = 0
    total_transactions: int = 0

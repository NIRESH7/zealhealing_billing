from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/")
MONGO_DB = os.getenv("MONGO_DB", "zeal_billing_db")

def wipe_data():
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    
    print(f"Connecting to database: {MONGO_DB}")
    
    # Remove transactions
    tx_count = db.transactions.count_documents({})
    db.transactions.delete_many({})
    print(f"--- Deleted {tx_count} transactions.")
    
    # Remove customers
    cust_count = db.customers.count_documents({})
    db.customers.delete_many({})
    print(f"--- Deleted {cust_count} customers.")
    
    print("\nSUCCESS: All data cleared except for User Accounts (Login).")
    print("Refresh your browser to see the empty analytics page.")

if __name__ == "__main__":
    confirm = input("Are you SURE you want to delete ALL transaction data? (yes/no): ")
    if confirm.lower() == 'yes':
        wipe_data()
    else:
        print("Wipe cancelled.")

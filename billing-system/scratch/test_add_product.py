import requests
import asyncio

BASE_URL = "http://localhost:8000/api"

def test_add_product():
    # First login to get token
    login_data = {
        "username": "admin@zealhealing.com",
        "password": "Zeal@2026"
    }
    login_res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        return
    
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to add product
    product_data = {
        "name": "Test Product",
        "category": "Healing",
        "price_india": 7777,
        "price_abroad": 8888,
        "gst_rate": 7,
        "is_service": True,
        "hsn_code": "7777",
        "sub_category": ""
    }
    
    res = requests.post(f"{BASE_URL}/products/", json=product_data, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == "__main__":
    test_add_product()

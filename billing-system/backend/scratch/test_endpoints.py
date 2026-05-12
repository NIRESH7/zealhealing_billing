import requests

BASE_URL = "http://localhost:8000/api"

def login():
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": "zeal_admin", "password": "zeal_password123"})
    res.raise_for_status()
    return res.json()["access_token"]

def test_export(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(f"{BASE_URL}/transactions/export-analytics", json={}, headers=headers)
    print(f"Export status: {res.status_code}")
    print(f"Content type: {res.headers.get('Content-Type')}")
    print(f"Content disposition: {res.headers.get('Content-Disposition')}")
    if res.status_code == 200:
        with open("test_export.xlsx", "wb") as f:
            f.write(res.content)
        print("Export saved to test_export.xlsx")

def test_clear_all(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(f"{BASE_URL}/transactions/bulk-delete", json={"deleteAll": True}, headers=headers)
    print(f"Clear all status: {res.status_code}")
    print(f"Response: {res.json()}")

if __name__ == "__main__":
    try:
        token = login()
        test_export(token)
        # test_clear_all(token) # Careful with this!
    except Exception as e:
        print(f"Error: {e}")

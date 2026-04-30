import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def ping_server():
    uri = "mongodb://127.0.0.1:27017/"
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    try:
        # The ismaster command is cheap and does not require auth.
        await client.admin.command('ping')
        print(f"SUCCESS: connected to MongoDB at {uri}")
    except Exception as e:
        print(f"FAILED: Could not connect to MongoDB at {uri}")
        print(f"Error: {e}")
        print("\nPlease ensure that MongoDB is installed and running on your system.")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(ping_server())

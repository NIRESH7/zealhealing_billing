import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

async def get_smart_product_match(mismatched_name, available_products):
    """
    Uses OpenAI to find the best match for a mismatched product name.
    available_products should be a list of strings (product names).
    """
    if not OPENAI_API_KEY:
        return None

    prompt = f"""
    The user entered product name: "{mismatched_name}"
    The actual products in our database are:
    {", ".join(available_products)}

    Identify the most likely product from our database that matches the user's input, even if there are typos or formatting differences.
    If no reasonably close match is found, return "None".
    Return ONLY the exact product name from our database, or "None".
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "system", "content": "You are a smart product matching assistant for a healing center."},
                                 {"role": "user", "content": prompt}],
                    "temperature": 0
                },
                timeout=10
            )
            res_data = response.json()
            match = res_data['choices'][0]['message']['content'].strip()
            if match == "None" or match not in available_products:
                return None
            return match
    except Exception as e:
        print(f"AI Matching Error: {e}")
        return None

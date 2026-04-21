import asyncio
import motor.motor_asyncio
from models import ProductCreate
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.zeal_billing_db

products = [
    # --- Tarot Appointments ---
    # Voice Call
    {"name": "Tarot 15min Voice", "category": "Tarot", "price_india": 1000, "price_abroad": 2000, "gst_rate": 18, "hsn_code": "9983", "is_service": True},
    {"name": "Tarot 30min Voice", "category": "Tarot", "price_india": 2000, "price_abroad": 4000, "gst_rate": 18, "hsn_code": "9983", "is_service": True},
    {"name": "Tarot 45min Voice", "category": "Tarot", "price_india": 3000, "price_abroad": 6000, "gst_rate": 18, "hsn_code": "9983", "is_service": True},
    {"name": "Tarot 60min Voice", "category": "Tarot", "price_india": 4000, "price_abroad": 8000, "gst_rate": 18, "hsn_code": "9983", "is_service": True},
    # Video Call
    {"name": "Tarot 15min Video", "category": "Tarot", "price_india": 2000, "price_abroad": 4000, "gst_rate": 18, "hsn_code": "9983", "is_service": True},
    {"name": "Tarot 30min Video", "category": "Tarot", "price_india": 4000, "price_abroad": 8000, "gst_rate": 18, "hsn_code": "9983", "is_service": True},
    {"name": "Tarot 45min Video", "category": "Tarot", "price_india": 6000, "price_abroad": 12000, "gst_rate": 18, "hsn_code": "9983", "is_service": True},
    {"name": "Tarot 60min Video", "category": "Tarot", "price_india": 8000, "price_abroad": 16000, "gst_rate": 18, "hsn_code": "9983", "is_service": True},

    # --- Crystals -> Bracelets (GST 0.25%) ---
    {"name": "black tourmaline bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1499, "price_abroad": 1499, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "red carnelian bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "red jasper bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "amethyst bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1499, "price_abroad": 1499, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "triple protection bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "citrine bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1499, "price_abroad": 1499, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "Howlite bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "lapis lazuli bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1499, "price_abroad": 1499, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "tiger's eye bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "rose quartz bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "green aventurine bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "orange carnelian bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "money magnet bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 2599, "price_abroad": 2599, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "turquoise bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "7 chakra bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "lava 7 chakra bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "pyrite bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "clear quartz bracelet", "category": "Crystals", "sub_category": "Bracelets", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},

    # --- Crystals -> Pyramids (GST 0.25%) ---
    {"name": "rose quartz pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "amethyst pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "pyrite pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 2799, "price_abroad": 2799, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "citrine pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "red carnelian pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "black tourmaline pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "green aventurine pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "tiger's eye pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "Howlite pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "lapis lazuli pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "7 chakra pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "annapoorna pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "gomathi chakra pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "rudhrakcha pyramid", "category": "Crystals", "sub_category": "Pyramids", "price_india": 1999, "price_abroad": 1999, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},

    # --- Tumble Stones ---
    {"name": "amethyst Tumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 700, "price_abroad": 700, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "citrine Tumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 700, "price_abroad": 700, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "green aventurine Tumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 700, "price_abroad": 700, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "rose quartz Tumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 700, "price_abroad": 700, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "clear quartz Tumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 700, "price_abroad": 700, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "red carnelianTumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 700, "price_abroad": 700, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "orange carnelian Tumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 700, "price_abroad": 700, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "lapis lazuliTumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 1200, "price_abroad": 1200, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "tiger's eyeTumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 1200, "price_abroad": 1200, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "pyrite Tumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 1600, "price_abroad": 1600, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "black tourmalineTumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 700, "price_abroad": 700, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "Howlite Tumble stones", "category": "Crystals", "sub_category": "Tumble", "price_india": 700, "price_abroad": 700, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "7 chakra Tumble stones set", "category": "Crystals", "sub_category": "Tumble", "price_india": 3000, "price_abroad": 3000, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},

    # --- Mini Bottles ---
    {"name": "amethyst Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "citrine Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "red carnelian Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "pyrite Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "lapis lazuli Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "red jasper Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "clear quartz Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "gomathi chakra Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "green aventurine Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "rose quartz Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "black tourmaline Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "tiger's eye Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "blood stone Mini bottle crystal", "category": "Crystals", "sub_category": "Mini Bottle", "price_india": 650, "price_abroad": 650, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},

    # --- Coin & Others ---
    {"name": "zibu crystal ( green ) Coin crystal", "category": "Crystals", "sub_category": "Coin", "price_india": 1499, "price_abroad": 1499, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "zibu crystal ( rose quartz ) Coin crystal", "category": "Crystals", "sub_category": "Coin", "price_india": 1499, "price_abroad": 1499, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "pyrite cluster Coin crystal", "category": "Crystals", "sub_category": "Coin", "price_india": 1599, "price_abroad": 1599, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "selenite plate Coin crystal", "category": "Crystals", "sub_category": "Coin", "price_india": 1499, "price_abroad": 1499, "gst_rate": 0.25, "hsn_code": "7103", "is_service": False},
    {"name": "black tourmaline with selenite hanging Coin crystal", "category": "Crystals", "sub_category": "Hanging", "price_india": 999, "price_abroad": 999, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},

    # --- Pendants ---
    {"name": "amethyst Pendant", "category": "Crystals", "sub_category": "Pendant", "price_india": 1499, "price_abroad": 1499, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "citrine Pendant", "category": "Crystals", "sub_category": "Pendant", "price_india": 1499, "price_abroad": 1499, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "rose quartz Pendant", "category": "Crystals", "sub_category": "Pendant", "price_india": 1499, "price_abroad": 1499, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "black tourmaline Pendant", "category": "Crystals", "sub_category": "Pendant", "price_india": 1499, "price_abroad": 1499, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "7 chakra pendulam Pendant", "category": "Crystals", "sub_category": "Pendant", "price_india": 1100, "price_abroad": 1100, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},

    # --- Malai, Tree, Wand, Ball ---
    {"name": "7 chakra malai", "category": "Crystals", "sub_category": "Malai", "price_india": 4500, "price_abroad": 4500, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "money magnet malai", "category": "Crystals", "sub_category": "Malai", "price_india": 3300, "price_abroad": 3300, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "citrine malai", "category": "Crystals", "sub_category": "Malai", "price_india": 4500, "price_abroad": 4500, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "green aventurine malai", "category": "Crystals", "sub_category": "Malai", "price_india": 4500, "price_abroad": 4500, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "clear quartz malai", "category": "Crystals", "sub_category": "Malai", "price_india": 4500, "price_abroad": 4500, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "tiger's eye malai", "category": "Crystals", "sub_category": "Malai", "price_india": 4500, "price_abroad": 4500, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    {"name": "black tourmaline malai", "category": "Crystals", "sub_category": "Malai", "price_india": 4500, "price_abroad": 4500, "gst_rate": 0.25, "hsn_code": "7117", "is_service": False},
    
    {"name": "7 chakra tree", "category": "Crystals", "sub_category": "Tree", "price_india": 4500, "price_abroad": 4500, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    
    {"name": "siva sakthi wand", "category": "Crystals", "sub_category": "Wand", "price_india": 2000, "price_abroad": 2000, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "7 chakra wand", "category": "Crystals", "sub_category": "Wand", "price_india": 3000, "price_abroad": 3000, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "clear quartz wand", "category": "Crystals", "sub_category": "Wand", "price_india": 3000, "price_abroad": 3000, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    
    {"name": "clear quartz Ball", "category": "Crystals", "sub_category": "Ball", "price_india": 2599, "price_abroad": 2599, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "rose quartz Ball", "category": "Crystals", "sub_category": "Ball", "price_india": 2599, "price_abroad": 2599, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "tiger's eye Ball", "category": "Crystals", "sub_category": "Ball", "price_india": 2599, "price_abroad": 2599, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "Howlite Ball", "category": "Crystals", "sub_category": "Ball", "price_india": 2599, "price_abroad": 2599, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "amethyst Ball", "category": "Crystals", "sub_category": "Ball", "price_india": 2599, "price_abroad": 2599, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "green aventurine Ball", "category": "Crystals", "sub_category": "Ball", "price_india": 2599, "price_abroad": 2599, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "citrine Ball", "category": "Crystals", "sub_category": "Ball", "price_india": 2599, "price_abroad": 2599, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},
    {"name": "7 chakra Ball", "category": "Crystals", "sub_category": "Ball", "price_india": 2599, "price_abroad": 2599, "gst_rate": 0.25, "hsn_code": "7116", "is_service": False},

    # --- Others & Cards ---
    {"name": "Certificate", "category": "Others", "price_india": 250, "price_abroad": 250, "gst_rate": 18, "hsn_code": "4901", "is_service": False},
    {"name": "21 days energized card with one tumble crystal", "category": "Cards", "price_india": 650, "price_abroad": 650, "gst_rate": 18, "hsn_code": "4901", "is_service": False},
    {"name": "21 days energized one card with one bottle crystal", "category": "Cards", "price_india": 777, "price_abroad": 777, "gst_rate": 18, "hsn_code": "4901", "is_service": False},
    {"name": "21 days energized two cards with one bottle crystal", "category": "Cards", "price_india": 888, "price_abroad": 888, "gst_rate": 18, "hsn_code": "4901", "is_service": False},
    {"name": "21 days energized card", "category": "Cards", "price_india": 250, "price_abroad": 250, "gst_rate": 18, "hsn_code": "4901", "is_service": False},
    {"name": "knot magic", "category": "Rituals", "price_india": 250, "price_abroad": 250, "gst_rate": 18, "hsn_code": "9997", "is_service": True},

    # --- Medicine (GST 12%) ---
    {"name": "bach flower medicine 100ml", "category": "Medicine", "price_india": 3000, "price_abroad": 3000, "gst_rate": 12, "hsn_code": "3004", "is_service": False},
    {"name": "bach flower medicine - 50ml", "category": "Medicine", "price_india": 1500, "price_abroad": 1500, "gst_rate": 12, "hsn_code": "3004", "is_service": False},
    {"name": "bach flower medicine consultation", "category": "Medicine", "price_india": 111, "price_abroad": 111, "gst_rate": 12, "hsn_code": "9993", "is_service": True},

    # --- Classes (GST 5%) ---
    {"name": "reiki level one", "category": "Classes", "price_india": 666, "price_abroad": 666, "gst_rate": 5, "hsn_code": "9992", "is_service": True},
    {"name": "reiki level two", "category": "Classes", "price_india": 3000, "price_abroad": 3000, "gst_rate": 5, "hsn_code": "9992", "is_service": True},

    # --- Healing (GST 5%) ---
    {"name": "brahma mugurtha", "category": "Healing", "price_india": 999, "price_abroad": 999, "gst_rate": 5, "hsn_code": "9993", "is_service": True},
    {"name": "fullmoonday", "category": "Healing", "price_india": 111, "price_abroad": 111, "gst_rate": 5, "hsn_code": "9993", "is_service": True},
    {"name": "personal healing 6 sessions", "category": "Healing", "price_india": 6000, "price_abroad": 6000, "gst_rate": 5, "hsn_code": "9993", "is_service": True},
]

async def main():
    # Clear and insert
    await db.products.delete_many({})
    for p in products:
        p_obj = ProductCreate(**p)
        await db.products.insert_one(p_obj.model_dump())
    print(f"Successfully seeded {len(products)} products!")

if __name__ == "__main__":
    asyncio.run(main())

import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime
import uuid
from decimal import Decimal

def num_to_words(number):
    def _convert_nn(n):
        units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
        tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
        if n < 20: return units[n]
        return tens[n // 10] + (" " + units[n % 10] if n % 10 != 0 else "")

    def _convert_nnn(n):
        res = ""
        if n >= 100:
            res += _convert_nn(n // 100) + " Hundred"
            n %= 100
        if n > 0:
            if res != "": res += " and "
            res += _convert_nn(n)
        return res

    if number == 0: return "Zero Rupees Only"
    
    n = int(number)
    parts = []
    if n >= 10000000:
        parts.append(_convert_nnn(n // 10000000) + " Crore")
        n %= 10000000
    if n >= 100000:
        parts.append(_convert_nnn(n // 100000) + " Lakh")
        n %= 100000
    if n >= 1000:
        parts.append(_convert_nnn(n // 1000) + " Thousand")
        n %= 1000
    if n > 0:
        parts.append(_convert_nnn(n))
        
    return " ".join(parts) + " Rupees Only"

def get_hsn_details(product_name):
    p_lower = product_name.lower()
    if "reiki" in p_lower: return "9997", 5.0
    elif any(w in p_lower for w in ["crystal", "bracelet", "tumble", "zibu", "pyramid", "selenite"]): return "7103", 0.25
    elif "silver" in p_lower: return "7106", 3.0
    elif any(w in p_lower for w in ["tarot", "reading"]): return "9983", 18.0
    return "9983", 18.0 # Default

def generate_invoice_pdf(transaction: dict):
    if not transaction:
        raise ValueError("Transaction data is empty")
        
    # Setup directory
    inv_dir = "uploads/invoices"
    os.makedirs(inv_dir, exist_ok=True)
    
    # Sanitize transaction ID for filename
    raw_id = str(transaction.get('transaction_id', transaction.get('_id', 'TXN'))).strip()
    safe_tx_id = "".join([c if c.isalnum() else "_" for c in raw_id])[:15]
    
    file_name = f"INV-{safe_tx_id}-{uuid.uuid4().hex[:6]}.pdf"
    file_path = os.path.join(inv_dir, file_name)
    
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter
    
    # Draw Logo at top right
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    
    # Identify the base directory for assets (logo, signature)
    # Check both current and parent to support local/Docker paths
    base_dir = parent_dir if os.path.exists(os.path.join(parent_dir, "1003648003.png")) else current_dir
    logo_path = os.path.join(base_dir, "1003648003.png")
    
    if os.path.exists(logo_path):
        try:
            # Draw white background rectangle to avoid black backgrounds on transparent PNGs
            c.setFillColorRGB(1, 1, 1)
            c.rect(width - 145, height - 105, 110, 90, fill=1, stroke=0)
            
            # Position logo at top right
            c.drawImage(logo_path, width - 140, height - 100, width=100, height=80, preserveAspectRatio=True, mask='auto')
        except Exception as e:
            print(f"Error drawing logo: {e}")
    
    # --- Branding & Header ---
    branding_color = (0, 0.5, 0) # Green as per image
    c.setStrokeColorRGB(*branding_color)
    
    # Header Details
    c.setFont("Helvetica-Bold", 16)
    c.setFillColorRGB(0, 0, 0)
    c.drawString(50, height - 50, "Zeal Healing")
    
    c.setFont("Helvetica", 9)
    header_y = height - 65
    c.drawString(50, header_y, "1/A, Kollampatrai Street, Namakkal")
    c.drawString(50, header_y - 12, "Tamil Nadu - 637001")
    c.drawString(50, header_y - 24, "Phone no. : 9025574750")
    c.drawString(50, header_y - 36, "Email : baghyazeal@gmail.com")
    c.drawString(50, header_y - 48, "GSTIN : 33BJJP8989Q1Z7")
    c.drawString(50, header_y - 60, "State : 33-Tamil Nadu")
    
    c.setFont("Helvetica-Bold", 9)
    c.setFillColorRGB(*branding_color)
    c.drawString(50, header_y - 72, "Web : https://zealhealing.com/")
    
    # Horizontal Line
    c.setLineWidth(1.5)
    c.setStrokeColorRGB(*branding_color)
    c.line(50, header_y - 79, width - 50, header_y - 79)
    
    c.setFont("Helvetica-Bold", 14)
    c.setFillColorRGB(*branding_color)
    c.drawCentredString(width/2, header_y - 99, "Tax Invoice")
    
    # --- Invoice Info ---
    c.setFont("Helvetica-Bold", 10)
    c.setFillColorRGB(0,0,0)
    c.drawString(50, header_y - 112, "Bill To")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, header_y - 127, str(transaction.get('name')))
    c.setFont("Helvetica", 10)
    c.drawString(50, header_y - 142, f"Contact No. : {transaction.get('phone')}")
    
    # Calculate Financial Year (FY)
    now = datetime.utcnow()
    if now.month >= 4:
        fy = f"{now.year % 100}-{(now.year + 1) % 100}"
    else:
        fy = f"{(now.year - 1) % 100}-{now.year % 100}"
        
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(width - 50, header_y - 112, "Invoice Details")
    c.setFont("Helvetica", 9)
    inv_num = transaction.get('invoice_number', transaction.get('transaction_id', '')[:6])
    c.drawRightString(width - 50, header_y - 129, f"Invoice No. : ZH{fy}/{inv_num}")
    c.drawRightString(width - 50, header_y - 144, f"Date : {now.strftime('%d-%m-%Y')}")
    
    # --- Table Header ---
    table_top = header_y - 172
    c.setFillColorRGB(*branding_color)
    # Widen green box to 555 (width - 90)
    c.rect(50, table_top - 20, width - 90, 20, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(45, table_top - 13, "#")
    c.drawString(65, table_top - 13, "Item name")
    c.drawString(265, table_top - 13, "HSN/ SAC")
    c.drawString(320, table_top - 13, "Qty")
    c.drawString(355, table_top - 13, "Unit")
    c.drawString(400, table_top - 13, "Price/ Unit")
    c.drawString(470, table_top - 13, "GST")
    c.drawString(520, table_top - 13, "Amount")
    
    # --- Table Content ---
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica", 9)
    row_y = table_top - 35
    
    # Mirror Mode: Support Multiple Products
    products_raw = str(transaction.get('product', '-'))
    # Clean up and split by comma
    product_list = [p.strip() for p in products_raw.split(',') if p.strip()]
    if not product_list: product_list = ["-"]
    
    total_raw = float(transaction.get('total_amount', 0))
    # Divide amount equally among products for display
    amount_per_product = total_raw / len(product_list)
    
    # --- Logic: Manual/Excel Optimized ---
    items_list = transaction.get('invoice_items', [])
    gst_breakdown = transaction.get('gst_breakdown', [])
    shipping = Decimal(str(transaction.get('shipping', 0)))
    total_raw = Decimal(str(transaction.get('total_amount', 0)))
    
    total_unit_price = Decimal("0")
    total_gst = Decimal("0")
    
    if items_list:
        # Structured Mode (New)
        for i, item in enumerate(items_list):
            item_name = item.get('name')
            qty = Decimal(str(item.get('qty', 1)))
            price_each = Decimal(str(item.get('price', 0)))
            rate = Decimal(str(item.get('gst_rate', 0)))
            item_total = Decimal(str(item.get('total', 0)))
            hsn = item.get('hsn', '9983')
            
            item_base_total = price_each * qty
            item_gst_amt = item_total - item_base_total
            
            total_unit_price += item_base_total
            total_gst += item_gst_amt
            
            c.drawString(45, row_y, str(i + 1))
            c.drawString(65, row_y, item_name[:42])
            c.drawString(265, row_y, str(hsn))
            c.drawString(320, row_y, str(qty))
            c.drawString(355, row_y, "Nos")
            c.drawString(400, row_y, f"{price_each:,.2f}")
            c.drawString(470, row_y, f"{rate}%")
            c.drawString(520, row_y, f"{item_total:,.2f}")
            row_y -= 20
    else:
        # Fallback for old/manual without list 
        hsn, rate = get_hsn_details(products_raw)
        rate_dec = Decimal(str(rate))
        item_base = total_raw / (Decimal("1") + (rate_dec / Decimal("100")))
        item_gst = total_raw - item_base
        total_unit_price = item_base
        total_gst = item_gst
        
        c.drawString(45, row_y, "1")
        c.drawString(65, row_y, products_raw[:42])
        c.drawString(265, row_y, str(hsn))
        c.drawString(320, row_y, "1")
        c.drawString(355, row_y, "Nos")
        c.drawString(400, row_y, f"{item_base:,.2f}")
        c.drawString(470, row_y, f"{rate}%")
        c.drawString(520, row_y, f"{total_raw:,.2f}")
    
    rounded_total = round(total_raw)
    round_off = rounded_total - total_raw
    
    # --- Footer Calculations ---
    calc_y = row_y - 20 
    c.setFont("Helvetica", 10)
    c.drawString(50, calc_y, "Invoice Amount In Words")
    c.setFont("Helvetica-Bold", 9)
    c.drawString(50, calc_y - 12, num_to_words(rounded_total))
    
    c.drawRightString(450, calc_y, "Sub Total (Excl. Tax)")
    c.drawRightString(580, calc_y, f"{total_unit_price:,.2f}")
    
    row_offset = 15
    if gst_breakdown:
        for gd in gst_breakdown:
            rate = gd.get('rate')
            cgst = gd.get('cgst')
            sgst = gd.get('sgst')
            if val := gd.get('total', 0) > 0:
                c.drawRightString(450, calc_y - row_offset, f"SGST@{rate/2}%")
                c.drawRightString(580, calc_y - row_offset, f"{sgst:,.2f}")
                row_offset += 15
                c.drawRightString(450, calc_y - row_offset, f"CGST@{rate/2}%")
                c.drawRightString(580, calc_y - row_offset, f"{cgst:,.2f}")
                row_offset += 15
    else:
        # Fallback split
        c.drawRightString(450, calc_y - 15, f"SGST Split")
        c.drawRightString(580, calc_y - 15, f"{total_gst/2:,.2f}")
        c.drawRightString(450, calc_y - 30, f"CGST Split")
        c.drawRightString(580, calc_y - 30, f"{total_gst/2:,.2f}")
        row_offset = 45

    if shipping > 0:
        c.drawRightString(450, calc_y - row_offset, "Shipping Charges")
        c.drawRightString(580, calc_y - row_offset, f"{shipping:,.2f}")
        row_offset += 15

    c.drawRightString(450, calc_y - row_offset, "Round off")
    c.drawRightString(580, calc_y - row_offset, f"{round_off:,.2f}")
    
    # Total Box
    c.setFillColorRGB(*branding_color)
    c.rect(400, calc_y - row_offset - 30, 190, 22, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(410, calc_y - row_offset - 24, "Grand Total")
    c.drawRightString(580, calc_y - row_offset - 24, f"Rs. {rounded_total:,.2f}")
    
    # Bottom Summary
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica", 10)
    summary_y = calc_y - row_offset - 60
    
    paid_amount = transaction.get("paid_amount")
    balance = transaction.get("balance")
    
    # If paid_amount is missing, default to total (old behavior) or as specified
    display_paid = paid_amount if paid_amount is not None else rounded_total
    display_balance = balance if balance is not None else 0.0
    
    c.drawRightString(450, summary_y, "Received")
    c.drawRightString(580, summary_y, f"{display_paid:,.2f}")
    c.drawRightString(450, summary_y - 15, "Balance")
    c.drawRightString(580, summary_y - 15, f"{display_balance:,.2f}")
    
    
    # Signatory
    sign_y = 100
    
    # Draw Signature Image (Top)
    signature_path = os.path.join(base_dir, "signature.jpg")
    if os.path.exists(signature_path):
        try:
            c.drawImage(signature_path, width - 170, sign_y + 35, width=100, height=45, preserveAspectRatio=True, mask='auto')
        except Exception as e:
            print(f"Error drawing signature: {e}")

    # Text (Middle)
    c.setFont("Helvetica", 10)
    c.drawCentredString(width - 120, sign_y + 15, "From Zeal Healing")

    # Image or Name (Bottom)
    c.setFont("Helvetica-BoldOblique", 12)
    c.drawCentredString(width - 120, sign_y, "Authorised Signatory")
    
    c.save()
    
    return f"/uploads/invoices/{file_name}"

import requests

def send_whatsapp_invoice(phone: str, invoice_url: str):
    print(f"[WhatsApp Worker] Dispatching invoice to {phone}")
    
    # Calculate absolute path for the Node.js service to read the file
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # invoice_url is like "/uploads/invoices/INV-xxx.pdf"
    # We strip the leading slash to join correctly
    relative_path = invoice_url.lstrip("/") 
    absolute_file_path = os.path.join(base_dir, relative_path)
    
    try:
        wa_url = os.getenv("WA_SERVICE_URL", "http://localhost:3001")
        response = requests.post(f'{wa_url}/api/whatsapp/send', json={
            "phone": phone,
            "filePath": absolute_file_path,
            "message": "Hello, please find your attached invoice from Zeal Healing. Thank you!"
        })
        
        if response.status_code == 200:
             return {"status": "success", "message": "Invoice sent via WhatsApp"}
        else:
             print(f"WhatsApp API Error: {response.text}")
             return {"status": "error", "message": "Failed to send via Node.js service"}
             
    except Exception as e:
        print(f"WhatsApp Service Connection Error: {e}")
        return {"status": "error", "message": "WhatsApp Microservice is offline"}

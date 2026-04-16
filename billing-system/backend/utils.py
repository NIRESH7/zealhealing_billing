import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime
import uuid

def generate_invoice_pdf(transaction: dict):
    # Setup directory
    inv_dir = "uploads/invoices"
    os.makedirs(inv_dir, exist_ok=True)
    
    # Sanitize transaction ID for filename
    raw_id = str(transaction.get('transaction_id', 'TXN')).strip()
    safe_tx_id = "".join([c if c.isalnum() else "_" for c in raw_id])[:15]
    
    file_name = f"INV-{safe_tx_id}-{uuid.uuid4().hex[:6]}.pdf"
    file_path = os.path.join(inv_dir, file_name)
    
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter
    
    # --- Branding & Header ---
    branding_color = (0, 0.5, 0) # Green as per image
    c.setStrokeColorRGB(*branding_color)
    
    # Header Details
    c.setFont("Helvetica-Bold", 16)
    c.setFillColorRGB(0, 0, 0)
    c.drawString(50, height - 50, "Zeal Healing")
    
    c.setFont("Helvetica", 9)
    header_y = height - 65
    c.drawString(50, header_y, "19/10A THIRUCHENGODE ROAD Namakkal")
    c.drawString(50, header_y - 12, "Phone no. : 9025574750")
    c.drawString(50, header_y - 24, "Email : baghyazeal@gmail.com")
    c.drawString(50, header_y - 36, "GSTIN : 33BJJP8989Q1Z7")
    c.drawString(50, header_y - 48, "State : 33-Tamil Nadu")
    
    # Horizonatal Line
    c.setLineWidth(1.5)
    c.setStrokeColorRGB(*branding_color)
    c.line(50, header_y - 55, width - 50, header_y - 55)
    
    c.setFont("Helvetica-Bold", 14)
    c.setFillColorRGB(*branding_color)
    c.drawCentredString(width/2, header_y - 75, "Tax Invoice")
    
    # --- Invoice Info ---
    c.setFont("Helvetica-Bold", 10)
    c.setFillColorRGB(0,0,0)
    c.drawString(50, header_y - 100, "Bill To")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, header_y - 115, str(transaction.get('name')))
    c.setFont("Helvetica", 10)
    c.drawString(50, header_y - 130, f"Contact No. : {transaction.get('phone')}")
    
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(width - 50, header_y - 100, "Invoice Details")
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 50, header_y - 115, f"Invoice No. : ZH-FY25-26/{transaction.get('transaction_id')[:6]}")
    c.drawRightString(width - 50, header_y - 130, f"Date : {datetime.utcnow().strftime('%d-%m-%Y')}")
    
    # --- Table Header ---
    table_top = header_y - 150
    c.setFillColorRGB(*branding_color)
    # Widen green box to 555 (width - 90)
    c.rect(50, table_top - 20, width - 90, 20, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(55, table_top - 13, "#")
    c.drawString(75, table_top - 13, "Item name")
    c.drawString(190, table_top - 13, "HSN/ SAC")
    c.drawString(250, table_top - 13, "Quantity")
    c.drawString(310, table_top - 13, "Unit")
    c.drawString(360, table_top - 13, "Price/ Unit")
    c.drawString(430, table_top - 13, "GST")
    c.drawString(490, table_top - 13, "Amount")
    
    # --- Table Content ---
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica", 9)
    row_y = table_top - 35
    
    # Mirror Mode: Calculate split from Total BEFORE drawing
    total_raw = float(transaction.get('total_amount', 0))
    rate = float(transaction.get('gst_rate', 18.0))
    
    # Back-calculate Base and GST
    unit_price = total_raw / (1 + (rate / 100))
    gst_amt = total_raw - unit_price
    cgst = sgst = gst_amt / 2
    
    rounded_total = round(total_raw)
    round_off = rounded_total - total_raw

    c.drawString(55, row_y, "1")
    c.drawString(75, row_y, str(transaction.get('product'))[:35])
    c.drawString(190, row_y, str(transaction.get('hsn_code')))
    c.drawString(250, row_y, "1")
    c.drawString(310, row_y, "Nos")
    c.drawString(360, row_y, f"{unit_price:,.2f}")
    c.drawString(430, row_y, f"{rate}%")
    c.drawString(490, row_y, f"{total_raw:,.2f}")
    
    # --- Footer Calculations ---
    calc_y = row_y - 40
    c.setFont("Helvetica", 10)
    c.drawString(50, calc_y, "Invoice Amount In Words")
    c.setFont("Helvetica-Bold", 9)
    # Simple amount in words mock
    c.drawString(50, calc_y - 12, "Rupees only") # Placeholder
    
    c.drawRightString(450, calc_y, "Sub Total")
    c.drawRightString(580, calc_y, f"{unit_price:,.2f}")
    
    c.drawRightString(450, calc_y - 15, f"SGST@{rate/2}%")
    c.drawRightString(580, calc_y - 15, f"{sgst:,.2f}")
    
    c.drawRightString(450, calc_y - 30, f"CGST@{rate/2}%")
    c.drawRightString(580, calc_y - 30, f"{cgst:,.2f}")
    
    c.drawRightString(450, calc_y - 45, "Round off")
    c.drawRightString(580, calc_y - 45, f"{round_off:,.2f}")
    
    # Total Box - Added 20px gap from Round off
    c.setFillColorRGB(*branding_color)
    c.rect(400, calc_y - 85, 190, 20, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(410, calc_y - 79, "Total")
    c.drawRightString(580, calc_y - 79, f"{rounded_total:,.2f}")
    
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica", 10)
    c.drawRightString(450, calc_y - 100, "Received")
    c.drawRightString(580, calc_y - 100, f"{rounded_total:,.2f}")
    c.drawRightString(450, calc_y - 115, "Balance")
    c.drawRightString(580, calc_y - 115, "0.00")
    
    # Lines
    c.setLineWidth(0.5)
    c.setStrokeColorRGB(0.8, 0.8, 0.8)
    c.line(50, row_y - 15, width - 50, row_y - 15)
    
    # Signatory
    sign_y = 100
    c.setFont("Helvetica", 10)
    c.drawCentredString(width - 120, sign_y + 40, "For :Zeal Healing")
    # Image or Name
    c.setFont("Helvetica-BoldOblique", 12)
    c.drawCentredString(width - 120, sign_y + 15, "Authorised Signatory")
    
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
        response = requests.post('http://localhost:3001/api/whatsapp/send', json={
            "phone": phone,
            "filePath": absolute_file_path,
            "message": "Hello, please find your attached invoice from ABC Training Solutions. Thank you!"
        })
        
        if response.status_code == 200:
             return {"status": "success", "message": "Invoice sent via WhatsApp"}
        else:
             print(f"WhatsApp API Error: {response.text}")
             return {"status": "error", "message": "Failed to send via Node.js service"}
             
    except Exception as e:
        print(f"WhatsApp Service Connection Error: {e}")
        return {"status": "error", "message": "WhatsApp Microservice is offline"}

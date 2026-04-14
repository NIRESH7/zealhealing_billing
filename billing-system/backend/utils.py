import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime
import uuid

def generate_invoice_pdf(transaction: dict):
    # Setup directory
    inv_dir = "uploads/invoices"
    os.makedirs(inv_dir, exist_ok=True)
    
    file_name = f"INV-{transaction.get('transaction_id')}-{uuid.uuid4().hex[:6]}.pdf"
    file_path = os.path.join(inv_dir, file_name)
    
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter
    
    # --- Styles & Layout ---
    primary_color = (0.1, 0.4, 0.7) # Deep Blue
    c.setStrokeColorRGB(*primary_color)
    
    # 1. Header Section
    c.setFont("Helvetica-Bold", 18)
    c.setFillColorRGB(*primary_color)
    c.drawCentredString(width/2, height - 50, "ABC TRAINING SOLUTIONS")
    
    c.setFont("Helvetica", 10)
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.drawCentredString(width/2, height - 65, "123 Business Plaza, Chennai, India - 600001")
    c.drawCentredString(width/2, height - 78, "Email: info@abctraining.com | Ph: +91 9876543210")
    
    # Horizontal Line
    c.setLineWidth(0.5)
    c.line(50, height - 90, width - 50, height - 90)
    
    # 2. Invoice Meta Info
    c.setFont("Helvetica-Bold", 12)
    c.drawString(width - 150, height - 110, "TAX INVOICE")
    
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 50, height - 125, f"Invoice No: INV-{transaction.get('transaction_id')[:8].upper()}")
    c.drawRightString(width - 50, height - 140, f"Date: {datetime.utcnow().strftime('%d/%m/%Y')}")
    
    # 3. Billed To Section
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 125, "Billed To:")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 140, f"Name: {transaction.get('name')}")
    c.drawString(50, height - 155, f"Phone: {transaction.get('phone')}")
    if transaction.get('email'):
        c.drawString(50, height - 170, f"Email: {transaction.get('email')}")
        c.drawString(50, height - 185, f"Transaction ID: {transaction.get('transaction_id')}")
        table_top = height - 230
    else:
        c.drawString(50, height - 170, f"Transaction ID: {transaction.get('transaction_id')}")
        table_top = height - 210
    
    # 4. Items Table
    c.setFillColorRGB(0.95, 0.95, 0.95)
    c.rect(50, table_top - 20, width - 100, 20, fill=1, stroke=1)
    
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(60, table_top - 14, "S.No")
    c.drawString(100, table_top - 14, "Description")
    c.drawString(300, table_top - 14, "HSN/SAC")
    c.drawString(370, table_top - 14, "Qty")
    c.drawString(420, table_top - 14, "Unit Price")
    c.drawString(500, table_top - 14, "Amount")
    
    # Item Row
    row_y = table_top - 40
    c.setFont("Helvetica", 9)
    c.drawString(60, row_y, "1")
    product_name = str(transaction.get("product"))
    if len(product_name) > 42:
        product_name = product_name[:39] + "..."
    c.drawString(100, row_y, product_name)
    c.drawString(300, row_y, "9983") # Mocked HSN for training
    c.drawString(370, row_y, "1")
    c.drawString(420, row_y, f"{transaction.get('amount'):,.2f}")
    c.drawString(500, row_y, f"{transaction.get('amount'):,.2f}")
    
    # Grid lines for table
    c.line(50, table_top - 50, width - 50, table_top - 50)
    
    # 5. Calculations
    calc_start = table_top - 80
    amount = float(transaction.get("amount"))
    cgst = amount * 0.09
    sgst = amount * 0.09
    total_gst = cgst + sgst
    grand_total = amount + total_gst
    
    c.setFont("Helvetica", 10)
    c.drawRightString(480, calc_start, "Subtotal:")
    c.drawRightString(550, calc_start, f"{amount:,.2f}")
    
    c.drawRightString(480, calc_start - 15, "CGST @ 9%:")
    c.drawRightString(550, calc_start - 15, f"{cgst:,.2f}")
    
    c.drawRightString(480, calc_start - 30, "SGST @ 9%:")
    c.drawRightString(550, calc_start - 30, f"{sgst:,.2f}")
    
    c.line(400, calc_start - 40, width - 50, calc_start - 40)
    
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(480, calc_start - 55, "Grand Total:")
    c.drawRightString(550, calc_start - 55, f"INR {grand_total:,.2f}")
    
    # 6. Amount in Words (simple mock or library needed, but we'll just format the number for now)
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(50, calc_start - 80, f"Amount in Words: {grand_total:,.0f} Rupees Only")
    
    # 7. Signature & Footer
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(width - 50, 150, "For ABC Training Solutions")
    c.line(width - 150, 100, width - 50, 100)
    c.drawRightString(width - 50, 85, "Authorized Signatory")
    
    c.setFont("Helvetica", 9)
    c.drawCentredString(width/2, 50, "Thank you for your business!")
    c.setFont("Helvetica-Oblique", 8)
    c.drawCentredString(width/2, 38, "E. & O.E. This is a computer generated invoice and does not require a signature.")
    
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

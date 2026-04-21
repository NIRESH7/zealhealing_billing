import openpyxl
import os

folder = r"c:\Users\prane\Desktop\zeal_healing(web)\BILLING_WEB\billing-system"
files = [f for f in os.listdir(folder) if f.endswith('.xlsx')]

for f in files:
    path = os.path.join(folder, f)
    print(f"\n--- {f} ---")
    try:
        wb = openpyxl.load_workbook(path, data_only=True)
        sheet = wb.active
        for row in sheet.iter_rows(max_row=3, values_only=True):
            print(row)
    except Exception as e:
        print(f"Error reading {f}: {e}")

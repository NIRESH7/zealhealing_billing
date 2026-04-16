import openpyxl
import os

path = r'c:\Users\Admin\Desktop\zeal healing\BILLING_WEB\billing-system\Untitled spreadsheet.xlsx'
wb = openpyxl.load_workbook(path, data_only=True)
sheet = wb.active

print("| DATE | NAME | CONTACT NO | TRANSACTION ID | AMOUNT | DETAILS |")
print("|------|------|------------|----------------|--------|---------|")

for row in list(sheet.iter_rows(min_row=1, max_row=6, values_only=True)):
    # Fill missing values with '-'
    r = [str(c).strip() if c is not None else "-" for c in row]
    # Ensure we show exactly 6 columns
    r = (r + ["-"] * 6)[:6]
    print(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} |")

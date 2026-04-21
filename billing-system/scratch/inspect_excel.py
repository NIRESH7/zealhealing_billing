import openpyxl
import os

file_path = r"c:\Users\Admin\Desktop\zeal healing\BILLING_WEB\billing-system\cleaned_excel.xlsx"
if os.path.exists(file_path):
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb.active
    for i, row in enumerate(sheet.iter_rows(values_only=True)):
        print(row)
        if i > 10: break
else:
    print("File not found")

import openpyxl

try:
    wb = openpyxl.load_workbook('final_billing_20_users (1).xlsx', data_only=True)
    sheet = wb.active
    print(f"Sheet Name: {sheet.title}")
    
    # Print first 10 rows
    for i, row in enumerate(sheet.iter_rows(max_row=10, values_only=True)):
        print(f"Row {i}: {row}")

except Exception as e:
    print(f"Error: {e}")

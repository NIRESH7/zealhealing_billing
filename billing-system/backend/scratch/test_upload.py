import requests

files = {'file': open('../../cleaned_excel.xlsx', 'rb')}
response = requests.post('http://127.0.0.1:8000/api/transactions/upload', files=files)
print(response.status_code)
print(response.text)

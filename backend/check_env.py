import sys
print(f"Python version: {sys.version}")

try:
    import fastapi
    import sqlalchemy
    import pydantic
    import pandas
    import openpyxl
    import qrcode
    import sklearn
    import jwt
    import bcrypt
    print("SUCCESS: All core backend packages are installed and functional!")
except Exception as e:
    print(f"IMPORT ERROR: {e}")

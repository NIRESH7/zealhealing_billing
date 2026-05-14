import bcrypt

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# The hash I created in create_admin.py for 'admin123'
password = "admin123"
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
hashed_str = hashed.decode('utf-8')

print(f"Hashed: {hashed_str}")
print(f"Verify: {verify_password(password, hashed_str)}")

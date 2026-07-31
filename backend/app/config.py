import os
import secrets

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = secrets.token_hex(32)
    print(
        "WARNING: No SECRET_KEY set. Using a randomly generated key for this run only "
        "— everyone will be logged out on the next restart. Add SECRET_KEY=<a long random "
        "string> to a .env file in the backend folder to keep logins stable across restarts."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # 8 hours

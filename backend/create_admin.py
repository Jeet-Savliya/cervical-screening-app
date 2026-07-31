"""
Run this once to create a login for the app.

Usage (from the backend folder, with the virtual environment active):
    python create_admin.py

You can run it again later to add another staff login.
"""
import getpass

from app import models
from app.auth import hash_password
from app.database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)


def read_password(prompt):
    """
    Tries hidden password entry first. If that produces an empty result
    (some terminals, e.g. certain VS Code setups, don't handle it reliably),
    falls back to visible input so setup isn't blocked.
    """
    value = getpass.getpass(prompt)
    if value:
        return value
    print("(Hidden input didn't seem to register — you'll see it as you type this time.)")
    return input(prompt)


def main():
    db = SessionLocal()
    try:
        username = input("Choose a username: ").strip()
        if not username:
            print("Username cannot be empty.")
            return

        if db.query(models.User).filter(models.User.username == username).first():
            print(f"A user named '{username}' already exists.")
            return

        password = read_password("Choose a password: ")
        confirm = read_password("Confirm password: ")
        if not password:
            print("Password cannot be empty.")
            return
        if password != confirm:
            print("Passwords did not match. Please run the script again.")
            return

        user = models.User(username=username, hashed_password=hash_password(password))
        db.add(user)
        db.commit()
        print(f"\nUser '{username}' created. You can now log in with these credentials.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

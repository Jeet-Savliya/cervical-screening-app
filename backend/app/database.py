import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# Local development uses SQLite automatically if DATABASE_URL isn't set.
# In production, set DATABASE_URL to your Postgres (e.g. Neon) connection string.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cervical_screening.db")

# Some providers hand out "postgres://" URLs (old Heroku-style scheme).
# SQLAlchemy needs "postgresql://" — normalize it so either form works.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

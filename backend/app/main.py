import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models
from .database import engine
from .routers import admin, auth, patients, images, reference, reviews

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cervical Cancer Risk Screening API")

# Comma-separated list of allowed frontend origins, e.g.:
#   ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:5173
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allow_origins = [origin.strip() for origin in _allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
app.mount("/uploads", StaticFiles(directory=os.path.join(BASE_DIR, "uploads")), name="uploads")

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(patients.router)
app.include_router(images.router)
app.include_router(reference.router)
app.include_router(reviews.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}

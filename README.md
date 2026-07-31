# Cervical cancer risk screening assistant

A starter full-stack app:
- **Backend**: FastAPI + SQLite (Python)
- **Frontend**: React + Vite

Features:
- Patient intake form with the agreed risk-factor fields
- Automatic risk-factor scoring (Low / Medium / High) — a starting heuristic, meant to be
  refined with the doctor's input
- Photo upload for referral images
- A reference image library the doctor curates herself, organized by VIA finding category
- A side-by-side comparison view (patient photo vs. reference library) where the doctor
  selects the matching finding — this is decision support, not an automated diagnosis

See `SETUP_GUIDE.md` for full step-by-step Windows + VS Code instructions.

## Quick start (once dependencies are installed — see setup guide)

**Backend** (from `backend/`):
```
venv\Scripts\activate
uvicorn app.main:app --reload
```
Runs at http://localhost:8000 — interactive API docs at http://localhost:8000/docs

**Frontend** (from `frontend/`):
```
npm run dev
```
Runs at http://localhost:5173

## Project structure

```
cervical-screening-app/
  backend/
    app/
      main.py            FastAPI app entrypoint
      database.py         SQLite/SQLAlchemy setup
      models.py            DB tables
      schemas.py           Request/response shapes
      risk_score.py        Risk scoring heuristic (READ THE COMMENTS HERE)
      routers/
        patients.py         Create/list patients + risk factors
        images.py           Patient photo upload
        reference.py        Reference image library
        reviews.py          Doctor's case review/finding
    requirements.txt
    uploads/                Uploaded images land here
  frontend/
    src/
      pages/
        IntakeForm.jsx        Patient intake form
        DoctorDashboard.jsx    List of cases with risk levels
        ReferenceLibrary.jsx   Doctor uploads/manages reference images
        CaseDetail.jsx         Risk score + comparison + notes
      components/
        ImageComparison.jsx    The side-by-side comparison widget
```

## Important notes for you and your client

1. **This is a triage/decision-support tool, not a diagnostic tool.** The risk score and the
   VIA finding are both meant to support the doctor's judgement, not replace it. Keep that
   framing in any client-facing description of the product.
2. **The risk scoring weights in `risk_score.py` are placeholders.** Sit with the doctor and
   adjust them (or replace the function entirely) based on her clinical experience.
3. **This currently has no authentication.** Before this touches real patient data, add login
   for the doctor/staff and lock down who can view patient records. Ask if you want help
   adding this next.
4. **SQLite is fine for development and even a small single-clinic deployment.** If this ever
   needs to run on a shared server with concurrent users, migrate to PostgreSQL — the
   SQLAlchemy models will need only the connection string changed.
5. **Encrypt sensitive data at rest before going live** — patient data and images should not
   sit as plain files/plaintext DB fields in a production deployment.

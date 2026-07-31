# Step-by-step setup guide (Windows + VS Code)

## 1. Install prerequisites (one-time)

### Python
1. Go to https://www.python.org/downloads/ and download the latest Python 3.11 or 3.12 installer.
2. Run the installer. **Important**: on the first screen, check "Add python.exe to PATH" before clicking Install.
3. Verify: open Command Prompt (`Win + R`, type `cmd`, Enter) and run:
   ```
   python --version
   ```
   You should see something like `Python 3.12.x`.

### Node.js
1. Go to https://nodejs.org and download the **LTS** version for Windows.
2. Run the installer with default options.
3. Verify:
   ```
   node --version
   npm --version
   ```

### VS Code
1. Go to https://code.visualstudio.com and install it if you haven't already.
2. Recommended extensions (open VS Code → Extensions icon on the left sidebar → search and install):
   - **Python** (by Microsoft)
   - **ES7+ React/Redux/React-Native snippets**
   - **Prettier - Code formatter**

## 2. Unzip the project

1. Extract the provided zip file somewhere simple, e.g. `C:\Projects\cervical-screening-app`.
2. Open VS Code → File → Open Folder → select `cervical-screening-app`.

You should see `backend/` and `frontend/` folders in the Explorer sidebar.

## 3. Set up the backend

Open a terminal in VS Code: **Terminal → New Terminal**. Make sure it's a Command Prompt or
PowerShell terminal, then run:

```
cd backend
python -m venv venv
venv\Scripts\activate
```

Your terminal prompt should now show `(venv)` at the start of the line — that means you're
inside the virtual environment.

Now install the Python dependencies:

```
pip install -r requirements.txt
```

This installs:
- **fastapi** — the web framework for the API
- **uvicorn** — the server that runs the FastAPI app
- **sqlalchemy** — talks to the SQLite database
- **pydantic** — validates request/response data shapes
- **python-multipart** — needed for handling file (image) uploads
- **python-dotenv** — loads settings from a `.env` file
- **pyjwt** — creates and verifies login tokens
- **bcrypt** — securely hashes passwords (never stored in plain text)
- **alembic** — manages database schema changes without losing data

### Set a login secret (recommended)

Copy `.env.example` to `.env` in the `backend` folder and put a random string as `SECRET_KEY`.
This keeps everyone logged in across server restarts. If you skip this, the app still works,
but a random key is generated each time you start the server — meaning every login is
invalidated whenever you restart it.

```
copy .env.example .env
```

Then open `.env` in VS Code and replace the placeholder with a real random string. You can
generate one with:

```
python -c "import secrets; print(secrets.token_hex(32))"
```

### Apply the database schema

```
alembic upgrade head
```

This creates `cervical_screening.db` with all the current tables. You only need to re-run this
when told to (after a schema change) — it won't erase existing data.

### Create your login

```
python create_admin.py
```

Follow the prompts to choose a username and password. This is the login you'll use in the app —
run it again anytime to add another staff login.

Start the backend:

```
uvicorn app.main:app --reload
```

You should see something like `Uvicorn running on http://127.0.0.1:8000`. Leave this terminal
running. Open http://localhost:8000/docs in your browser — you should see the interactive API
documentation (Swagger UI). This confirms the backend works.

## 4. Set up the frontend

Open a **second** terminal in VS Code (click the `+` icon in the terminal panel, or
**Terminal → Split Terminal**), then:

```
cd frontend
npm install
```

This installs:
- **react** / **react-dom** — the UI library
- **react-router-dom** — page navigation (intake form / dashboard / case detail)
- **axios** — makes HTTP requests to the backend API
- **vite** — the dev server and build tool
- **@vitejs/plugin-react** — lets Vite understand React/JSX files

Start the frontend:

```
npm run dev
```

You should see `Local: http://localhost:5173/`. Open that URL in your browser.

## 5. Using the app

With both servers running (backend on port 8000, frontend on port 5173):

1. Open http://localhost:5173 — you'll land on a **login page**. Sign in with the
   username/password you set up with `create_admin.py`.
2. Go to **Reference library** first and upload a handful of the doctor's own reference
   images, tagged by category (VIA negative / VIA positive / suspicious of cancer), so the
   comparison view has something to show.
3. Go to **Patient intake**, fill in a test patient. You must check the **consent checkbox**
   before the form can be submitted — this is required and stamped with a timestamp.
4. On the case page you'll see the computed risk score/level, and below it the comparison
   view: the patient's uploaded photo next to the filterable reference library. Clicking a
   reference image records it as the selected finding.
5. Click **Generate summary** at the top of the case page for a clean, printable referral
   summary — patient details, risk factors, VIA finding, and doctor's notes. Use the
   "Print / Save as PDF" button (this uses your browser's own print function — choose
   "Save as PDF" as the destination if you want a PDF file instead of a physical printout).
6. Go to **Doctor dashboard** to see all patients, searchable by name and filterable by risk
   level. There's also a **Download backup** button here — it downloads a single zip file
   containing the database and all uploaded images. Worth doing this regularly, especially
   before any Windows update or laptop change.

## 6. Stopping and restarting later

To stop either server, click into its terminal and press `Ctrl + C`.

To start again next time you open the project:

**Backend:**
```
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

**Frontend:**
```
cd frontend
npm run dev
```

(You don't need to reinstall dependencies again — only `python -m venv venv` and
`npm install` are one-time setup steps, unless you delete the `venv` or `node_modules`
folders.)

## 7. Where things are stored

- The database is a single file: `backend/cervical_screening.db` (created by `alembic upgrade
  head`). You can inspect it with a free tool like
  [DB Browser for SQLite](https://sqlitebrowser.org/) if you want to peek at the raw data.
- Uploaded images land in `backend/uploads/patient_images/` and
  `backend/uploads/reference_images/`.

## 8. When the database schema changes in the future

Previously, any change to `models.py` meant deleting `cervical_screening.db` and losing all
data. That's no longer necessary. Whenever Claude changes `models.py` going forward, it will
also hand you a new file under `backend/migrations/versions/`. To apply it:

```
cd backend
venv\Scripts\activate
alembic upgrade head
```

This updates your existing database in place — your patients, images, and reviews stay intact.
You do **not** need to delete the database file for this.

## 9. Common issues

- **"python is not recognized"** — Python wasn't added to PATH during install. Re-run the
  Python installer and check "Add to PATH", or search "Environment Variables" in Windows
  and add the Python install folder manually.
- **"port 8000 already in use"** — another program (maybe a previous uvicorn run) is using
  it. Close that terminal/process, or run uvicorn on a different port:
  `uvicorn app.main:app --reload --port 8001` (and update `API_BASE` in
  `frontend/src/api.js` to match).
- **CORS errors in the browser console** — make sure the backend is running on port 8000 and
  the frontend on port 5173; the backend is currently configured to only allow requests from
  `http://localhost:5173`.
- **Images not showing up** — double check the file was actually uploaded (check
  `backend/uploads/...` folders) and that both servers are running.

## 10. Deploying for real: Supabase (database + storage) + hosting

Everything above runs the app locally on your own machine. When you're ready to put it on a
real URL the doctor can use, follow this path. It replaces local SQLite storage and local photo
storage with a proper hosted database and hosted file storage — both from one free account,
no credit card required.

### Step 1: Create your Supabase project

1. Go to https://supabase.com and sign up (no credit card needed).
2. Create a new project. Give it any name, e.g. "cervical-screening", and set a database
   password when asked — **save this password**, you'll need it in the next step.
3. Wait for the project to finish provisioning (a minute or two).
4. Go to **Project Settings → Database**, and copy the **connection string** — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres
   ```
   Replace `[YOUR-PASSWORD]` with the password you set in step 2.

### Step 2: Create your storage bucket

1. In the Supabase sidebar, go to **Storage**.
2. Create a new bucket, e.g. `patient-photos`. Mark it **public** so photos can be viewed
   directly by URL.
3. Go to **Project Settings → Storage**, and find the **S3 Connection** section. Copy:
   - The **Endpoint URL** (looks like `https://xxxxxxxx.supabase.co/storage/v1/s3`)
   - The **Region**
4. On the same page (or under "Access Keys"), create a new **S3 access key** — copy the
   **Access Key ID** and **Secret Access Key** shown.
5. Your public file URL base will be:
   ```
   https://xxxxxxxx.supabase.co/storage/v1/object/public/patient-photos
   ```
   (same project ref as your endpoint URL, with your bucket name at the end)

### Step 3: Update your `.env` file with real values

In `backend/.env`, fill in (uncomment and replace) these lines with what you collected above:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres
S3_ENDPOINT_URL=https://xxxxxxxx.supabase.co/storage/v1/s3
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_NAME=patient-photos
S3_PUBLIC_URL=https://xxxxxxxx.supabase.co/storage/v1/object/public/patient-photos
```

### Step 4: Apply your schema to the new database

```
alembic upgrade head
```
This runs against whatever `DATABASE_URL` points to — since it's now set, this creates all your
tables in Supabase instead of a local file.

### Step 5: Test locally against the real database first

Start the backend as usual (`uvicorn app.main:app --reload`) and the frontend
(`npm run dev`), and try creating a test patient with a photo. If it works, your photo just went
to Supabase Storage and your patient record just went to Supabase's Postgres database — you can
verify this by checking the **Table Editor** and **Storage** sections of the Supabase dashboard.

One thing to know: free Supabase projects pause automatically after 7 days with no database
activity, and need to be manually unpaused from the dashboard. Fine for a clinic used regularly;
worth remembering if there's ever a long gap in use.

### Step 6: Deploy the backend (Render)

1. Push your `backend` folder to a GitHub repository (Render deploys from GitHub).
2. Go to https://render.com, sign up, and create a new **Web Service** pointing at that repo.
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment**, add every variable from your `.env` file (`DATABASE_URL`, `SECRET_KEY`,
   the `S3_*` ones, etc.) — Render needs these set directly, it won't read your local `.env` file.
6. Once deployed, Render gives you a URL like `https://your-app.onrender.com`. Note it down.
7. Add an `ALLOWED_ORIGINS` environment variable with your frontend's URL from Step 7 below (you
   may need to add this after deploying the frontend and come back to update it).

### Step 7: Deploy the frontend (Netlify)

1. Push your `frontend` folder to GitHub (can be the same repo, different folder).
2. Go to https://netlify.com, sign up, and click **Add new site → Import an existing project**.
3. Connect your GitHub account and pick this repo. If `frontend` is a subfolder of a larger
   repo, set **Base directory** to `frontend`.
4. Set:
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist` (or just `dist` if you set the base directory above)
5. Under **Environment variables**, add: `VITE_API_BASE` = your Render backend URL from Step 6.
6. Click **Deploy**. Netlify gives you a URL like `https://your-app.netlify.app`.
7. Go back to Render and set `ALLOWED_ORIGINS` to this Netlify URL, so the backend accepts
   requests from it.

### Step 8: Final check

Open your Netlify URL, submit a test patient, and confirm it appears correctly. From here on,
this is a real, persistent, live deployment — nothing gets wiped on restart, since the database
and photos both live outside the app's own servers now.

## 11. Suggested next steps once this is working

- Move image/database storage to encrypted storage before using real patient data.
- Sit with the doctor to review and adjust the weights in `backend/app/risk_score.py`.
- Store backup zip files somewhere other than the same laptop (a password-protected cloud
  folder or external drive) — a local backup doesn't help if the laptop itself is lost, stolen,
  or damaged.
- Once you've accumulated enough doctor-reviewed cases, consider training an actual ML model
  on that labeled data as a second-phase improvement.

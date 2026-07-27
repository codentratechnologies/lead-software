# Codentra AI Lead Generator - Quick Start Guide

```bash
.\start.bat
```

* The API will be available at `http://localhost:8000`
* The Dashboard will be available at `http://localhost:3000/dashboard`

---

## Manual Startup (Alternative)

If you prefer to start things manually, you will need two separate terminal windows. *(Note: The Celery background worker is bypassed in local MVP mode, so a third terminal is no longer needed).*

### 1. Start the Backend API (FastAPI)

Open your first terminal and run:

```bash
# Navigate to the backend folder
cd backend

# Activate the Python virtual environment
.\venv\Scripts\activate

# Start the FastAPI server on port 8000
uvicorn app.main:app --reload
```

### 2. Start the Frontend Application (Next.js)

Open your second terminal and run:

```bash
# Navigate to the frontend folder
cd frontend

# Start the Next.js development server
npm run dev
```

---

## Setting up API Keys (Optional but Recommended)

To make the AI features (Lead scoring, Intent extraction, and Email generation) work perfectly, you need to provide a Google Gemini API Key.

1. Open `backend/app/core/config.py`.
2. Locate the `GEMINI_API_KEY` setting.
3. Replace `None` with your actual API key as a string, e.g., `"AIzaSy..."`

Alternatively, create a `.env` file in the `backend/` directory with:
```env
GEMINI_API_KEY=your_actual_key_here
```

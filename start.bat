@echo off
echo =========================================
echo Starting Codentra AI Lead Generator
echo =========================================

echo Starting Backend API (FastAPI)...
start "Backend API" cmd /k "cd backend && .\venv\Scripts\activate && uvicorn app.main:app --reload"

echo Starting Frontend (Next.js)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services are starting in separate windows!
echo Backend API will be at: http://localhost:8000
echo Frontend Dashboard will be at: http://localhost:3000
echo.
echo You can close this window now.
pause

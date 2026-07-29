@echo off
echo =========================================
echo Starting Codentra AI Lead Generator
echo =========================================

echo Starting AI Background Worker...
start "AI Worker" cmd /k "cd backend && .\venv\Scripts\activate && python firebase_worker.py"

echo Starting Frontend (Next.js)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services are starting in separate windows!
echo AI Background Worker is running in the background.
echo Frontend Dashboard will be at: http://localhost:3000
echo.
echo You can close this window now.
pause

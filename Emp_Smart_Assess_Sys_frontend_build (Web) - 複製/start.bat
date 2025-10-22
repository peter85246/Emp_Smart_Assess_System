@echo off
chcp 65001 > nul
title Employee Smart Assessment System

cd /d "%~dp0"

rem Kill existing processes
taskkill /F /IM "dotnet.exe" > nul 2>&1
taskkill /F /IM "node.exe" > nul 2>&1

rem Start backend
cd backend
echo Starting backend service...
start "Backend Service" cmd /c "run_backend.bat"
cd ..

rem Wait for backend to initialize
timeout /t 5 > nul

rem Start frontend
cd frontend
echo Starting frontend service...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)
start "Frontend Service" cmd /c "node server.js"
cd ..

rem Wait for services to start
timeout /t 3 > nul

rem Open browser
echo Opening browser...
start http://localhost:3000

echo.
echo Services started successfully!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5001/api
echo.
echo Press any key to close this window (services will continue running)
pause > nul
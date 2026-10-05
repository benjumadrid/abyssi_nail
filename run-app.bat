@echo off
title Beauty Abyssi Nail Studio
echo ==============================================
echo   Starting Beauty Abyssi Nail Salon System...
echo ==============================================
echo.

:: Start Express Backend
start "Beauty Abyssi Backend (Port 5000)" cmd /k "cd /d %~dp0 && node server.js"

:: Start Vite Frontend
start "Beauty Abyssi Frontend (Port 3000)" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo Servers started successfully!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Opening browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:3000

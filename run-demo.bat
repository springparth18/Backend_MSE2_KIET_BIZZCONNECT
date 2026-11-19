@echo off
title BizzConnect - Live Demo Launcher
echo ===================================================
echo        BIZZCONNECT LIVE DEMO LAUNCHER
echo ===================================================
echo.

echo [1/3] Checking MongoDB...
sc query MongoDB 2>nul | find "RUNNING" >nul
if %ERRORLEVEL% equ 0 (
    echo MongoDB service is already running.
) else (
    net start MongoDB 2>nul
    if %ERRORLEVEL% equ 0 (
        echo MongoDB service started successfully.
    ) else (
        echo Trying local mongod fallback...
        start "MongoDB Server" cmd /k "mongod --dbpath ^"%~dp0data\db^" 2>nul || mongod"
        timeout /t 3 /nobreak >nul
    )
)

echo.
echo [2/3] Starting BizzConnect Backend on http://localhost:5000...
cd /d "%~dp0backend"
start "BizzConnect Backend (Port 5000)" cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Starting BizzConnect Frontend on http://localhost:5173...
cd /d "%~dp0frontend"
start "BizzConnect Frontend (Port 5173)" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ===================================================
echo   Opening BizzConnect in your browser...
echo ===================================================
start http://localhost:5173

echo.
echo Demo is ready! Press any key to exit this launcher window.
pause >nul

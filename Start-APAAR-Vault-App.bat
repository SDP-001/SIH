@echo off
title APAAR-Vault Application Launcher
echo ========================================================
echo   APAAR-Vault - AI Academic Verification Platform
echo   Launching Dedicated Desktop Application Window
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Check and start Backend if not running
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    echo [1/3] Starting Backend API Server on Port 8080...
    start /min "APAAR-Vault Backend" cmd /c "python -m uvicorn app.main:app --app-dir backend --port 8080"
    ping 127.0.0.1 -n 4 >nul
) else (
    echo [1/3] Backend API Server is already active on Port 8080.
)

:: 2. Check and start Frontend if not running
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    echo [2/3] Starting Frontend Next.js Server on Port 3001...
    start /min "APAAR-Vault Frontend" cmd /c "cd /d ""%~dp0frontend"" && npm start"
    ping 127.0.0.1 -n 4 >nul
) else (
    echo [2/3] Frontend Server is already active on Port 3001.
)

:: 3. Launch in Dedicated Application Window Mode
echo [3/3] Opening Dedicated Desktop Application Window...

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3001 --window-size=1440,900
    goto done
)

if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3001 --window-size=1440,900
    goto done
)

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3001 --window-size=1440,900
    goto done
)

if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3001 --window-size=1440,900
    goto done
)

start http://localhost:3001

:done
echo.
echo Application launched successfully!
ping 127.0.0.1 -n 2 >nul
exit

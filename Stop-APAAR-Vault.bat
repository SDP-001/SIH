@echo off
title Stop APAAR-Vault
echo Stopping APAAR-Vault processes...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo Stopping Backend PID %%a
    taskkill /F /PID %%a >nul 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo Stopping Frontend PID %%a
    taskkill /F /PID %%a >nul 2>nul
)

echo APAAR-Vault stopped successfully.
ping 127.0.0.1 -n 3 >nul
exit

@echo off
chcp 65001 >nul
title VELORA Beauty Store
cd /d "%~dp0"

echo.
echo  ========================================
echo           VELORA - Beauty Revealed
echo  ========================================
echo.
echo  Starting the store...
echo  Browser will open automatically.
echo  Keep this window open while using the app.
echo  Close this window to stop the server.
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] Node.js is not installed.
  echo  Download from https://nodejs.org and try again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo  Installing packages for the first time...
  call npm install
  if errorlevel 1 (
    echo  [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3000"

call npm run dev

pause

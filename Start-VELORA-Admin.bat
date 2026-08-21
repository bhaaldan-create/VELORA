@echo off
chcp 65001 >nul
title VELORA Admin — صندوق الطلبات
cd /d "%~dp0"

echo.
echo  ========================================
echo      VELORA ADMIN — صندوق الطلبات
echo  ========================================
echo.
echo  Admin board: Orders + Products
echo  Username: Muhammad
echo  Password: (see ADMIN_PASSWORD in .env.local)
echo.
echo  Opening admin login...
echo  Keep this window open while using the app.
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

REM Check if the store server is already running
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/admin/login' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
  echo  Server is already running.
  start "" "http://localhost:3000/admin/login"
  echo.
  echo  Admin login opened. You can close this window.
  timeout /t 3 >nul
  exit /b 0
)

echo  Starting server then opening admin login...
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000/admin/login"

call npm run dev

pause

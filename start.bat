@echo off
echo ========================================
echo   Starting FluffNwoof
echo   نظام إدارة العيادات البيطرية
echo ========================================
echo.

echo Checking if setup is complete...
if not exist "backend\node_modules" (
    echo ❌ Backend dependencies not installed!
    echo Please run setup.bat first
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo ❌ Frontend dependencies not installed!
    echo Please run setup.bat first
    pause
    exit /b 1
)

if not exist "backend\.env" (
    echo ⚠️ WARNING: .env file not found in backend folder!
    echo Please create .env file with your DATABASE_URL
    pause
)

echo.
echo ✅ Starting Backend Server...
echo Backend will run on: http://localhost:5000
echo.
start "FluffNwoof Backend" cmd /k "cd backend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ✅ Starting Frontend Server...
echo Frontend will run on: http://localhost:5173
echo.
start "FluffNwoof Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   ✅ FluffNwoof is starting!
echo ========================================
echo.
echo Two new windows will open:
echo 1. Backend Server (http://localhost:5000)
echo 2. Frontend App (http://localhost:5173)
echo.
echo Wait 10-15 seconds then open your browser:
echo 👉 http://localhost:5173
echo.
echo Login credentials (after creating admin user):
echo Email: admin@fluffnwoof.com
echo Password: admin123
echo.
echo To stop: Close both terminal windows
echo.
pause

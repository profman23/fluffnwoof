@echo off
echo ========================================
echo   FluffNwoof Setup Script
echo   نظام إدارة العيادات البيطرية
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org
    echo Download the LTS version and install it.
    pause
    exit /b 1
)
echo ✅ Node.js is installed
node --version
echo.

echo [2/4] Installing Backend dependencies...
cd backend
if not exist "node_modules" (
    echo Installing backend packages...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend dependencies already installed
)
echo.

echo [3/4] Checking .env file...
if not exist ".env" (
    echo ⚠️ WARNING: .env file not found!
    echo Please create .env file with your DATABASE_URL
    echo Copy .env.example to .env and update DATABASE_URL
    pause
)
echo.

echo [4/4] Installing Frontend dependencies...
cd ..\frontend
if not exist "node_modules" (
    echo Installing frontend packages...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Frontend dependencies already installed
)
echo.

echo ========================================
echo   ✅ Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create .env file in backend folder with your DATABASE_URL
echo 2. Run: cd backend ^&^& npx prisma generate
echo 3. Run: npx prisma migrate dev --name init
echo 4. Use start.bat to run the project
echo.
pause

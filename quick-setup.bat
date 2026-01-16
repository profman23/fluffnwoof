@echo off
chcp 65001 >nul
echo ========================================
echo   FluffNwoof - إعداد سريع
echo ========================================
echo.

echo [الخطوة 1/6] التحقق من Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js غير مثبت!
    echo الرجاء التثبيت من: https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js مثبت
node --version
echo.

echo [الخطوة 2/6] تثبيت مكتبات Backend...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ فشل تثبيت مكتبات Backend
    pause
    exit /b 1
)
echo ✅ تم تثبيت مكتبات Backend
echo.

echo [الخطوة 3/6] إعداد Prisma وقاعدة البيانات...
echo جاري توليد Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ فشل توليد Prisma Client
    pause
    exit /b 1
)
echo ✅ تم توليد Prisma Client
echo.

echo جاري إنشاء جداول قاعدة البيانات...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo ⚠️ تحذير: قد يكون هناك مشكلة في Migration
    echo يمكنك تجاهل هذا إذا كانت الجداول موجودة بالفعل
    echo.
)
echo ✅ تم إعداد قاعدة البيانات
echo.

echo [الخطوة 4/6] إنشاء مستخدم Admin...
call node create-admin.js
echo.

echo [الخطوة 5/6] تثبيت مكتبات Frontend...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ❌ فشل تثبيت مكتبات Frontend
    pause
    exit /b 1
)
echo ✅ تم تثبيت مكتبات Frontend
echo.

cd ..

echo ========================================
echo   ✅ الإعداد اكتمل بنجاح!
echo ========================================
echo.
echo 🎉 كل شيء جاهز الآن!
echo.
echo الخطوات التالية:
echo 1. شغّل الملف: start.bat
echo 2. انتظر 15 ثانية
echo 3. افتح المتصفح على: http://localhost:5173
echo 4. سجل دخول:
echo    📧 Email: admin@fluffnwoof.com
echo    🔑 Password: admin123
echo.
pause

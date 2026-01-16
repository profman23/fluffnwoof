# 👋 ابدأ من هنا - START HERE

## 🎯 خطوات التشغيل السريعة

### 1. تأكد من Node.js
```bash
node --version
```
إذا لم يعمل، حمّل من: https://nodejs.org

### 2. جهز قاعدة بيانات على Neon
- اذهب: https://neon.tech
- سجل مجاناً
- أنشئ مشروع
- انسخ Connection String

### 3. أنشئ ملف `.env` في مجلد `backend`
```env
DATABASE_URL="الرابط-من-Neon"
JWT_SECRET="FluffNwoof-2024"
PORT=5000
FRONTEND_URL="http://localhost:5173"
```

### 4. شغّل الإعداد التلقائي
**Windows:**
```bash
# اضغط دبل كليك على:
setup.bat
```

**أو يدوياً:**
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 5. جهز قاعدة البيانات
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
node create-admin.js
```

### 6. شغّل التطبيق
**Windows:**
```bash
# اضغط دبل كليك على:
start.bat
```

**أو يدوياً:**
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

### 7. افتح المتصفح
```
http://localhost:5173
```

### 8. سجل الدخول
```
Email: admin@fluffnwoof.com
Password: admin123
```

---

## 📚 ملفات مهمة

| الملف | الوصف |
|------|------|
| [البدء_السريع.md](البدء_السريع.md) | دليل سريع بالعربية |
| [HOW_TO_RUN.md](HOW_TO_RUN.md) | دليل تفصيلي خطوة بخطوة |
| [GETTING_STARTED.md](GETTING_STARTED.md) | دليل البدء |
| [README.md](README.md) | التوثيق الكامل |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | ملخص المشروع |
| `setup.bat` | تثبيت المكتبات تلقائياً |
| `start.bat` | تشغيل التطبيق |
| `backend/create-admin.js` | إنشاء مستخدم admin |

---

## ⚡ أوامر سريعة

```bash
# تثبيت المكتبات
cd backend && npm install
cd frontend && npm install

# إعداد قاعدة البيانات
cd backend
npx prisma generate
npx prisma migrate dev

# إنشاء admin
node create-admin.js

# تشغيل Backend
npm run dev

# تشغيل Frontend
cd frontend
npm run dev

# فتح Prisma Studio
cd backend
npx prisma studio
```

---

## 🎊 بعد التشغيل

1. ✅ افتح http://localhost:5173
2. ✅ سجل دخول بـ admin@fluffnwoof.com
3. ✅ استكشف Dashboard
4. ✅ افتح Prisma Studio لإضافة بيانات
5. ✅ ابدأ التطوير!

---

## 🆘 محتاج مساعدة؟

راجع: [HOW_TO_RUN.md](HOW_TO_RUN.md)

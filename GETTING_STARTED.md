# دليل البدء السريع - FluffNwoof 🚀

## الخطوات السريعة للتشغيل

### 1. تثبيت المكتبات

```bash
# Backend
cd backend
pnpm install

# Frontend (في نافذة terminal جديدة)
cd frontend
pnpm install
```

### 2. إعداد قاعدة البيانات

#### الطريقة الأولى: استخدام Neon (موصى به - مجاني)

1. اذهب إلى [https://neon.tech](https://neon.tech)
2. أنشئ حساب مجاني
3. أنشئ مشروع جديد
4. انسخ Connection String
5. في مجلد `backend`، أنشئ ملف `.env`:

```env
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="my-super-secret-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

#### الطريقة الثانية: استخدام PostgreSQL محلي

```bash
# تثبيت PostgreSQL على الكمبيوتر
# ثم أنشئ قاعدة بيانات جديدة:
createdb fluffnwoof

# في ملف .env ضع:
DATABASE_URL="postgresql://postgres:password@localhost:5432/fluffnwoof"
```

### 3. تطبيق Migrations

```bash
cd backend

# توليد Prisma Client
pnpm prisma:generate

# تطبيق Migrations
pnpm prisma:migrate
```

### 4. تشغيل التطبيق

```bash
# Terminal 1 - Backend
cd backend
pnpm dev

# Terminal 2 - Frontend
cd frontend
pnpm dev
```

### 5. إنشاء أول مستخدم

استخدم Prisma Studio أو أداة API client (Postman/Insomnia):

```bash
# في مجلد backend
pnpm prisma:studio
```

أو عبر API:

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "admin@fluffnwoof.com",
  "password": "admin123",
  "firstName": "أحمد",
  "lastName": "محمد",
  "role": "ADMIN"
}
```

### 6. تسجيل الدخول

افتح المتصفح على: `http://localhost:5173`

استخدم البيانات:
- البريد الإلكتروني: `admin@fluffnwoof.com`
- كلمة المرور: `admin123`

## 🎉 مبروك! التطبيق يعمل الآن

---

## أوامر مفيدة

### Backend

```bash
# تشغيل في وضع التطوير
pnpm dev

# بناء للإنتاج
pnpm build

# تشغيل النسخة المبنية
pnpm start

# فتح Prisma Studio
pnpm prisma:studio

# إنشاء migration جديد
pnpm prisma:migrate

# إعادة تعيين قاعدة البيانات (⚠️ يحذف كل البيانات)
pnpm prisma migrate reset
```

### Frontend

```bash
# تشغيل في وضع التطوير
pnpm dev

# بناء للإنتاج
pnpm build

# معاينة النسخة المبنية
pnpm preview
```

## 🔍 استكشاف الأخطاء

### مشكلة: لا يمكن الاتصال بقاعدة البيانات

**الحل:**
1. تحقق من صحة `DATABASE_URL` في ملف `.env`
2. تأكد من أن قاعدة البيانات تعمل
3. جرب `pnpm prisma:generate` مرة أخرى

### مشكلة: CORS Error

**الحل:**
1. تأكد من أن Backend يعمل على `http://localhost:5000`
2. تأكد من أن `FRONTEND_URL` في `.env` هو `http://localhost:5173`

### مشكلة: Module not found

**الحل:**
```bash
# احذف node_modules وثبت مجدداً
rm -rf node_modules
pnpm install
```

## 📚 الخطوات التالية

1. استكشف صفحة Dashboard
2. أضف ملاك جدد
3. أضف حيوانات أليفة
4. أنشئ مواعيد
5. استكشف Prisma Studio لرؤية البيانات

## 💡 نصائح

- استخدم Prisma Studio لإدارة البيانات بسهولة
- راجع ملف [README.md](README.md) للتوثيق الكامل
- جميع الرسائل باللغة العربية لتجربة أفضل

---

**استمتع بالتطوير! 🎨**

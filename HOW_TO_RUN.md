# دليل تشغيل FluffNwoof خطوة بخطوة 🚀

## المتطلبات الأساسية

قبل البدء، تحتاج إلى تثبيت:

### 1. تثبيت Node.js

1. اذهب إلى [https://nodejs.org](https://nodejs.org)
2. حمّل النسخة **LTS** (الموصى بها)
3. ثبّت Node.js
4. تحقق من التثبيت:

```bash
node --version
npm --version
```

يجب أن ترى رقم الإصدار (مثل: v20.x.x)

### 2. تثبيت Git (إذا لم يكن مثبتاً)

1. اذهب إلى [https://git-scm.com](https://git-scm.com)
2. حمّل وثبّت Git for Windows
3. تحقق: `git --version`

---

## خطوات التشغيل

### الخطوة 1️⃣: إعداد قاعدة البيانات على Neon

1. **افتح المتصفح واذهب إلى**: [https://neon.tech](https://neon.tech)

2. **أنشئ حساب مجاني**:
   - اضغط على "Sign Up"
   - يمكنك التسجيل بـ GitHub أو Google

3. **أنشئ مشروع جديد**:
   - اضغط "Create a project"
   - اختر اسم المشروع: `FluffNwoof`
   - اختر المنطقة الأقرب لك

4. **احصل على Connection String**:
   - بعد إنشاء المشروع، ستجد Connection String
   - انسخه (يبدأ بـ `postgresql://...`)

5. **أنشئ ملف `.env` في مجلد `backend`**:

```bash
# في مجلد FluffNwoof\backend
# أنشئ ملف اسمه .env (بدون امتداد)
```

ضع هذا المحتوى في ملف `.env`:

```env
DATABASE_URL="postgresql://ضع-هنا-الرابط-من-neon?sslmode=require"
JWT_SECRET="FluffNwoof-Super-Secret-Key-2024"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

⚠️ **مهم**: استبدل `DATABASE_URL` بالرابط الذي حصلت عليه من Neon!

---

### الخطوة 2️⃣: تثبيت مكتبات Backend

افتح **Command Prompt** أو **PowerShell** في مجلد المشروع:

```bash
# اذهب لمجلد backend
cd d:\Ghazal\FluffNwoof\backend

# ثبت المكتبات
npm install

# قد يستغرق 2-3 دقائق
```

---

### الخطوة 3️⃣: إعداد قاعدة البيانات

```bash
# في نفس المجلد backend
npx prisma generate

# ثم
npx prisma migrate dev --name init

# اضغط Enter إذا سُئلت
```

---

### الخطوة 4️⃣: تشغيل Backend

```bash
# في مجلد backend
npm run dev
```

يجب أن ترى:
```
✅ Database connected successfully
🚀 Server is running on port 5000
📍 Environment: development
🔗 API URL: http://localhost:5000
```

⚠️ **لا تغلق هذه النافذة!** اتركها تعمل.

---

### الخطوة 5️⃣: تثبيت مكتبات Frontend

افتح نافذة **Command Prompt جديدة**:

```bash
# اذهب لمجلد frontend
cd d:\Ghazal\FluffNwoof\frontend

# ثبت المكتبات
npm install

# قد يستغرق 2-3 دقائق
```

---

### الخطوة 6️⃣: إنشاء ملف .env للـ Frontend

أنشئ ملف `.env` في مجلد `frontend`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

### الخطوة 7️⃣: تشغيل Frontend

```bash
# في مجلد frontend
npm run dev
```

يجب أن ترى:
```
  VITE vX.X.X  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### الخطوة 8️⃣: إنشاء أول مستخدم Admin

لديك 3 طرق:

#### الطريقة 1: استخدام Prisma Studio (الأسهل) ✅

```bash
# في نافذة Command Prompt جديدة
cd d:\Ghazal\FluffNwoof\backend
npx prisma studio
```

سيفتح متصفح على `http://localhost:5555`:

1. اضغط على **Users**
2. اضغط **Add record**
3. املأ البيانات:
   - email: `admin@fluffnwoof.com`
   - password: `$2b$10$rQJZ5KZ8kY9Z9Z9Z9Z9Z9eX.X.X.X.X.X.X.X.X.X.X` (سأعطيك hash جاهز)
   - role: `ADMIN`
   - firstName: `أحمد`
   - lastName: `محمد`
4. اضغط **Save 1 change**

⚠️ **مشكلة**: كلمة المرور يجب أن تكون hash!

#### الطريقة 2: استخدام API (موصى بها) ✅

افتح متصفح جديد واذهب إلى أي من:
- [Postman](https://www.postman.com/downloads/)
- [Insomnia](https://insomnia.rest/download)
- أو استخدم هذا الكود في الـ browser console

افتح متصفح، اضغط F12، واذهب لـ Console وألصق:

```javascript
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@fluffnwoof.com',
    password: 'admin123',
    firstName: 'أحمد',
    lastName: 'محمد',
    role: 'ADMIN'
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

#### الطريقة 3: استخدام curl (إذا كان متوفراً)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@fluffnwoof.com\",\"password\":\"admin123\",\"firstName\":\"أحمد\",\"lastName\":\"محمد\",\"role\":\"ADMIN\"}"
```

---

### الخطوة 9️⃣: تسجيل الدخول والتجربة! 🎉

1. افتح متصفحك على: **http://localhost:5173**

2. ستظهر لك صفحة تسجيل الدخول

3. أدخل:
   - البريد الإلكتروني: `admin@fluffnwoof.com`
   - كلمة المرور: `admin123`

4. اضغط **تسجيل الدخول**

5. ستنتقل إلى صفحة Dashboard! 🎊

---

## 🎯 ماذا الآن؟

يمكنك:

1. ✅ استكشاف Dashboard
2. ✅ الضغط على قائمة Sidebar للتنقل
3. ✅ إضافة ملاك جدد (عبر API حالياً)
4. ✅ إضافة حيوانات أليفة
5. ✅ إنشاء مواعيد

---

## 🛠️ أدوات مفيدة

### Prisma Studio (لإدارة قاعدة البيانات)

```bash
cd backend
npx prisma studio
```

يفتح على: http://localhost:5555

### إضافة بيانات تجريبية

يمكنك إضافة ملاك وحيوانات عبر Prisma Studio:

1. افتح Prisma Studio
2. اذهب إلى **Owners**
3. Add record:
   - firstName: `محمد`
   - lastName: `أحمد`
   - phone: `01234567890`
   - email: `mohamed@example.com`
4. Save

ثم أضف Pet:
1. اذهب إلى **Pets**
2. Add record:
   - name: `ماكس`
   - species: `DOG`
   - gender: `MALE`
   - ownerId: (اختر من القائمة)
3. Save

---

## ❌ حل المشاكل الشائعة

### مشكلة: `npm: command not found`
**الحل**: ثبت Node.js من https://nodejs.org

### مشكلة: `Error: connect ECONNREFUSED`
**الحل**: تأكد من أن Backend يعمل (الخطوة 4)

### مشكلة: `Prisma error: DATABASE_URL`
**الحل**:
1. تأكد من وجود ملف `.env` في مجلد `backend`
2. تأكد من أن `DATABASE_URL` صحيح

### مشكلة: `Port 5000 already in use`
**الحل**: غيّر PORT في `.env`:
```env
PORT=5001
```

### مشكلة: صفحة بيضاء في Frontend
**الحل**:
1. افتح Developer Tools (F12)
2. شوف Console للأخطاء
3. تأكد من أن Backend يعمل
4. تأكد من ملف `.env` في frontend

---

## 📊 النوافذ المفتوحة

يجب أن يكون لديك:

1. ✅ **Terminal 1**: Backend يعمل (`npm run dev`)
2. ✅ **Terminal 2**: Frontend يعمل (`npm run dev`)
3. ✅ **Browser**: http://localhost:5173 (التطبيق)
4. ⭐ **Optional**: Prisma Studio (لإدارة البيانات)

---

## 🎓 نصائح

- احفظ ملف `.env` ولا تشاركه مع أحد
- استخدم Prisma Studio لرؤية البيانات
- راقب Terminal للأخطاء
- اضغط `Ctrl+C` لإيقاف أي سيرفر

---

## 📞 تحتاج مساعدة؟

إذا واجهت أي مشكلة:
1. تأكد من تثبيت Node.js
2. تأكد من صحة DATABASE_URL
3. تأكد من تشغيل Backend و Frontend
4. شوف الأخطاء في Terminal

---

**استمتع باستخدام FluffNwoof! 🐾✨**

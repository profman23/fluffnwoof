# Database Migration Best Practices

## دليل الترقية الآمنة لقاعدة البيانات

هذا الدليل يوضح أفضل الممارسات لتنفيذ تغييرات قاعدة البيانات بدون توقف (Zero-Downtime).

---

## القواعد الذهبية

### 1. لا تغيير مباشر لـ Production
- دائماً اختبر التغييرات على Staging أولاً
- راجع الـ migration قبل تطبيقه
- خذ نسخة احتياطية قبل أي تغيير

### 2. التغييرات يجب أن تكون متوافقة للخلف
- الكود القديم يجب أن يعمل مع Schema الجديد
- الكود الجديد يجب أن يعمل مع Schema القديم

---

## أنواع التغييرات

### ✅ تغييرات آمنة (يمكن تطبيقها مباشرة)

#### إضافة جدول جديد
```sql
CREATE TABLE new_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);
```

#### إضافة عمود nullable
```sql
ALTER TABLE users ADD COLUMN preferences JSONB;
```

#### إضافة عمود مع default
```sql
ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
```

#### إضافة index
```sql
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```
> ملاحظة: استخدم `CONCURRENTLY` لتجنب قفل الجدول

---

### ⚠️ تغييرات تحتاج خطوات متعددة

#### حذف عمود (3 مراحل)

**المرحلة 1: توقف عن استخدام العمود**
```typescript
// قبل
const user = await prisma.user.findFirst({
  select: { id: true, name: true, oldField: true }
});

// بعد - أزل oldField من الكود
const user = await prisma.user.findFirst({
  select: { id: true, name: true }
});
```

**المرحلة 2: انشر الكود الجديد**
- تأكد أن الكود لا يستخدم العمود
- راقب الأخطاء لمدة 24 ساعة

**المرحلة 3: احذف العمود**
```sql
ALTER TABLE users DROP COLUMN old_field;
```

---

#### إعادة تسمية عمود (4 مراحل)

**المرحلة 1: أضف العمود الجديد**
```sql
ALTER TABLE users ADD COLUMN new_name VARCHAR(255);
```

**المرحلة 2: اكتب للاثنين، اقرأ من القديم**
```typescript
// في الكود
await prisma.user.update({
  where: { id },
  data: {
    oldName: value,
    newName: value  // اكتب للاثنين
  }
});

// اقرأ من القديم
const { oldName } = await prisma.user.findFirst({ where: { id } });
```

**المرحلة 3: انقل البيانات، اقرأ من الجديد**
```sql
UPDATE users SET new_name = old_name WHERE new_name IS NULL;
```
```typescript
// غيّر الكود ليقرأ من الجديد
const { newName } = await prisma.user.findFirst({ where: { id } });
```

**المرحلة 4: احذف القديم**
```sql
ALTER TABLE users DROP COLUMN old_name;
```

---

#### تغيير نوع البيانات

**من INTEGER إلى BIGINT:**
```sql
-- المرحلة 1: أضف عمود جديد
ALTER TABLE products ADD COLUMN price_new BIGINT;

-- المرحلة 2: انقل البيانات
UPDATE products SET price_new = price;

-- المرحلة 3: بعد تحديث الكود
ALTER TABLE products DROP COLUMN price;
ALTER TABLE products RENAME COLUMN price_new TO price;
```

**من VARCHAR إلى TEXT:**
```sql
-- هذا آمن في PostgreSQL
ALTER TABLE users ALTER COLUMN bio TYPE TEXT;
```

---

#### إضافة عمود NOT NULL

**الطريقة الصحيحة:**
```sql
-- المرحلة 1: أضف كـ nullable مع default
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- المرحلة 2: املأ القيم الفارغة
UPDATE users SET status = 'active' WHERE status IS NULL;

-- المرحلة 3: اجعله NOT NULL
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
```

**الطريقة الخاطئة:** ❌
```sql
-- هذا سيفشل إذا كان الجدول فيه بيانات
ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL;
```

---

## أوامر Prisma المفيدة

```bash
# إنشاء migration جديد
npx prisma migrate dev --name add_user_preferences

# عرض حالة الـ migrations
npx prisma migrate status

# تطبيق migrations في Production
npx prisma migrate deploy

# إنشاء migration فارغ للتعديل اليدوي
npx prisma migrate dev --create-only

# إعادة تعيين قاعدة البيانات (تطوير فقط!)
npx prisma migrate reset

# مقارنة Schema مع قاعدة البيانات
npx prisma db pull
```

---

## قائمة فحص قبل الـ Migration

- [ ] هل Migration تم اختباره على Staging؟
- [ ] هل تم أخذ نسخة احتياطية؟
- [ ] هل التغيير متوافق للخلف؟
- [ ] هل الـ Migration سريع (< 5 ثواني)؟
- [ ] هل تم تنسيق مع فريق التطوير؟
- [ ] هل يوجد خطة للتراجع (Rollback)؟

---

## نصائح للأداء

### تجنب تحديث جميع الصفوف مرة واحدة
```sql
-- خطأ ❌
UPDATE users SET new_column = 'value';

-- صحيح ✅
UPDATE users SET new_column = 'value'
WHERE id IN (SELECT id FROM users WHERE new_column IS NULL LIMIT 1000);
-- كرر حتى لا توجد صفوف
```

### استخدم CONCURRENTLY للـ Index
```sql
-- يقفل الجدول ❌
CREATE INDEX idx_users_email ON users(email);

-- لا يقفل ✅
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

### راقب الأداء
```sql
-- فحص الـ locks
SELECT * FROM pg_locks WHERE NOT granted;

-- فحص الـ queries الطويلة
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

---

## الطوارئ - التراجع (Rollback)

### إذا فشل الـ Migration:
1. **لا تحذف ملفات الـ Migration**
2. أصلح المشكلة في migration جديد
3. اختبر على Staging
4. طبق الإصلاح

### إذا تسبب في مشاكل بعد النشر:
1. **التراجع الفوري:** ارجع للنسخة السابقة من الكود
2. **التراجع اليدوي:** نفذ SQL عكسي
3. **استعادة من النسخة الاحتياطية:** آخر خيار

---

## مثال عملي: إضافة ميزة جديدة

### السيناريو: إضافة نظام التقييمات

**Migration 1: إنشاء الجدول**
```prisma
model Rating {
  id          String   @id @default(cuid())
  score       Int
  comment     String?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  appointmentId String
  appointment Appointment @relation(fields: [appointmentId], references: [id])
  createdAt   DateTime @default(now())
}
```

**Migration 2: إضافة متوسط التقييم للطبيب**
```sql
ALTER TABLE users ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0;
```

**Migration 3: تحديث المتوسط (background job)**
```typescript
// لا تضع هذا في migration!
// استخدم background job بدلاً من ذلك
async function updateDoctorRatings() {
  const doctors = await prisma.user.findMany({
    where: { role: 'VET' }
  });

  for (const doctor of doctors) {
    const avg = await prisma.rating.aggregate({
      where: { appointment: { doctorId: doctor.id } },
      _avg: { score: true }
    });

    await prisma.user.update({
      where: { id: doctor.id },
      data: { averageRating: avg._avg.score || 0 }
    });
  }
}
```

---

## الموارد

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Zero-Downtime Migrations](https://www.braintreepayments.com/blog/safe-operations-for-high-volume-postgresql/)

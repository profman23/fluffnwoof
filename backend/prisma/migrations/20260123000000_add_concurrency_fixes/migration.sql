-- إضافة version field للـ Optimistic Locking
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- إضافة unique constraint على appointmentId (إذا لم يكن موجوداً)
-- أولاً نحذف أي duplicates إذا وجدت
DELETE FROM "medical_records" a USING "medical_records" b
WHERE a.id > b.id AND a."appointmentId" = b."appointmentId" AND a."appointmentId" IS NOT NULL;

-- ثم نضيف الـ constraint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_appointmentId_key" UNIQUE ("appointmentId");

-- إنشاء sequence لتوليد أرقام recordCode
CREATE SEQUENCE IF NOT EXISTS record_code_daily_seq;

-- إنشاء جدول لتتبع آخر تاريخ تم إعادة ضبط الـ sequence فيه
CREATE TABLE IF NOT EXISTS "_record_code_tracker" (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT single_row CHECK (id = 1)
);

-- إدخال صف واحد فقط
INSERT INTO "_record_code_tracker" (id, last_reset_date)
VALUES (1, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- دالة لتوليد recordCode مع إعادة ضبط يومية
CREATE OR REPLACE FUNCTION generate_record_code()
RETURNS TEXT AS $$
DECLARE
    today_str TEXT;
    seq_num INT;
    last_reset DATE;
BEGIN
    -- الحصول على تاريخ اليوم
    today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    -- التحقق من تاريخ آخر إعادة ضبط
    SELECT last_reset_date INTO last_reset FROM "_record_code_tracker" WHERE id = 1;

    -- إذا كان اليوم جديد، نعيد ضبط الـ sequence
    IF last_reset IS NULL OR last_reset < CURRENT_DATE THEN
        -- إعادة ضبط الـ sequence
        ALTER SEQUENCE record_code_daily_seq RESTART WITH 1;

        -- تحديث تاريخ آخر إعادة ضبط
        UPDATE "_record_code_tracker" SET last_reset_date = CURRENT_DATE WHERE id = 1;
    END IF;

    -- الحصول على الرقم التالي
    seq_num := nextval('record_code_daily_seq');

    -- إرجاع الكود بالتنسيق المطلوب
    RETURN 'MR-' || today_str || '-' || LPAD(seq_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

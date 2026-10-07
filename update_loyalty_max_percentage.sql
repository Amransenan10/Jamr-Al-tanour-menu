-- إضافة عمود أقصى نسبة خصم بالنقاط من الفاتورة إلى جدول إعدادات الولاء
ALTER TABLE loyalty_config 
ADD COLUMN IF NOT EXISTS max_redemption_percentage NUMERIC DEFAULT 50;

-- تحديث القيمة الافتراضية للسطر الحالي في حال وجوده وكانت القيمة NULL
UPDATE loyalty_config 
SET max_redemption_percentage = 50 
WHERE id = 1 AND max_redemption_percentage IS NULL;

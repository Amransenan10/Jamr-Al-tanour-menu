-- إضافة أعمدة لتقديم عروض مستقلة في القصص دون الحاجة للربط المباشر مع منتج موجود
ALTER TABLE stories
ADD COLUMN offer_name text NULL,
ADD COLUMN offer_price numeric(10, 2) NULL;

-- Migration: change products.rating from NUMERIC to VARCHAR(50)
-- In the application, product rating represents quality/performance level ('عالی', 'متوسط', 'بد'),
-- not a numeric star rating (which is stored in comments).

ALTER TABLE products ALTER COLUMN rating DROP DEFAULT;
ALTER TABLE products ALTER COLUMN rating TYPE VARCHAR(50) USING rating::TEXT;
ALTER TABLE products ALTER COLUMN rating SET DEFAULT 'متوسط';

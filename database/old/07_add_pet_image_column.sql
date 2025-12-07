-- Migration: Thêm cột image_url vào bảng pets
-- Chạy file này để thêm cột hình ảnh cho thú cưng

ALTER TABLE pets
ADD COLUMN image_url VARCHAR(500);

-- Thêm comment cho cột mới
COMMENT ON COLUMN pets.image_url IS 'Đường dẫn URL đến hình ảnh của thú cưng';

-- Cập nhật updated_at cho tất cả records hiện có
UPDATE pets SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NOT NULL;

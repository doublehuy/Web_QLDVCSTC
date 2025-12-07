-- Thêm các cột liên quan đến hủy lịch hẹn vào bảng appointments
ALTER TABLE IF EXISTS appointments
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

ALTER TABLE IF EXISTS appointments
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20);

ALTER TABLE IF EXISTS appointments
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

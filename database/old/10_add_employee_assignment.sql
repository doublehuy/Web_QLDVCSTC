-- Migration: Cập nhật status cho chức năng phân công nhân viên
-- Chạy file này để cập nhật status trong bảng appointments

-- Bước 1: Cập nhật enum status để bao gồm các trạng thái mới
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'chờ phân công', 'đã phân công', 'hoàn thành', 'hủy'));

-- Bước 2: Cập nhật các status cũ thành status mới tương ứng
UPDATE appointments SET status = 'chờ phân công' WHERE status = 'pending';
UPDATE appointments SET status = 'đã phân công' WHERE status = 'confirmed';
UPDATE appointments SET status = 'hoàn thành' WHERE status = 'completed';
UPDATE appointments SET status = 'hủy' WHERE status = 'cancelled';

-- Bước 3: Đảm bảo tất cả appointments mới sẽ có status mặc định là 'chờ phân công'
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'chờ phân công';

-- Bước 4: Tạo index cho employee_id để tối ưu query (nếu chưa có)
CREATE INDEX IF NOT EXISTS idx_appointments_employee_id ON appointments(employee_id);
CREATE INDEX IF NOT EXISTS idx_appointments_employee_status ON appointments(employee_id, status);

-- Bước 5: Thêm comment cho cột employee_id
COMMENT ON COLUMN appointments.employee_id IS 'Mã nhân viên phụ trách lịch hẹn';

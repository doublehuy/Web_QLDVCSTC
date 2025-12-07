-- Thêm cột employee_id vào bảng appointments
ALTER TABLE appointments 
ADD COLUMN employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL;

-- Cập nhật ràng buộc status
ALTER TABLE appointments 
ALTER COLUMN status SET DEFAULT 'pending';

-- Tạo index để tối ưu hiệu suất tìm kiếm
CREATE INDEX idx_appointments_employee_date ON appointments(employee_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Thêm comment cho các cột mới
COMMENT ON COLUMN appointments.employee_id IS 'ID nhân viên được phân công';
COMMENT ON COLUMN appointments.status IS 'Trạng thái: pending, confirmed, in_progress, completed, cancelled';

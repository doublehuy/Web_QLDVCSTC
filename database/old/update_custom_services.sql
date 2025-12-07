-- Tạo bảng custom_services nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS custom_services (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('Khám bệnh', 'Cắt tỉa', 'Spa', 'Tiêm phòng', 'Phẫu thuật')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL
);

-- Thêm comment cho các cột
COMMENT ON TABLE custom_services IS 'Bảng lưu trữ các yêu cầu dịch vụ đặc thù từ khách hàng';
COMMENT ON COLUMN custom_services.user_id IS 'ID của người dùng gửi yêu cầu';
COMMENT ON COLUMN custom_services.name IS 'Tên dịch vụ';
COMMENT ON COLUMN custom_services.description IS 'Mô tả chi tiết yêu cầu';
COMMENT ON COLUMN custom_services.requirements IS 'Yêu cầu đặc biệt từ khách hàng';
COMMENT ON COLUMN custom_services.service_type IS 'Loại dịch vụ (Khám bệnh, Cắt tỉa, Spa, Tiêm phòng, Phẫu thuật)';
COMMENT ON COLUMN custom_services.status IS 'Trạng thái yêu cầu (pending, in_progress, completed, rejected)';
COMMENT ON COLUMN custom_services.assigned_employee_id IS 'ID nhân viên được phân công xử lý';

-- Tạo index để tối ưu hiệu suất truy vấn
CREATE INDEX IF NOT EXISTS idx_custom_services_user_id ON custom_services(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_services_status ON custom_services(status);
CREATE INDEX IF NOT EXISTS idx_custom_services_service_type ON custom_services(service_type);
CREATE INDEX IF NOT EXISTS idx_custom_services_assigned_employee_id ON custom_services(assigned_employee_id);

-- Thêm trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger nếu chưa tồn tại
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_custom_services_modtime') THEN
        CREATE TRIGGER update_custom_services_modtime
        BEFORE UPDATE ON custom_services
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END
$$;

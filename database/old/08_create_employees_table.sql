-- Migration: Tạo bảng employees (Nhân viên)
-- Chạy file này để tạo bảng nhân viên trong hệ thống

CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    specialization VARCHAR(100),
    status VARCHAR(20) DEFAULT 'đang làm' CHECK (status IN ('đang làm', 'nghỉ', 'tạm nghỉ', 'nghỉ việc')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thêm comments cho các cột
COMMENT ON COLUMN employees.employee_id IS 'Mã nhân viên tự động tăng';
COMMENT ON COLUMN employees.full_name IS 'Họ tên đầy đủ của nhân viên';
COMMENT ON COLUMN employees.phone IS 'Số điện thoại liên hệ';
COMMENT ON COLUMN employees.email IS 'Email liên hệ của nhân viên';
COMMENT ON COLUMN employees.specialization IS 'Chuyên môn (VD: cắt tỉa, spa, tiêm phòng, khám bệnh...)';
COMMENT ON COLUMN employees.status IS 'Trạng thái làm việc (VD: đang làm, nghỉ, tạm nghỉ, nghỉ việc)';
COMMENT ON COLUMN employees.created_at IS 'Ngày thêm nhân viên vào hệ thống';
COMMENT ON COLUMN employees.updated_at IS 'Ngày cập nhật thông tin nhân viên';

-- Tạo indexes để tối ưu hiệu suất
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_specialization ON employees(specialization);

-- Insert một số dữ liệu mẫu cho nhân viên
INSERT INTO employees (full_name, phone, email, specialization, status) VALUES
('Nguyễn Văn An', '0901234567', 'an.nguyen@petcare.com', 'khám bệnh', 'đang làm'),
('Trần Thị Bình', '0902345678', 'binh.tran@petcare.com', 'cắt tỉa', 'đang làm'),
('Lê Văn Cường', '0903456789', 'cuong.le@petcare.com', 'spa', 'đang làm'),
('Phạm Thị Dung', '0904567890', 'dung.pham@petcare.com', 'tiêm phòng', 'tạm nghỉ'),
('Hoàng Văn Em', '0905678901', 'em.hoang@petcare.com', 'phẫu thuật', 'đang làm');

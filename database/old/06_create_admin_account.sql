-- Script tạo admin account với mật khẩu đúng định dạng bcrypt
-- Chạy script này trong pgAdmin hoặc psql sau khi tạo database

-- Tạo admin với mật khẩu admin123 (đã hash đúng định dạng bcrypt)
INSERT INTO users (email, password_hash, full_name, phone, role)
VALUES
  ('admin@petcare.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Quản trị viên', '0123456789', 'admin')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role;

-- Kiểm tra admin đã được tạo
SELECT id, email, full_name, role, created_at
FROM users
WHERE role = 'admin';

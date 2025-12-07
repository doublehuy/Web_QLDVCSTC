-- Hướng dẫn chạy migrations cho database Pet Care Management System
-- Chạy các file theo thứ tự từ 01 đến 08

-- 1. Đầu tiên tạo database:
-- CREATE DATABASE pet_care_management;

-- 2. Chạy schema chính (nếu muốn tạo tất cả bảng cùng lúc):
-- \i database/schema.sql

-- 3. Hoặc chạy từng migration theo thứ tự:

-- Migration 01-06: Các migration hiện có (nếu có)
-- \i database/01_... (nếu có)
-- \i database/02_... (nếu có)
-- ...

-- Migration 07: Thêm cột hình ảnh cho thú cưng
\i database/07_add_pet_image_column.sql

-- Migration 08: Tạo bảng nhân viên
\i database/08_create_employees_table.sql

-- Migration 10: Cập nhật status cho chức năng phân công nhân viên
\i database/10_add_employee_assignment.sql
-- - Chạy migrations theo thứ tự từ thấp đến cao
-- - Backup database trước khi chạy migrations
-- - Kiểm tra logs để đảm bảo migrations chạy thành công

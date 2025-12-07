-- Tạo bảng thông báo
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receiver_type ENUM('employee', 'user') NOT NULL,
    receiver_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_receiver (receiver_type, receiver_id)
);

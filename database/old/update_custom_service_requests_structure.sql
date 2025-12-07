-- Kiểm tra và thêm cột service_type nếu chưa tồn tại
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'custom_service_requests' AND column_name = 'service_type') THEN
        ALTER TABLE custom_service_requests 
        ADD COLUMN service_type VARCHAR(255) NOT NULL;
    END IF;
    
    -- Thêm cột pet_id nếu chưa tồn tại
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'custom_service_requests' AND column_name = 'pet_id') THEN
        ALTER TABLE custom_service_requests 
        ADD COLUMN pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL;
    END IF;
    
    -- Cập nhật các bản ghi cũ nếu cần
    UPDATE custom_service_requests 
    SET service_type = 'Dịch vụ đặc biệt' 
    WHERE service_type IS NULL;
    
    RAISE NOTICE 'Đã cập nhật cấu trúc bảng custom_service_requests thành công';
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Lỗi khi cập nhật cấu trúc bảng: %', SQLERRM;
END $$;

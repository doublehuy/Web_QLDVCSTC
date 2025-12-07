-- Thêm cột service_type vào bảng custom_service_requests nếu chưa tồn tại
DO $$
BEGIN
    -- Thêm cột service_type nếu chưa tồn tại
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'custom_service_requests' AND column_name = 'service_type') THEN
        ALTER TABLE custom_service_requests 
        ADD COLUMN service_type VARCHAR(50) 
        CHECK (service_type IN ('Khám bệnh', 'Cắt tỉa', 'Spa', 'Tiêm phòng', 'Phẫu thuật'));
        
        -- Thêm index cho cột service_type để tối ưu hiệu suất
        CREATE INDEX idx_custom_service_requests_service_type 
        ON custom_service_requests(service_type);
        
        -- Cập nhật giá trị mặc định cho các bản ghi hiện có
        UPDATE custom_service_requests 
        SET service_type = 'Khám bệnh' 
        WHERE service_type IS NULL;
        
        -- Đặt cột là NOT NULL sau khi đã cập nhật giá trị mặc định
        ALTER TABLE custom_service_requests 
        ALTER COLUMN service_type SET NOT NULL;
        
        RAISE NOTICE 'Đã thêm cột service_type vào bảng custom_service_requests';
    ELSE
        RAISE NOTICE 'Cột service_type đã tồn tại trong bảng custom_service_requests';
    END IF;
    
    -- Cập nhật ràng buộc nếu cần
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'custom_service_requests_service_type_check'
    ) THEN
        ALTER TABLE custom_service_requests
        ADD CONSTRAINT custom_service_requests_service_type_check 
        CHECK (service_type IN ('Khám bệnh', 'Cắt tỉa', 'Spa', 'Tiêm phòng', 'Phẫu thuật'));
    END IF;
    
    -- Thêm comment cho cột service_type
    COMMENT ON COLUMN custom_service_requests.service_type 
    IS 'Loại dịch vụ (Khám bệnh, Cắt tỉa, Spa, Tiêm phòng, Phẫu thuật)';
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Đã xảy ra lỗi: %', SQLERRM;
END $$;

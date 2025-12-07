# 🐾 Pet Care Management System

Hệ thống quản lý dịch vụ chăm sóc thú cưng - Đồ án tốt nghiệp

## 🚀 Cách chạy dự án

### **Yêu cầu hệ thống:**
- Node.js (v16 trở lên)
- PostgreSQL (v12 trở lên)
- Git

### **Bước 1: Cài đặt PostgreSQL**
1. Tải PostgreSQL từ: https://www.postgresql.org/download/windows/
2. Cài đặt với mật khẩu cho user `postgres` (ví dụ: `password`)
3. Mở pgAdmin hoặc Command Prompt và tạo database:

```sql
-- Kết nối với PostgreSQL
psql -U postgres

-- Tạo database
CREATE DATABASE pet_care_management;

-- Thoát
\q
```

4. Import schema:
```bash
psql -U postgres -d pet_care_management -f database/schema.sql
```

### **Bước 2: Cài đặt Dependencies**
```bash
# Cài đặt Backend
cd server
npm install

# Cài đặt Frontend
cd ../client
npm install
```

### **Bước 3: Cấu hình Environment**
File `.env` đã được tạo sẵn trong thư mục `server`. Bạn có thể chỉnh sửa nếu cần:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pet_care_management
DB_USER=postgres
DB_PASSWORD=password
```

### **Bước 4: Chạy dự án**

#### **Cách 1: Tự động (Khuyến nghị)**
Double-click vào file `start-all.bat` trong thư mục gốc.

#### **Cách 2: Thủ công**

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### **Bước 5: Truy cập ứng dụng**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

## 📱 Chức năng chính

### **👤 Người dùng (Customer):**
- ✅ Đăng ký/đăng nhập tài khoản
- ✅ Quản lý thông tin thú cưng
- ✅ Đặt lịch hẹn dịch vụ
- ✅ Xem lịch sử dịch vụ và hóa đơn
- ✅ Dashboard tổng quan

### **👨‍💼 Admin/Staff:**
- ✅ Quản lý khách hàng và thú cưng
- ✅ Quản lý lịch hẹn (duyệt, chỉnh sửa, hủy)
- ✅ Quản lý dịch vụ và hóa đơn
- ✅ Thống kê doanh thu và báo cáo
- ✅ Dashboard admin với biểu đồ

## 🛠️ Công nghệ sử dụng

### **Backend:**
- Node.js + Express.js
- PostgreSQL
- JWT Authentication
- Bcrypt (mã hóa mật khẩu)
- Express Validator

### **Frontend:**
- React.js
- React Router
- React Query
- React Hook Form
- Lucide React (Icons)
- Tailwind CSS

## 📁 Cấu trúc dự án

```
DATN/
├── server/                 # Backend API
│   ├── controllers/        # Logic xử lý
│   ├── middleware/         # Auth, validation
│   ├── routes/            # API routes
│   ├── config/            # Database config
│   └── .env               # Environment variables
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Các trang
│   │   ├── contexts/      # State management
│   │   └── services/      # API calls
├── database/              # SQL schema
├── start-all.bat         # Script chạy tự động
├── start-backend.bat     # Script chạy backend
├── start-frontend.bat    # Script chạy frontend
└── README.md             # Hướng dẫn này
```

## 🔧 Troubleshooting

### **Lỗi kết nối database:**
- Kiểm tra PostgreSQL đã chạy chưa
- Kiểm tra mật khẩu trong file `.env`
- Kiểm tra port 5432 có bị chiếm không

### **Lỗi port đã được sử dụng:**
- Backend: Thay đổi PORT trong file `.env`
- Frontend: Chọn port khác khi được hỏi

### **Lỗi module không tìm thấy:**
- Chạy lại `npm install` trong cả server và client
- Xóa node_modules và package-lock.json rồi cài lại

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. File `HUONG_DAN_CAI_DAT.md` để biết chi tiết
2. Logs trong terminal để xem lỗi cụ thể
3. Đảm bảo tất cả dependencies đã được cài đặt

## 🎯 Tài khoản mặc định

- **Admin:** admin@petcare.com (mật khẩu được tạo trong database)
- **Customer:** Đăng ký tài khoản mới qua giao diện

---

**Chúc bạn thành công với đồ án tốt nghiệp! 🎓**


-- Tạo các bảng cho hệ thống quản lý dịch vụ chăm sóc thú cưng
-- Chạy file này sau khi đã tạo database pet_care_management

-- SCHEMA CHÍNH CHO HỆ THỐNG PET CARE (PostgreSQL)

-- =========================
-- BẢNG users
-- =========================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    address         TEXT,
    role            VARCHAR(50) DEFAULT 'customer',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- BẢNG pets
-- =========================
CREATE TABLE pets (
    id             SERIAL PRIMARY KEY,
    owner_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    species        VARCHAR(100) NOT NULL,
    breed          VARCHAR(100),
    age            INTEGER,
    gender         VARCHAR(50),
    weight         NUMERIC,
    color          VARCHAR(100),
    medical_notes  TEXT,
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url      VARCHAR(500)
);

-- =========================
-- BẢNG employees
-- =========================
CREATE TABLE employees (
    employee_id     SERIAL PRIMARY KEY,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    email           VARCHAR(255),
    specialization  VARCHAR(255),
    status          VARCHAR(50) DEFAULT 'đang làm',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    address         TEXT
);

-- =========================
-- BẢNG services
-- =========================
CREATE TABLE services (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    price            NUMERIC NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category         VARCHAR(100) NOT NULL,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- BẢNG appointments
-- =========================
CREATE TABLE appointments (
    id               SERIAL PRIMARY KEY,
    customer_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    pet_id           INTEGER REFERENCES pets(id) ON DELETE SET NULL,
    service_id       INTEGER REFERENCES services(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status           VARCHAR(50) DEFAULT 'chờ phân công',
    notes            TEXT,
    total_price      NUMERIC,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    employee_id      INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    cancel_reason    TEXT,
    cancelled_by     VARCHAR(100),
    cancelled_at     TIMESTAMP WITH TIME ZONE
);

-- =========================
-- BẢNG invoices
-- =========================
CREATE TABLE invoices (
    id             SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    customer_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    subtotal       NUMERIC NOT NULL,
    tax_amount     NUMERIC DEFAULT 0,
    total_amount   NUMERIC NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(100),
    payment_date   TIMESTAMP,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- BẢNG invoice_items
-- =========================
CREATE TABLE invoice_items (
    id           SERIAL PRIMARY KEY,
    invoice_id   INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    service_id   INTEGER REFERENCES services(id) ON DELETE SET NULL,
    service_name VARCHAR(255) NOT NULL,
    quantity     INTEGER DEFAULT 1,
    unit_price   NUMERIC NOT NULL,
    total_price  NUMERIC NOT NULL
);

-- =========================
-- BẢNG service_history
-- =========================
CREATE TABLE service_history (
    id             SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    pet_id         INTEGER REFERENCES pets(id) ON DELETE SET NULL,
    service_id     INTEGER REFERENCES services(id) ON DELETE SET NULL,
    service_date   DATE NOT NULL,
    notes          TEXT,
    veterinarian   VARCHAR(255),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- BẢNG notifications
-- =========================
CREATE TABLE notifications (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title         VARCHAR(255) NOT NULL,
    message       TEXT NOT NULL,
    type          VARCHAR(50) DEFAULT 'info',
    is_read       BOOLEAN DEFAULT false,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receiver_type VARCHAR(50) NOT NULL DEFAULT 'user',
    receiver_id   INTEGER
);

-- =========================
-- BẢNG system_settings
-- =========================
CREATE TABLE system_settings (
    id            SERIAL PRIMARY KEY,
    setting_key   VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description   TEXT,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- BẢNG custom_service_requests
-- =========================
CREATE TABLE custom_service_requests (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name         VARCHAR(255) NOT NULL,
    description          TEXT NOT NULL,
    special_requirements TEXT,
    status               VARCHAR(50) NOT NULL DEFAULT 'pending',
    admin_notes          TEXT,
    completed_at         TIMESTAMP WITH TIME ZONE,
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    service_type         VARCHAR(100) NOT NULL,
    pet_id               INTEGER REFERENCES pets(id) ON DELETE SET NULL,
    start_date           DATE
);

-- =========================
-- BẢNG custom_service_request_employees
-- =========================
CREATE TABLE custom_service_request_employees (
    id          SERIAL PRIMARY KEY,
    request_id  INTEGER NOT NULL REFERENCES custom_service_requests(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    status      VARCHAR(100) DEFAULT 'pending_employee_confirmation',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =========================
-- INDEXES CƠ BẢN
-- =========================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_pets_owner_id ON pets(owner_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_specialization ON employees(specialization);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

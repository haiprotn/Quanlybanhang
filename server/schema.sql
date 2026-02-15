
-- Chạy đoạn script này trong SQL Editor của Supabase để tạo bảng
-- Lưu ý: Supabase dùng Postgres, nên cú pháp này hoàn toàn tương thích.

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL, 
    price NUMERIC(15, 2) DEFAULT 0,
    cost_price NUMERIC(15, 2) DEFAULT 0,
    unit VARCHAR(20),
    stock_tay_phat INTEGER DEFAULT 0,
    stock_tnc INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    total_debt NUMERIC(15, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(100),
    total_debt_to_supplier NUMERIC(15, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50),
    customer_name VARCHAR(100),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(15, 2) DEFAULT 0,
    paid_amount NUMERIC(15, 2) DEFAULT 0,
    warehouse VARCHAR(50), 
    status VARCHAR(20), 
    invoice_type VARCHAR(20), 
    repair_status VARCHAR(20), 
    note TEXT,
    device_info JSONB,
    items JSONB,
    sales_id VARCHAR(50),
    technician_id VARCHAR(50)
);

-- Insert User Admin Mặc định nếu chưa có
INSERT INTO employees (id, name, role, username, password) 
VALUES ('emp-admin', 'Quản trị viên', 'ADMIN', 'admin', '123')
ON CONFLICT (id) DO NOTHING;

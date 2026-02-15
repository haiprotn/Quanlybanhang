
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Cấu hình Database cho môi trường LOCAL
// Bạn cần cài đặt PostgreSQL trên máy và tạo database tên 'servicesales_pro'
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456', // Mật khẩu DB của bạn
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'servicesales_pro',
};

const pool = new Pool(dbConfig);

// Kiểm tra kết nối DB
pool.connect((err, client, release) => {
  if (err) {
    console.error('LỖI KẾT NỐI DATABASE:', err.message);
    console.error('Hãy đảm bảo bạn đã cài PostgreSQL và tạo database "servicesales_pro"');
  } else {
    console.log('✅ Đã kết nối Database thành công');
    release();
  }
});

app.use(cors());
app.use(bodyParser.json());

// --- API ROUTES ---

// 1. Employees
app.get('/api/employees', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM employees');
        res.json(result.rows);
    } catch (err) { res.status(500).json(err); }
});

app.post('/api/employees', async (req, res) => {
    const { id, name, role, username, password } = req.body;
    try {
        await pool.query('INSERT INTO employees VALUES ($1, $2, $3, $4, $5)', [id, name, role, username, password]);
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

// 2. Products
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        const products = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            sku: row.sku,
            type: row.type,
            price: Number(row.price),
            costPrice: Number(row.cost_price),
            unit: row.unit,
            stock: {
                'Giải pháp Tây Phát': row.stock_tay_phat || 0,
                'TNC': row.stock_tnc || 0
            }
        }));
        res.json(products);
    } catch (err) { res.status(500).json(err); }
});

app.post('/api/products', async (req, res) => {
    const { id, name, sku, type, price, costPrice, unit, stock } = req.body;
    try {
        // Upsert (Insert or Update on conflict) for simple sync logic
        const query = `
            INSERT INTO products (id, name, sku, type, price, cost_price, unit, stock_tay_phat, stock_tnc) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET 
                name = EXCLUDED.name,
                price = EXCLUDED.price,
                cost_price = EXCLUDED.cost_price,
                stock_tay_phat = EXCLUDED.stock_tay_phat,
                stock_tnc = EXCLUDED.stock_tnc;
        `;
        await pool.query(query, 
            [id, name, sku, type, price, costPrice, unit, stock['Giải pháp Tây Phát'], stock['TNC']]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

// 3. Customers
app.get('/api/customers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM customers ORDER BY name');
        const customers = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            phone: row.phone,
            address: row.address,
            totalDebt: Number(row.total_debt)
        }));
        res.json(customers);
    } catch (err) { res.status(500).json(err); }
});

app.post('/api/customers', async (req, res) => {
    const { id, name, phone, address, totalDebt } = req.body;
    try {
        await pool.query('INSERT INTO customers VALUES ($1, $2, $3, $4, $5)', [id, name, phone, address, totalDebt]);
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

app.put('/api/customers/:id', async (req, res) => {
    const { name, phone, address, totalDebt } = req.body;
    try {
        await pool.query(
            'UPDATE customers SET name=$1, phone=$2, address=$3, total_debt=$4 WHERE id=$5', 
            [name, phone, address, totalDebt, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

// 4. Invoices
app.get('/api/invoices', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM invoices ORDER BY date DESC');
        const invoices = result.rows.map(row => ({
            id: row.id,
            customerId: row.customer_id,
            customerName: row.customer_name,
            date: row.date,
            totalAmount: Number(row.total_amount),
            paidAmount: Number(row.paid_amount),
            warehouse: row.warehouse === 'TAY_PHAT' ? 'Giải pháp Tây Phát' : 'TNC',
            status: row.status,
            invoiceType: row.invoice_type,
            repairStatus: row.repair_status,
            note: row.note,
            deviceInfo: row.device_info,
            items: row.items,
            salesId: row.sales_id,
            technicianId: row.technician_id
        }));
        res.json(invoices);
    } catch (err) { res.status(500).json(err); }
});

app.post('/api/invoices', async (req, res) => {
    const inv = req.body;
    try {
        await pool.query(
            'INSERT INTO invoices (id, customer_id, customer_name, date, total_amount, paid_amount, warehouse, status, invoice_type, repair_status, note, device_info, items, sales_id, technician_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)',
            [inv.id, inv.customerId, inv.customerName, inv.date, inv.totalAmount, inv.paidAmount, inv.warehouse === 'Giải pháp Tây Phát' ? 'TAY_PHAT' : 'TNC', inv.status, inv.invoiceType, inv.repairStatus, inv.note, JSON.stringify(inv.deviceInfo), JSON.stringify(inv.items), inv.salesId, inv.technicianId]
        );
        res.json({ success: true });
    } catch (err) { 
        console.error(err);
        res.status(500).json(err); 
    }
});

app.put('/api/invoices/:id', async (req, res) => {
    const inv = req.body;
    try {
        await pool.query(
            `UPDATE invoices SET 
                total_amount=$1, paid_amount=$2, status=$3, repair_status=$4, 
                note=$5, device_info=$6, items=$7, sales_id=$8, technician_id=$9 
             WHERE id=$10`,
            [inv.totalAmount, inv.paidAmount, inv.status, inv.repairStatus, inv.note, JSON.stringify(inv.deviceInfo), JSON.stringify(inv.items), inv.salesId, inv.technicianId, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

// 5. Suppliers
app.get('/api/suppliers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM suppliers');
        const rows = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            phone: row.phone,
            address: row.address,
            contactPerson: row.contact_person,
            totalDebtToSupplier: Number(row.total_debt_to_supplier)
        }));
        res.json(rows);
    } catch (err) { res.status(500).json(err); }
});

app.post('/api/suppliers', async (req, res) => {
    const { id, name, phone, address, contactPerson, totalDebtToSupplier } = req.body;
    try {
        await pool.query(
            'INSERT INTO suppliers VALUES ($1, $2, $3, $4, $5, $6)', 
            [id, name, phone, address, contactPerson, totalDebtToSupplier]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

// Start Server
app.listen(port, () => {
  console.log(`\n🚀 LOCAL SERVER ĐANG CHẠY TẠI: http://localhost:${port}`);
  console.log(`   - Frontend Proxy: http://localhost:5173/api -> http://localhost:${port}/api\n`);
});

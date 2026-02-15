
import { Customer, Invoice, Product, ProductType, Warehouse, Employee, Supplier, RoleDefinition, SystemSettings } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'Nguyễn Văn Quản Lý', role: 'ADMIN', username: 'admin', password: '123' },
  { id: 'emp2', name: 'Trần Kỹ Thuật', role: 'TECHNICIAN', username: 'tech', password: '123' },
  { id: 'emp3', name: 'Lê Bán Hàng', role: 'SALES', username: 'sales', password: '123' },
  { id: 'emp4', name: 'Phạm Kế Toán', role: 'ACCOUNTANT', username: 'ketoan', password: '123' },
  { id: 'emp5', name: 'Võ Thủ Kho', role: 'WAREHOUSE', username: 'kho', password: '123' },
];

export const MOCK_SUPPLIERS: Supplier[] = [
    { id: 'sup1', name: 'Linh Kiện Lê Nam', phone: '0901234567', contactPerson: 'A. Nam', totalDebtToSupplier: 0 },
    { id: 'sup2', name: 'Kho Sỉ Minh Thông', phone: '0987654321', contactPerson: 'C. Thảo', totalDebtToSupplier: 5000000 },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 's1',
    name: 'Dịch vụ Cài Win + Vệ sinh máy',
    sku: 'SV-BASIC-01',
    type: ProductType.SERVICE,
    price: 150000,
    costPrice: 0,
    stock: { [Warehouse.TAY_PHAT]: 9999, [Warehouse.TNC]: 9999 },
    unit: 'Lần',
  },
  {
    id: 's2',
    name: 'Kiểm tra lỗi phần cứng (Phí dịch vụ)',
    sku: 'SV-CHECK-01',
    type: ProductType.SERVICE,
    price: 100000,
    costPrice: 0,
    stock: { [Warehouse.TAY_PHAT]: 9999, [Warehouse.TNC]: 9999 },
    unit: 'Lần',
  },
  {
    id: 's3',
    name: 'Thay Keo tản nhiệt MX4',
    sku: 'SV-THERMAL',
    type: ProductType.GOODS,
    price: 50000,
    costPrice: 20000,
    stock: { [Warehouse.TAY_PHAT]: 50, [Warehouse.TNC]: 50 },
    unit: 'Lần',
  },
  {
    id: 'p1',
    name: 'RAM DDR4 8GB Bus 3200 Kingston',
    sku: 'RAM-D4-8G',
    type: ProductType.GOODS,
    price: 650000,
    costPrice: 450000,
    stock: { [Warehouse.TAY_PHAT]: 10, [Warehouse.TNC]: 5 },
    unit: 'Thanh',
  },
  {
    id: 'p2',
    name: 'SSD 240GB Western Digital Green',
    sku: 'SSD-WD-240',
    type: ProductType.GOODS,
    price: 550000,
    costPrice: 380000,
    stock: { [Warehouse.TAY_PHAT]: 8, [Warehouse.TNC]: 12 },
    unit: 'Cái',
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
    { id: 'c1', name: 'Nguyễn Văn Khách', phone: '0909111222', address: 'KP3, P.3, TP. Tây Ninh', totalDebt: 0 },
    { id: 'c2', name: 'Công ty TNHH ABC', phone: '02763888999', address: 'Khu CN Trảng Bàng', totalDebt: 2500000 },
];

export const MOCK_INVOICES: Invoice[] = [
    {
        id: 'INV-DEMO-01',
        customerId: 'c1',
        customerName: 'Nguyễn Văn Khách',
        date: new Date().toISOString(),
        items: [
            { productId: 's1', productName: 'Dịch vụ Cài Win + Vệ sinh máy', quantity: 1, price: 150000, type: ProductType.SERVICE }
        ],
        totalAmount: 150000,
        paidAmount: 150000,
        warehouse: Warehouse.TAY_PHAT,
        status: 'PAID',
        invoiceType: 'SALE'
    },
    {
        id: 'REP-DEMO-02',
        customerId: 'c2',
        customerName: 'Công ty TNHH ABC',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        items: [],
        totalAmount: 0,
        paidAmount: 0,
        warehouse: Warehouse.TNC,
        status: 'UNPAID',
        invoiceType: 'REPAIR',
        repairStatus: 'CHECKING',
        deviceInfo: {
            deviceName: 'PC Văn Phòng Dell Vostro',
            symptoms: 'Máy chạy chậm, hay bị màn hình xanh',
            password: '',
            accessories: 'Chỉ máy'
        },
        note: 'Đã nhận máy, đang test RAM'
    }
];

// Cấu hình phân quyền mặc định
export const DEFAULT_ROLE_DEFINITIONS: RoleDefinition[] = [
    {
        code: 'ADMIN',
        name: 'Quản trị viên',
        description: 'Toàn quyền hệ thống',
        permissions: [
            'VIEW_DASHBOARD', 'VIEW_POS', 'VIEW_REPAIR_TICKETS', 'VIEW_INVENTORY', 
            'VIEW_IMPORT_GOODS', 'VIEW_STOCK_REPORT', 'VIEW_DEBT', 'VIEW_VAT_INVOICES', 
            'VIEW_CUSTOMERS', 'VIEW_SUPPLIERS', 'VIEW_EMPLOYEES', 'VIEW_SETTINGS',
            'ACTION_DELETE_DATA', 'ACTION_EDIT_PRICE'
        ]
    },
    {
        code: 'SALES',
        name: 'Nhân viên Kinh doanh',
        description: 'Bán hàng, xem kho, quản lý khách',
        permissions: [
            'VIEW_DASHBOARD', 'VIEW_POS', 'VIEW_REPAIR_TICKETS', 'VIEW_INVENTORY', 
            'VIEW_STOCK_REPORT', 'VIEW_DEBT', 'VIEW_CUSTOMERS', 'VIEW_SUPPLIERS'
        ]
    },
    {
        code: 'TECHNICIAN',
        name: 'Kỹ thuật viên',
        description: 'Sửa chữa, xem kho linh kiện',
        permissions: [
            'VIEW_REPAIR_TICKETS', 'VIEW_INVENTORY'
        ]
    },
    {
        code: 'ACCOUNTANT',
        name: 'Kế toán',
        description: 'Quản lý công nợ, hóa đơn VAT, báo cáo',
        permissions: [
            'VIEW_DASHBOARD', 'VIEW_DEBT', 'VIEW_VAT_INVOICES', 
            'VIEW_STOCK_REPORT', 'VIEW_CUSTOMERS', 'VIEW_SUPPLIERS'
        ]
    },
    {
        code: 'WAREHOUSE',
        name: 'Thủ kho',
        description: 'Nhập hàng, quản lý tồn kho',
        permissions: [
            'VIEW_INVENTORY', 'VIEW_IMPORT_GOODS', 'VIEW_STOCK_REPORT', 'VIEW_SUPPLIERS'
        ]
    }
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    companyName: 'GIẢI PHÁP TÂY PHÁT & TNC',
    companyAddress: '123 Đường ABC, Phường 1, TP. Tây Ninh',
    companyPhone: '0909.123.456',
    invoiceFooterNote: 'Cảm ơn quý khách đã tin tưởng và ủng hộ!\nHàng hóa mua rồi miễn đổi trả nếu không do lỗi kỹ thuật.',
    repairTicketFooterNote: '* Quý khách vui lòng giữ biên nhận để nhận máy.\n* Trung tâm không chịu trách nhiệm về dữ liệu cá nhân nếu không được yêu cầu sao lưu.'
};


import { Customer, Invoice, Product, ProductType, Warehouse, Employee, Supplier, RoleDefinition, SystemSettings } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'Nguyễn Quản Lý', role: 'ADMIN', username: 'admin', password: '123' },
  { id: 'emp2', name: 'Trần Tư Vấn', role: 'SALES', username: 'sales', password: '123' },
  { id: 'emp3', name: 'Lê Kho Vận', role: 'WAREHOUSE', username: 'kho', password: '123' },
  { id: 'emp4', name: 'Phạm Kế Toán', role: 'ACCOUNTANT', username: 'ketoan', password: '123' },
];

export const MOCK_SUPPLIERS: Supplier[] = [
    { id: 'sup1', name: 'Công Ty CP Sữa Việt Nam (Vinamilk)', phone: '1900 636 979', contactPerson: 'Đại diện KV', totalDebtToSupplier: 15000000 },
    { id: 'sup2', name: 'NPP Sữa Ngoại Nhập', phone: '0909 999 888', contactPerson: 'Chị Lan', totalDebtToSupplier: 5000000 },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Sữa bột Vinamilk Dielac Alpha Gold 4 (900g)',
    sku: 'VNM-DA4-900',
    type: ProductType.GOODS,
    price: 250000,
    costPrice: 210000,
    stock: { [Warehouse.TAY_PHAT]: 50, [Warehouse.TNC]: 20 },
    unit: 'Hộp',
  },
  {
    id: 'p2',
    name: 'Sữa tươi tiệt trùng TH true MILK ít đường 1L',
    sku: 'TH-IT-1L',
    type: ProductType.GOODS,
    price: 35000,
    costPrice: 28000,
    stock: { [Warehouse.TAY_PHAT]: 120, [Warehouse.TNC]: 240 },
    unit: 'Hộp',
  },
  {
    id: 'p3',
    name: 'Sữa Abbott Ensure Gold Vani (850g)',
    sku: 'AB-ENS-850',
    type: ProductType.GOODS,
    price: 790000,
    costPrice: 720000,
    stock: { [Warehouse.TAY_PHAT]: 15, [Warehouse.TNC]: 10 },
    unit: 'Hộp',
  },
  {
    id: 'p4',
    name: 'Tã quần Bobby Size XL (62 miếng)',
    sku: 'BB-Quan-XL62',
    type: ProductType.GOODS,
    price: 320000,
    costPrice: 280000,
    stock: { [Warehouse.TAY_PHAT]: 30, [Warehouse.TNC]: 0 },
    unit: 'Bịch',
  },
  {
    id: 's1',
    name: 'Dịch vụ Giao hàng tận nơi (<5km)',
    sku: 'DV-SHIP-5',
    type: ProductType.SERVICE,
    price: 15000,
    costPrice: 10000,
    stock: { [Warehouse.TAY_PHAT]: 999, [Warehouse.TNC]: 999 },
    unit: 'Lần',
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
    { id: 'c1', name: 'Chị Hoa (Khách lẻ)', phone: '0901234567', address: 'P3, TP. Tây Ninh', totalDebt: 0 },
    { id: 'c2', name: 'Trường Mầm Non Họa Mi', phone: '02763888999', address: 'P1, TP. Tây Ninh', totalDebt: 3500000 },
];

export const MOCK_INVOICES: Invoice[] = [
    {
        id: 'INV-001',
        customerId: 'c1',
        customerName: 'Chị Hoa (Khách lẻ)',
        date: new Date().toISOString(),
        items: [
            { productId: 'p1', productName: 'Sữa bột Vinamilk Dielac Alpha Gold 4 (900g)', quantity: 2, price: 250000, type: ProductType.GOODS }
        ],
        totalAmount: 500000,
        paidAmount: 500000,
        warehouse: Warehouse.TAY_PHAT,
        status: 'PAID',
        invoiceType: 'SALE'
    },
    {
        id: 'INV-002',
        customerId: 'c2',
        customerName: 'Trường Mầm Non Họa Mi',
        date: new Date(Date.now() - 86400000).toISOString(), 
        items: [
             { productId: 'p2', productName: 'Sữa tươi tiệt trùng TH true MILK ít đường 1L', quantity: 20, price: 35000, type: ProductType.GOODS }
        ],
        totalAmount: 700000,
        paidAmount: 0,
        warehouse: Warehouse.TNC,
        status: 'UNPAID',
        invoiceType: 'SALE'
    }
];

export const DEFAULT_ROLE_DEFINITIONS: RoleDefinition[] = [
    {
        code: 'ADMIN',
        name: 'Quản lý Cửa hàng',
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
        name: 'Nhân viên Bán hàng',
        description: 'Bán hàng, tư vấn sữa',
        permissions: [
            'VIEW_DASHBOARD', 'VIEW_POS', 'VIEW_INVENTORY', 
            'VIEW_CUSTOMERS'
        ]
    },
    {
        code: 'TECHNICIAN',
        name: 'Tư vấn dinh dưỡng',
        description: 'Tư vấn, CSKH',
        permissions: [
            'VIEW_CUSTOMERS', 'VIEW_INVENTORY'
        ]
    },
    {
        code: 'ACCOUNTANT',
        name: 'Kế toán',
        description: 'Công nợ, Hóa đơn VAT',
        permissions: [
            'VIEW_DASHBOARD', 'VIEW_DEBT', 'VIEW_VAT_INVOICES', 
            'VIEW_STOCK_REPORT', 'VIEW_CUSTOMERS', 'VIEW_SUPPLIERS'
        ]
    },
    {
        code: 'WAREHOUSE',
        name: 'Thủ kho',
        description: 'Nhập hàng, kiểm kho',
        permissions: [
            'VIEW_INVENTORY', 'VIEW_IMPORT_GOODS', 'VIEW_STOCK_REPORT', 'VIEW_SUPPLIERS'
        ]
    }
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    companyName: 'ĐẠI LÝ SỮA TÂY PHÁT & TNC',
    companyAddress: '123 Đường 30/4, TP. Tây Ninh',
    companyPhone: '0909.123.456',
    invoiceFooterNote: 'Sữa mẹ là thức ăn tốt nhất cho trẻ sơ sinh và trẻ nhỏ.\nCảm ơn quý khách đã tin dùng sản phẩm!',
    repairTicketFooterNote: 'Quý khách vui lòng kiểm tra hạn sử dụng trước khi rời quầy.'
};


import { Customer, Invoice, Product, ProductType, Warehouse, Employee, Supplier } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'Nguyễn Văn Quản Lý', role: 'ADMIN', username: 'admin' },
  { id: 'emp2', name: 'Trần Kỹ Thuật', role: 'TECHNICIAN', username: 'tech' },
  { id: 'emp3', name: 'Lê Bán Hàng', role: 'SALES', username: 'sales' },
];

export const MOCK_SUPPLIERS: Supplier[] = [
    { id: 'sup1', name: 'Linh Kiện Lê Nam', phone: '0901234567', contactPerson: 'A. Nam', totalDebtToSupplier: 0 },
    { id: 'sup2', name: 'Kho Sỉ Minh Thông', phone: '0987654321', contactPerson: 'C. Thảo', totalDebtToSupplier: 5000000 },
];

// Giữ lại một số dịch vụ cơ bản để phần mềm có thể hoạt động ngay
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
  }
];

// Xóa sạch dữ liệu khách hàng
export const MOCK_CUSTOMERS: Customer[] = [];

// Xóa sạch dữ liệu hóa đơn
export const MOCK_INVOICES: Invoice[] = [];

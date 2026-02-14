
export enum Warehouse {
  TAY_PHAT = 'Giải pháp Tây Phát',
  TNC = 'TNC',
}

export enum ProductType {
  GOODS = 'Hàng hóa',
  SERVICE = 'Dịch vụ sửa chữa',
}

export type Role = 'ADMIN' | 'TECHNICIAN' | 'SALES';

export interface Employee {
  id: string;
  name: string;
  role: Role;
  username: string; // For display/login simulation
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  type: ProductType;
  price: number;
  costPrice: number;
  stock: Record<Warehouse, number>; // Inventory per warehouse
  unit: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalDebt: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  contactPerson?: string;
  totalDebtToSupplier: number; // Tiền mình nợ NCC
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  warehouse: Warehouse;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    importPrice: number;
  }[];
  totalAmount: number;
  paidAmount: number; // Số tiền mình trả NCC
  status: 'COMPLETED' | 'PENDING';
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  type: ProductType;
}

export interface DeviceInfo {
  deviceName: string;
  model?: string;
  serial?: string;
  password?: string;
  symptoms: string; // Tình trạng khách báo
  diagnosis?: string; // Kỹ thuật chẩn đoán bệnh
  accessories?: string; // phu kien kem theo
  appearance?: string; // Tình trạng ngoại quan (trầy xước, móp...)
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  warehouse: Warehouse;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED';
  invoiceType: 'SALE' | 'REPAIR'; 
  
  // Updated Workflow: 
  // RECEIVED (Tiếp nhận) -> CHECKING (Kiểm tra) -> QUOTING (Báo giá) -> WAITING_PARTS (Chờ đồ) -> IN_PROGRESS (Đang sửa) -> COMPLETED (Xong) -> DELIVERED (Đã trả)
  repairStatus?: 'RECEIVED' | 'CHECKING' | 'QUOTING' | 'WAITING_PARTS' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED'; 
  
  note?: string; // Ghi chú chung / Ghi chú nội bộ
  deviceInfo?: DeviceInfo; 
  technicianId?: string; // Kỹ thuật phụ trách
  salesId?: string; // Sale phụ trách
}

export interface VATInvoiceItem {
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface VATInvoice {
    id: string;
    invoiceNumber: string; // Số hóa đơn đỏ
    date: string;
    partnerName: string; // Tên công ty mua/bán
    taxCode: string; // Mã số thuế
    
    // Updated: Detailed items instead of simple description
    items: VATInvoiceItem[];
    
    totalBeforeTax: number;
    taxRate: number; // 8% or 10%
    taxAmount: number;
    totalAmount: number;
    type: 'IN' | 'OUT'; // Đầu vào (Mua) hoặc Đầu ra (Bán)
    
    warehouse: Warehouse; // Hóa đơn này thuộc về công ty nào (TNC hay Tây Phát)

    status: 'PENDING' | 'SYNCED'; // SYNCED means items are imported to inventory
}

export type PageView = 'DASHBOARD' | 'POS' | 'INVENTORY' | 'DEBT' | 'CUSTOMERS' | 'REPAIR_TICKETS' | 'EMPLOYEES' | 'SUPPLIERS' | 'IMPORT_GOODS' | 'VAT_INVOICES' | 'STOCK_REPORT';

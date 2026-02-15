
export enum Warehouse {
  TAY_PHAT = 'Giải pháp Tây Phát',
  TNC = 'TNC',
}

export enum ProductType {
  GOODS = 'Hàng hóa',
  SERVICE = 'Dịch vụ sửa chữa',
}

// Mở rộng thêm các vai trò phổ biến
export type Role = 'ADMIN' | 'TECHNICIAN' | 'SALES' | 'ACCOUNTANT' | 'WAREHOUSE';

// Định nghĩa danh sách các quyền hạn trong hệ thống
export type Permission = 
    | 'VIEW_DASHBOARD'
    | 'VIEW_POS'
    | 'VIEW_REPAIR_TICKETS'
    | 'VIEW_INVENTORY'
    | 'VIEW_IMPORT_GOODS'
    | 'VIEW_STOCK_REPORT'
    | 'VIEW_DEBT'
    | 'VIEW_VAT_INVOICES'
    | 'VIEW_CUSTOMERS'
    | 'VIEW_SUPPLIERS'
    | 'VIEW_EMPLOYEES'
    | 'VIEW_SETTINGS'
    | 'ACTION_DELETE_DATA' // Quyền xóa dữ liệu nhạy cảm
    | 'ACTION_EDIT_PRICE'; // Quyền sửa giá

export interface RoleDefinition {
    code: Role;
    name: string;
    permissions: Permission[];
    description?: string;
}

export interface SystemSettings {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    invoiceFooterNote: string; // Lời chào cuối hóa đơn bán lẻ
    repairTicketFooterNote: string; // Ghi chú cuối phiếu tiếp nhận
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  username: string; 
  password?: string; 
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  type: ProductType;
  price: number;
  costPrice: number;
  stock: Record<Warehouse, number>; 
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
  totalDebtToSupplier: number; 
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
  paidAmount: number; 
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
  symptoms: string; 
  diagnosis?: string; 
  accessories?: string; 
  appearance?: string; 
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
  
  repairStatus?: 'RECEIVED' | 'CHECKING' | 'QUOTING' | 'WAITING_PARTS' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED'; 
  
  note?: string; 
  deviceInfo?: DeviceInfo; 
  technicianId?: string; 
  salesId?: string; 
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
    invoiceNumber: string; 
    date: string;
    partnerName: string; 
    taxCode: string; 
    items: VATInvoiceItem[];
    totalBeforeTax: number;
    taxRate: number; 
    taxAmount: number;
    totalAmount: number;
    type: 'IN' | 'OUT'; 
    warehouse: Warehouse; 
    status: 'PENDING' | 'SYNCED'; 
}

export type PageView = 'DASHBOARD' | 'POS' | 'INVENTORY' | 'DEBT' | 'CUSTOMERS' | 'REPAIR_TICKETS' | 'EMPLOYEES' | 'SUPPLIERS' | 'IMPORT_GOODS' | 'VAT_INVOICES' | 'STOCK_REPORT' | 'SETTINGS';

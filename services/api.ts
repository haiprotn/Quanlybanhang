
import { Employee, Product, Customer, Invoice, Supplier, Warehouse } from '../types';
import { MOCK_EMPLOYEES, MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_INVOICES, MOCK_SUPPLIERS } from '../constants';

// --- IN-MEMORY DATA STORE (SIMULATING DATABASE) ---
// Data will persist only until page refresh
let employees = [...MOCK_EMPLOYEES];
let products = [...MOCK_PRODUCTS];
let customers = [...MOCK_CUSTOMERS];
let invoices = [...MOCK_INVOICES];
let suppliers = [...MOCK_SUPPLIERS];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    // --- EMPLOYEES ---
    getEmployees: async (): Promise<Employee[]> => {
        await delay(300);
        return [...employees];
    },
    
    addEmployee: async (emp: Employee) => {
        await delay(300);
        employees = [emp, ...employees];
        return { success: true };
    },

    deleteEmployee: async (id: string) => {
        await delay(300);
        employees = employees.filter(e => e.id !== id);
        return { success: true };
    },

    // --- PRODUCTS ---
    getProducts: async (): Promise<Product[]> => {
        await delay(300);
        return [...products];
    },

    addProduct: async (prod: Product) => {
        await delay(300);
        // Check if exists to update or add
        const idx = products.findIndex(p => p.id === prod.id);
        if (idx >= 0) {
            products[idx] = prod;
        } else {
            products = [prod, ...products];
        }
        return { success: true };
    },

    // --- CUSTOMERS ---
    getCustomers: async (): Promise<Customer[]> => {
        await delay(300);
        return [...customers];
    },

    addCustomer: async (cust: Customer) => {
        await delay(300);
        customers = [cust, ...customers];
        return { success: true };
    },

    updateCustomer: async (cust: Customer) => {
        await delay(300);
        customers = customers.map(c => c.id === cust.id ? cust : c);
        return { success: true };
    },

    // --- INVOICES ---
    getInvoices: async (): Promise<Invoice[]> => {
        await delay(300);
        return [...invoices];
    },

    addInvoice: async (inv: Invoice) => {
        await delay(300);
        invoices = [inv, ...invoices];
        return { success: true };
    },

    updateInvoice: async (inv: Invoice) => {
        await delay(300);
        invoices = invoices.map(i => i.id === inv.id ? inv : i);
        return { success: true };
    },

    // --- SUPPLIERS ---
    getSuppliers: async (): Promise<Supplier[]> => {
        await delay(300);
        return [...suppliers];
    },

    addSupplier: async (sup: Supplier) => {
        await delay(300);
        suppliers = [sup, ...suppliers];
        return { success: true };
    }
};

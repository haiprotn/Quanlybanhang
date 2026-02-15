
import { Employee, Product, Customer, Invoice, Supplier, Warehouse } from '../types';

// Hàm gọi API nội bộ
const fetchJson = async (url: string, options?: RequestInit) => {
    try {
        const res = await fetch(`/api${url}`, options);
        if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        throw error;
    }
};

export const api = {
    // --- EMPLOYEES ---
    getEmployees: async (): Promise<Employee[]> => {
        try {
            return await fetchJson('/employees');
        } catch (e) { return []; }
    },
    
    addEmployee: async (emp: Employee) => {
        try {
            return await fetchJson('/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emp)
            });
        } catch (e) { return { success: false }; }
    },

    deleteEmployee: async (id: string) => {
        try {
            return await fetchJson(`/employees/${id}`, { method: 'DELETE' });
        } catch (e) { return { success: false }; }
    },

    // --- PRODUCTS ---
    getProducts: async (): Promise<Product[]> => {
        try {
            return await fetchJson('/products');
        } catch (e) { return []; }
    },

    addProduct: async (prod: Product) => {
        try {
            return await fetchJson('/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prod)
            });
        } catch (e) { return { success: false }; }
    },

    // --- CUSTOMERS ---
    getCustomers: async (): Promise<Customer[]> => {
        try {
            return await fetchJson('/customers');
        } catch (e) { return []; }
    },

    addCustomer: async (cust: Customer) => {
        try {
            return await fetchJson('/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cust)
            });
        } catch (e) { return { success: false }; }
    },

    updateCustomer: async (cust: Customer) => {
        try {
            return await fetchJson(`/customers/${cust.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cust)
            });
        } catch (e) { return { success: false }; }
    },

    // --- INVOICES ---
    getInvoices: async (): Promise<Invoice[]> => {
        try {
            return await fetchJson('/invoices');
        } catch (e) { return []; }
    },

    addInvoice: async (inv: Invoice) => {
        try {
            return await fetchJson('/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inv)
            });
        } catch (e) { return { success: false }; }
    },

    updateInvoice: async (inv: Invoice) => {
        try {
            return await fetchJson(`/invoices/${inv.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inv)
            });
        } catch (e) { return { success: false }; }
    },

    // --- SUPPLIERS ---
    getSuppliers: async (): Promise<Supplier[]> => {
        try {
            return await fetchJson('/suppliers');
        } catch (e) { return []; }
    },

    addSupplier: async (sup: Supplier) => {
        try {
            return await fetchJson('/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sup)
            });
        } catch (e) { return { success: false }; }
    }
};

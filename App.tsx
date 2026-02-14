
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import DebtManagement from './pages/DebtManagement';
import POS from './pages/POS';
import Customers from './pages/Customers';
import RepairTickets from './pages/RepairTickets';
import EmployeeManagement from './pages/EmployeeManagement';
import Login from './pages/Login';
import Suppliers from './pages/Suppliers';
import ImportGoods from './pages/ImportGoods';
import VATInvoices from './pages/VATInvoices';
import StockReport from './pages/StockReport';
import { PageView, Invoice, Customer, Product, Employee, Supplier, PurchaseOrder, VATInvoice } from './types';
import { MOCK_CUSTOMERS, MOCK_INVOICES, MOCK_PRODUCTS, MOCK_EMPLOYEES, MOCK_SUPPLIERS } from './constants';

const App: React.FC = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  const [currentView, setCurrentView] = useState<PageView>('DASHBOARD');
  
  // Data State
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vatInvoices, setVatInvoices] = useState<VATInvoice[]>([]);

  const handleLogin = (employee: Employee) => {
    setCurrentUser(employee);
    setIsLoggedIn(true);
    // Redirect based on role
    if (employee.role === 'TECHNICIAN') {
      setCurrentView('REPAIR_TICKETS');
    } else {
      setCurrentView('DASHBOARD');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const handleAddInvoice = (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
    // Also update customer debt if partial/unpaid
    if (newInvoice.status !== 'PAID' && newInvoice.status !== 'CANCELLED') {
        const debtAmount = newInvoice.totalAmount - newInvoice.paidAmount;
        if (debtAmount > 0) {
            setCustomers(prev => prev.map(c => 
                c.id === newInvoice.customerId 
                ? { ...c, totalDebt: c.totalDebt + debtAmount }
                : c
            ));
        }
    }
  };

  const handleUpdateInvoice = (invoiceId: string, updates: Partial<Invoice>) => {
      // Find the invoice in current state
      const oldInvoice = invoices.find(i => i.id === invoiceId);
      if (!oldInvoice) return;

      const updatedInvoice = { ...oldInvoice, ...updates };
      
      // 1. Update Invoices State
      setInvoices(prevInvoices => 
          prevInvoices.map(inv => inv.id === invoiceId ? updatedInvoice : inv)
      );

      // 2. Calculate and Update Debt (Side Effect)
      const getDebt = (inv: Invoice) => {
          if (inv.status === 'CANCELLED') return 0;
          return Math.max(0, inv.totalAmount - inv.paidAmount);
      };

      const oldDebt = getDebt(oldInvoice);
      const newDebt = getDebt(updatedInvoice);
      const debtDiff = newDebt - oldDebt;

      // Update customer debt if there is a difference
      if (debtDiff !== 0) {
          setCustomers(prevCust => prevCust.map(c => 
              c.id === updatedInvoice.customerId 
              ? { ...c, totalDebt: Math.max(0, c.totalDebt + debtDiff) }
              : c
          ));
      }
  };

  const handleAddEmployee = (emp: Employee) => {
      setEmployees(prev => [...prev, emp]);
  }
  
  const handleDeleteEmployee = (id: string) => {
      setEmployees(prev => prev.filter(e => e.id !== id));
  }

  const handleAddSupplier = (s: Supplier) => {
      setSuppliers(prev => [...prev, s]);
  }

  const handleImportGoods = (po: PurchaseOrder) => {
      // 1. Save PO
      setPurchaseOrders(prev => [po, ...prev]);

      // 2. Update Supplier Debt
      const debt = po.totalAmount - po.paidAmount;
      if (debt > 0) {
          setSuppliers(prev => prev.map(s => 
              s.id === po.supplierId ? { ...s, totalDebtToSupplier: s.totalDebtToSupplier + debt } : s
          ));
      }

      // 3. Update Inventory Stock (Crucial!)
      setProducts(prevProds => prevProds.map(p => {
          const itemInPO = po.items.find(item => item.productId === p.id);
          if (itemInPO) {
              const newStock = { ...p.stock };
              newStock[po.warehouse] = (newStock[po.warehouse] || 0) + itemInPO.quantity;
              return { ...p, stock: newStock }; 
              // Note: Could also update costPrice here using weighted average if needed
          }
          return p;
      }));
  }

  const handleAddVATInvoice = (inv: VATInvoice) => {
      setVatInvoices(prev => [inv, ...prev]);
  }

  const handleUpdateVATInvoice = (updatedInv: VATInvoice) => {
      setVatInvoices(prev => prev.map(inv => inv.id === updatedInv.id ? updatedInv : inv));
  }

  const renderContent = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard invoices={invoices} />;
      case 'INVENTORY':
        return <Inventory products={products} onAddProduct={handleAddProduct} />;
      case 'DEBT':
        return <DebtManagement customers={customers} invoices={invoices} />;
      case 'POS':
        return (
            <POS 
                products={products} 
                customers={customers} 
                onAddInvoice={handleAddInvoice} 
                onAddCustomer={handleAddCustomer}
            />
        );
      case 'REPAIR_TICKETS':
        return (
            <RepairTickets 
                invoices={invoices} 
                customers={customers} 
                products={products} 
                currentUser={currentUser}
                onUpdateInvoice={handleUpdateInvoice} 
                onAddInvoice={handleAddInvoice}
                onAddCustomer={handleAddCustomer}
            />
        );
      case 'CUSTOMERS':
        return <Customers customers={customers} onAddCustomer={handleAddCustomer} />;
      case 'EMPLOYEES':
        return <EmployeeManagement employees={employees} onAddEmployee={handleAddEmployee} onDeleteEmployee={handleDeleteEmployee} />;
      case 'SUPPLIERS':
        return <Suppliers suppliers={suppliers} onAddSupplier={handleAddSupplier} />;
      case 'IMPORT_GOODS':
        return <ImportGoods products={products} suppliers={suppliers} onImport={handleImportGoods} />;
      case 'VAT_INVOICES':
        return (
            <VATInvoices 
                invoices={vatInvoices} 
                onAddInvoice={handleAddVATInvoice} 
                onUpdateInvoice={handleUpdateVATInvoice}
            />
        );
      case 'STOCK_REPORT':
        return <StockReport products={products} invoices={invoices} purchaseOrders={purchaseOrders} />;
      default:
        return <Dashboard invoices={invoices} />;
    }
  };

  if (!isLoggedIn || !currentUser) {
    return <Login employees={employees} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        currentUser={currentUser}
        onSwitchUser={() => {}} // No longer used
        employees={employees}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-64 p-8 h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;

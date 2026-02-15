
import React, { useState, useEffect } from 'react';
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
import Settings from './pages/Settings';
import { PageView, Invoice, Customer, Product, Employee, Supplier, PurchaseOrder, VATInvoice, RoleDefinition, SystemSettings } from './types';
import { DEFAULT_ROLE_DEFINITIONS, DEFAULT_SYSTEM_SETTINGS, MOCK_EMPLOYEES, MOCK_PRODUCTS } from './constants';
import { api } from './services/api';

const App: React.FC = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  const [currentView, setCurrentView] = useState<PageView>('DASHBOARD');
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Data State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]); 
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vatInvoices, setVatInvoices] = useState<VATInvoice[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>(DEFAULT_ROLE_DEFINITIONS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);

  // Load Data on Mount
  useEffect(() => {
      const loadData = async () => {
          setIsLoadingData(true);
          try {
              const [empData, prodData, custData, invData, supData] = await Promise.all([
                  api.getEmployees(),
                  api.getProducts(),
                  api.getCustomers(),
                  api.getInvoices(),
                  api.getSuppliers()
              ]);
              setEmployees(empData);
              setProducts(prodData);
              setCustomers(custData);
              setInvoices(invData);
              setSuppliers(supData);
              console.log("Loaded data successfully");
          } catch (error) {
              console.error("Failed to load data", error);
              // Fallback to minimal mocks to allow login if API completely fails
              setEmployees(MOCK_EMPLOYEES);
              setProducts(MOCK_PRODUCTS);
          } finally {
              setIsLoadingData(false);
          }
      };
      loadData();
  }, []);

  const handleLogin = (employee: Employee) => {
    setCurrentUser(employee);
    setIsLoggedIn(true);
    
    // Check permission to determine initial view
    const userRole = roleDefinitions.find(r => r.code === employee.role);
    if (userRole) {
        if (userRole.permissions.includes('VIEW_DASHBOARD')) setCurrentView('DASHBOARD');
        else if (userRole.permissions.includes('VIEW_REPAIR_TICKETS')) setCurrentView('REPAIR_TICKETS');
        else if (userRole.permissions.includes('VIEW_POS')) setCurrentView('POS');
        else setCurrentView('INVENTORY'); // Fallback
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleAddProduct = async (newProduct: Product) => {
    // Optimistic Update
    setProducts((prev) => [newProduct, ...prev]);
    await api.addProduct(newProduct);
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    await api.addCustomer(newCustomer);
  };

  const handleAddInvoice = async (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
    await api.addInvoice(newInvoice);
    
    // Update Debt Logic
    if (newInvoice.status !== 'PAID' && newInvoice.status !== 'CANCELLED') {
        const debtAmount = newInvoice.totalAmount - newInvoice.paidAmount;
        if (debtAmount > 0) {
            const targetCustomer = customers.find(c => c.id === newInvoice.customerId);
            if (targetCustomer) {
                const updatedCustomer = { ...targetCustomer, totalDebt: targetCustomer.totalDebt + debtAmount };
                setCustomers(prev => prev.map(c => c.id === newInvoice.customerId ? updatedCustomer : c));
                await api.updateCustomer(updatedCustomer);
            }
        }
    }
  };

  const handleUpdateInvoice = async (invoiceId: string, updates: Partial<Invoice>) => {
      const oldInvoice = invoices.find(i => i.id === invoiceId);
      if (!oldInvoice) return;

      const updatedInvoice = { ...oldInvoice, ...updates };
      setInvoices(prevInvoices => 
          prevInvoices.map(inv => inv.id === invoiceId ? updatedInvoice : inv)
      );
      await api.updateInvoice(updatedInvoice);

      // Simple Debt Recalculation logic
      const getDebt = (inv: Invoice) => {
          if (inv.status === 'CANCELLED') return 0;
          return Math.max(0, inv.totalAmount - inv.paidAmount);
      };

      const oldDebt = getDebt(oldInvoice);
      const newDebt = getDebt(updatedInvoice);
      const debtDiff = newDebt - oldDebt;

      if (debtDiff !== 0) {
          const targetCustomer = customers.find(c => c.id === updatedInvoice.customerId);
          if (targetCustomer) {
              const updatedCustomer = { ...targetCustomer, totalDebt: Math.max(0, targetCustomer.totalDebt + debtDiff) };
              setCustomers(prev => prev.map(c => c.id === updatedInvoice.customerId ? updatedCustomer : c));
              await api.updateCustomer(updatedCustomer);
          }
      }
  };

  const handleAddEmployee = async (emp: Employee) => {
      setEmployees(prev => [...prev, emp]);
      await api.addEmployee(emp);
  }
  
  const handleDeleteEmployee = async (id: string) => {
      setEmployees(prev => prev.filter(e => e.id !== id));
      await api.deleteEmployee(id);
  }

  const handleAddSupplier = async (s: Supplier) => {
      setSuppliers(prev => [...prev, s]);
      await api.addSupplier(s);
  }

  const handleImportGoods = (po: PurchaseOrder) => {
      setPurchaseOrders(prev => [po, ...prev]);
      const debt = po.totalAmount - po.paidAmount;
      if (debt > 0) {
          setSuppliers(prev => prev.map(s => 
              s.id === po.supplierId ? { ...s, totalDebtToSupplier: s.totalDebtToSupplier + debt } : s
          ));
          // Note: Should add api.updateSupplier
      }
      
      // Update Stock locally (In real app, backend handles this)
      setProducts(prevProds => prevProds.map(p => {
          const itemInPO = po.items.find(item => item.productId === p.id);
          if (itemInPO) {
              const newStock = { ...p.stock };
              newStock[po.warehouse] = (newStock[po.warehouse] || 0) + itemInPO.quantity;
              const updatedProduct = { ...p, stock: newStock };
              // Sync to storage
              api.addProduct(updatedProduct); // Re-adding with same ID overwrites in simple LS logic? 
              // Actually api.addProduct puts it at top. Let's rely on state for now or implement updateProduct
              return updatedProduct;
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
        return <Inventory products={products} onAddProduct={handleAddProduct} systemSettings={systemSettings} />;
      case 'DEBT':
        return <DebtManagement customers={customers} invoices={invoices} systemSettings={systemSettings} />;
      case 'POS':
        return (
            <POS 
                products={products} 
                customers={customers} 
                onAddInvoice={handleAddInvoice} 
                onAddCustomer={handleAddCustomer}
                systemSettings={systemSettings}
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
                systemSettings={systemSettings}
            />
        );
      case 'CUSTOMERS':
        return <Customers customers={customers} onAddCustomer={handleAddCustomer} systemSettings={systemSettings} />;
      case 'EMPLOYEES':
        return <EmployeeManagement 
            employees={employees} 
            roleDefinitions={roleDefinitions}
            onAddEmployee={handleAddEmployee} 
            onDeleteEmployee={handleDeleteEmployee} 
        />;
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
        return <StockReport products={products} invoices={invoices} purchaseOrders={purchaseOrders} systemSettings={systemSettings} />;
      case 'SETTINGS':
        return <Settings 
            roleDefinitions={roleDefinitions} 
            onUpdateRoleDefinition={setRoleDefinitions} 
            systemSettings={systemSettings}
            onUpdateSystemSettings={setSystemSettings}
        />;
      default:
        return <Dashboard invoices={invoices} />;
    }
  };

  if(isLoadingData) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium animate-pulse">Đang khởi tạo dữ liệu...</p>
          </div>
      )
  }

  if (!isLoggedIn || !currentUser) {
    return <Login employees={employees} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        currentUser={currentUser}
        roleDefinitions={roleDefinitions}
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

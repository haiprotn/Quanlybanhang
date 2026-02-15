
import React, { useState, useEffect } from 'react';
import { Customer, Product, ProductType, Warehouse, Invoice, SystemSettings } from '../types';
import { generateReceiptHTML } from '../templates/receiptTemplate';

interface POSProps {
  products: Product[];
  customers: Customer[];
  onAddInvoice: (invoice: Invoice) => void;
  onAddCustomer: (customer: Customer) => void;
  systemSettings: SystemSettings;
}

interface CartItem {
    product: Product;
    quantity: number;
    customPrice: number; 
}

const POS: React.FC<POSProps> = ({ products, customers, onAddInvoice, onAddCustomer, systemSettings }) => {
  // Only Sales Mode now
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse>(Warehouse.TAY_PHAT);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | ProductType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment State
  const [customerPay, setCustomerPay] = useState<number>(0);

  // Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });

  const totalAmount = cart.reduce((sum, item) => sum + (item.customPrice * item.quantity), 0);
  
  // Auto-fill customer pay when total changes (convenience, default to full payment)
  useEffect(() => {
      setCustomerPay(totalAmount);
  }, [totalAmount]);

  // --- LOGIC FOR SALE MODE ---
  const filteredProducts = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'ALL' || p.type === filterType;
      return matchSearch && matchType;
  });

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, customPrice: product.price }];
    });
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
      if (newQty < 1) return;
      setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: newQty } : item));
  };

  const handleUpdatePrice = (productId: string, newPrice: number) => {
      setCart(prev => prev.map(item => item.product.id === productId ? { ...item, customPrice: newPrice } : item));
  };

  const removeFromCart = (productId: string) => {
      setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckoutSale = () => {
      if (cart.length === 0) { alert("Giỏ hàng trống!"); return; }
      
      const paidAmount = Number(customerPay);
      const isPaidFull = paidAmount >= totalAmount;
      
      const customer = customers.find(c => c.id === selectedCustomerId);
      const newInvoice: Invoice = {
        id: `INV-${Math.floor(Math.random() * 100000)}`,
        customerId: selectedCustomerId || 'guest',
        customerName: customer ? customer.name : 'Khách lẻ',
        date: new Date().toISOString().split('T')[0],
        items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.customPrice, 
            type: item.product.type
        })),
        totalAmount: totalAmount,
        paidAmount: Math.min(paidAmount, totalAmount), // Paid amount cannot exceed total in record (change is returned)
        warehouse: selectedWarehouse,
        status: isPaidFull ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'UNPAID'),
        invoiceType: 'SALE'
    };

    onAddInvoice(newInvoice);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(generateReceiptHTML(newInvoice, customer, systemSettings));
        printWindow.document.close();
    }
    setCart([]);
    setCustomerPay(0);
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) { alert("Nhập tên & SĐT"); return; }
    const customer: Customer = {
        id: `c${Date.now()}`,
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
        totalDebt: 0
    };
    onAddCustomer(customer);
    setSelectedCustomerId(customer.id);
    setIsCustomerModalOpen(false);
    setNewCustomer({ name: '', phone: '', address: '' });
  };

  // Calculations for UI
  const changeAmount = Math.max(0, customerPay - totalAmount);
  const debtAmount = Math.max(0, totalAmount - customerPay);

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-4 animate-fade-in">
      {/* Left Column: Product Catalog */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
             {/* Header */}
             <div className="p-4 border-b border-slate-100 space-y-3">
                 <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <span className="material-icons-round text-indigo-600">storefront</span> 
                        Bán Lẻ Hàng Hóa
                    </h2>
                 </div>
                 <div className="flex gap-2">
                     <div className="relative flex-1">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input 
                            type="text" 
                            placeholder="Tìm tên hàng, dịch vụ..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                     </div>
                     <select 
                        className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50 font-medium text-slate-700"
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value as Warehouse)}
                     >
                         <option value={Warehouse.TAY_PHAT}>Kho Tây Phát</option>
                         <option value={Warehouse.TNC}>Kho TNC</option>
                     </select>
                 </div>
                 
                 <div className="flex gap-2">
                    <button onClick={() => setFilterType('ALL')} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${filterType === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600'}`}>Tất cả</button>
                    <button onClick={() => setFilterType(ProductType.GOODS)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${filterType === ProductType.GOODS ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600'}`}>Hàng hóa</button>
                    <button onClick={() => setFilterType(ProductType.SERVICE)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${filterType === ProductType.SERVICE ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600'}`}>Dịch vụ</button>
                 </div>
             </div>
             
             {/* Grid */}
             <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                 <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
                     {filteredProducts.map(product => {
                         const stock = product.stock[selectedWarehouse];
                         const isOutOfStock = product.type === ProductType.GOODS && stock <= 0;
                         return (
                            <button 
                                key={product.id}
                                onClick={() => handleAddToCart(product)}
                                disabled={isOutOfStock}
                                className={`bg-white border rounded-lg p-3 text-left transition-all hover:shadow-md flex flex-col justify-between h-32 relative
                                    ${isOutOfStock ? 'opacity-60 cursor-not-allowed border-slate-100' : 'border-slate-200 hover:border-indigo-300'}
                                `}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${product.type === ProductType.GOODS ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{product.type === ProductType.GOODS ? 'Hàng' : 'Dịch vụ'}</span>
                                    </div>
                                    <h4 className="font-semibold text-slate-800 text-sm line-clamp-2">{product.name}</h4>
                                    <span className="text-xs text-slate-400 font-mono">{product.sku}</span>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="font-bold text-indigo-600">{product.price.toLocaleString()}</span>
                                    {product.type === ProductType.GOODS && <span className={`text-xs ${stock < 5 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>SL: {stock}</span>}
                                </div>
                            </button>
                         )
                     })}
                 </div>
             </div>
        </div>
      </div>

      {/* Right Column: Cart */}
      <div className="w-[450px] flex flex-col gap-4 min-w-0">
          <div className="flex-1 bg-white border border-slate-200 shadow-xl rounded-xl flex flex-col overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 text-center font-bold text-indigo-800 uppercase tracking-wide">
                  Giỏ hàng
              </div>

              {/* Customer Selector */}
              <div className="p-3 border-b border-slate-100 bg-white">
                  <div className="flex gap-2">
                    <select 
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-indigo-500"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                        <option value="">-- Chọn khách hàng --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                    </select>
                    <button 
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 flex items-center justify-center transition-colors shadow-sm"
                    >
                        <span className="material-icons-round">person_add</span>
                    </button>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 bg-slate-50 space-y-2">
                  {cart.length === 0 ? (
                      <div className="text-center text-slate-400 mt-20">
                          <span className="material-icons-round text-5xl opacity-20">shopping_cart_checkout</span>
                          <p className="mt-2 text-sm">Chưa có sản phẩm</p>
                      </div>
                  ) : (
                      cart.map((item, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm group">
                              <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-semibold text-slate-800 line-clamp-1 flex-1">{item.product.name}</span>
                                  <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-500 ml-2"><span className="material-icons-round text-lg">close</span></button>
                              </div>
                              <div className="flex items-center gap-2">
                                  <div className="flex items-center border border-slate-300 rounded bg-slate-50">
                                      <button className="px-2 text-slate-500 hover:text-indigo-600" onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}>-</button>
                                      <input type="number" value={item.quantity} onChange={(e) => handleUpdateQuantity(item.product.id, Number(e.target.value))} className="w-10 text-center bg-transparent outline-none text-sm font-bold" />
                                      <button className="px-2 text-slate-500 hover:text-indigo-600" onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}>+</button>
                                  </div>
                                  <input type="number" value={item.customPrice} onChange={(e) => handleUpdatePrice(item.product.id, Number(e.target.value))} className="flex-1 border border-slate-300 rounded px-2 py-1 text-right text-sm font-medium focus:border-indigo-500 outline-none" />
                                  <span className="font-bold text-indigo-700 text-sm min-w-[70px] text-right">{(item.customPrice * item.quantity).toLocaleString()}</span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
              
              <div className="p-4 bg-white border-t border-slate-200 shadow-up z-10 space-y-3">
                  <div className="flex justify-between items-center text-xl font-bold text-indigo-800">
                      <span>Tổng tiền</span>
                      <span>{totalAmount.toLocaleString()} ₫</span>
                  </div>
                  
                  {/* Payment Input */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Khách đưa</label>
                          <input 
                             type="number" 
                             value={customerPay}
                             onChange={e => setCustomerPay(Number(e.target.value))}
                             className="w-full border border-slate-300 rounded px-2 py-1.5 text-right font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                              {debtAmount > 0 ? <span className="text-red-600">Còn nợ</span> : <span className="text-green-600">Tiền thừa</span>}
                          </label>
                          <div className={`w-full border border-slate-100 bg-slate-50 rounded px-2 py-1.5 text-right font-bold ${debtAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {(debtAmount > 0 ? debtAmount : changeAmount).toLocaleString()} ₫
                          </div>
                      </div>
                  </div>

                  <button onClick={handleCheckoutSale} className="w-full bg-indigo-800 hover:bg-indigo-900 text-white font-bold py-3 rounded-lg shadow flex items-center justify-center gap-2">
                      <span className="material-icons-round">print</span> Thanh Toán & Xuất Hóa Đơn
                  </button>
              </div>
          </div>
      </div>

       {/* Add Customer Modal */}
       {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-800">Khách hàng mới</h3>
              <button onClick={() => setIsCustomerModalOpen(false)}><span className="material-icons-round text-slate-400">close</span></button>
            </div>
            <div className="p-4 space-y-3">
              <input type="text" placeholder="Tên khách hàng" className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
              <input type="text" placeholder="Số điện thoại" className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
              <input type="text" placeholder="Địa chỉ" className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
              <button onClick={handleCreateCustomer} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded mt-2">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;

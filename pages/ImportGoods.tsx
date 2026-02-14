
import React, { useState } from 'react';
import { Product, Supplier, Warehouse, PurchaseOrder, ProductType } from '../types';

interface ImportGoodsProps {
  products: Product[];
  suppliers: Supplier[];
  onImport: (po: PurchaseOrder) => void;
}

const ImportGoods: React.FC<ImportGoodsProps> = ({ products, suppliers, onImport }) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse>(Warehouse.TAY_PHAT);
  const [searchProduct, setSearchProduct] = useState('');
  
  const [cart, setCart] = useState<{product: Product, quantity: number, importPrice: number}[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  const totalAmount = cart.reduce((sum, item) => sum + (item.importPrice * item.quantity), 0);

  // Helper to add item to import list
  const addToCart = (p: Product) => {
      setCart(prev => {
          const exist = prev.find(i => i.product.id === p.id);
          if(exist) return prev; // Already in cart
          return [...prev, { product: p, quantity: 1, importPrice: p.costPrice }];
      });
  };

  const updateCartItem = (id: string, field: 'quantity' | 'importPrice', value: number) => {
      setCart(prev => prev.map(item => item.product.id === id ? { ...item, [field]: value } : item));
  };

  const removeCartItem = (id: string) => {
      setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const handleConfirmImport = () => {
      if(!selectedSupplier) { alert("Chưa chọn nhà cung cấp"); return; }
      if(cart.length === 0) { alert("Chưa có sản phẩm nào"); return; }

      const supplier = suppliers.find(s => s.id === selectedSupplier);
      
      const po: PurchaseOrder = {
          id: `PO-${Date.now()}`,
          supplierId: selectedSupplier,
          supplierName: supplier?.name || 'NCC Lẻ',
          date: new Date().toISOString(),
          warehouse: selectedWarehouse,
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          status: 'COMPLETED',
          items: cart.map(i => ({
              productId: i.product.id,
              productName: i.product.name,
              quantity: i.quantity,
              importPrice: i.importPrice
          }))
      };

      onImport(po);
      alert("Đã nhập kho thành công!");
      setCart([]);
      setPaidAmount(0);
      setSelectedSupplier('');
  };

  const filteredProducts = products.filter(p => 
      p.type === ProductType.GOODS && 
      (p.name.toLowerCase().includes(searchProduct.toLowerCase()) || p.sku.toLowerCase().includes(searchProduct.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6 animate-fade-in">
        {/* Left: Product Selection */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-lg text-slate-800 mb-2">Chọn sản phẩm nhập</h2>
                <input 
                    className="w-full border p-2 rounded" 
                    placeholder="Tìm sản phẩm..."
                    value={searchProduct}
                    onChange={e => setSearchProduct(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
                {filteredProducts.map(p => (
                    <button 
                        key={p.id} 
                        onClick={() => addToCart(p)}
                        className="text-left border p-3 rounded hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                    >
                        <p className="font-bold text-sm text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.sku}</p>
                        <p className="text-xs font-semibold text-indigo-600 mt-1">Giá vốn cũ: {p.costPrice.toLocaleString()}</p>
                    </button>
                ))}
            </div>
        </div>

        {/* Right: Import Form */}
        <div className="w-[500px] flex flex-col bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <span className="material-icons-round">archive</span> Tạo Phiếu Nhập
                </h2>
            </div>
            
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <div className="flex gap-2">
                    <select className="flex-1 border p-2 rounded" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}>
                        <option value="">-- Chọn Nhà Cung Cấp --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="flex gap-2 items-center">
                    <label className="text-sm font-bold text-slate-600 whitespace-nowrap">Nhập vào kho:</label>
                    <select className="flex-1 border p-2 rounded" value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value as Warehouse)}>
                        <option value={Warehouse.TAY_PHAT}>Kho Tây Phát</option>
                        <option value={Warehouse.TNC}>Kho TNC</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cart.map((item, idx) => (
                    <div key={idx} className="bg-white border p-3 rounded shadow-sm relative group">
                        <button onClick={() => removeCartItem(item.product.id)} className="absolute top-1 right-1 text-slate-300 hover:text-red-500"><span className="material-icons-round text-sm">close</span></button>
                        <p className="font-bold text-sm pr-4 mb-2">{item.product.name}</p>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Số lượng</label>
                                <input type="number" className="w-full border rounded p-1 text-sm font-bold" value={item.quantity} onChange={e => updateCartItem(item.product.id, 'quantity', Number(e.target.value))} />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Giá nhập</label>
                                <input type="number" className="w-full border rounded p-1 text-sm text-right" value={item.importPrice} onChange={e => updateCartItem(item.product.id, 'importPrice', Number(e.target.value))} />
                            </div>
                            <div className="flex-1 text-right">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Thành tiền</label>
                                <p className="font-bold text-indigo-700 mt-1">{(item.quantity * item.importPrice).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {cart.length === 0 && <p className="text-center text-slate-400 mt-10 text-sm">Chưa chọn sản phẩm</p>}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 shadow-up z-10 space-y-3">
                <div className="flex justify-between text-lg font-bold">
                    <span>Tổng tiền hàng:</span>
                    <span className="text-indigo-700">{totalAmount.toLocaleString()} ₫</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-600">Thanh toán NCC:</span>
                    <input 
                        type="number" 
                        className="border border-slate-300 rounded px-2 py-1 text-right font-bold w-40"
                        value={paidAmount}
                        onChange={e => setPaidAmount(Number(e.target.value))}
                    />
                </div>
                <button 
                    onClick={handleConfirmImport}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg"
                >
                    Hoàn Tất Nhập Kho
                </button>
            </div>
        </div>
    </div>
  );
};

export default ImportGoods;

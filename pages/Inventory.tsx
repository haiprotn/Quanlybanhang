import React, { useState } from 'react';
import { Product, ProductType, Warehouse } from '../types';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct }) => {
  const [filterType, setFilterType] = useState<'ALL' | ProductType>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<'ALL' | Warehouse>('ALL');
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product> & { stockTayPhat: number; stockTNC: number }>({
    type: ProductType.GOODS,
    stockTayPhat: 0,
    stockTNC: 0,
    price: 0,
    costPrice: 0,
    unit: 'Cái',
    name: '',
    sku: ''
  });

  // Calculate Stats based on selected warehouse
  const totalItems = products.length;
  
  const lowStockItems = products.filter(p => {
      if (p.type !== ProductType.GOODS) return false;
      if (selectedWarehouse === 'ALL') {
          return p.stock[Warehouse.TAY_PHAT] < 5 || p.stock[Warehouse.TNC] < 5;
      }
      return p.stock[selectedWarehouse] < 5;
  }).length;

  const totalValue = products.reduce((sum, p) => {
      if (p.type !== ProductType.GOODS) return sum;
      let stock = 0;
      if (selectedWarehouse === 'ALL') {
          stock = p.stock[Warehouse.TAY_PHAT] + p.stock[Warehouse.TNC];
      } else {
          stock = p.stock[selectedWarehouse];
      }
      return sum + (stock * p.costPrice);
  }, 0);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleSaveProduct = () => {
    if (!newProduct.name || !newProduct.sku) {
        alert("Vui lòng nhập Tên sản phẩm và Mã SKU");
        return;
    }

    const product: Product = {
        id: `p-${Date.now()}`,
        name: newProduct.name,
        sku: newProduct.sku,
        type: newProduct.type || ProductType.GOODS,
        price: Number(newProduct.price),
        costPrice: Number(newProduct.costPrice),
        unit: newProduct.unit || 'Cái',
        stock: {
            [Warehouse.TAY_PHAT]: Number(newProduct.stockTayPhat),
            [Warehouse.TNC]: Number(newProduct.stockTNC),
        }
    };

    onAddProduct(product);
    setIsModalOpen(false);
    setNewProduct({
        type: ProductType.GOODS,
        stockTayPhat: 0,
        stockTNC: 0,
        price: 0,
        costPrice: 0,
        unit: 'Cái',
        name: '',
        sku: ''
    });
  };

  const calculateMargin = (price: number, cost: number) => {
      if (price === 0) return 0;
      return ((price - cost) / price * 100).toFixed(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & KPIs */}
      <div className="flex justify-between items-end mb-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Kho hàng & Dịch vụ</h1>
            <p className="text-slate-500 text-sm">Quản lý danh mục sản phẩm, giá vốn và tồn kho đa điểm</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
                <span className="material-icons-round text-lg">add</span>
                Thêm mới
            </button>
            <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                <span className="material-icons-round text-lg">file_download</span>
                Xuất Excel
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tổng giá trị tồn kho</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">{totalValue.toLocaleString()} ₫</p>
                  <p className="text-xs text-slate-400 mt-1">
                      {selectedWarehouse === 'ALL' ? 'Tất cả kho' : selectedWarehouse}
                  </p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <span className="material-icons-round">account_balance_wallet</span>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Cảnh báo nhập hàng</p>
                  <p className="text-xl font-bold text-red-600 mt-1">{lowStockItems} <span className="text-sm font-normal text-slate-500">sản phẩm</span></p>
                  <p className="text-xs text-slate-400 mt-1">
                      {selectedWarehouse === 'ALL' ? 'Trên toàn hệ thống' : `Tại ${selectedWarehouse}`}
                  </p>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                  <span className="material-icons-round">production_quantity_limits</span>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tổng danh mục</p>
                  <p className="text-xl font-bold text-indigo-600 mt-1">{totalItems}</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <span className="material-icons-round">category</span>
              </div>
          </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm, mã SKU..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
             <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Lọc:</span>
             
             <select
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[150px]"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value as 'ALL' | Warehouse)}
            >
                <option value="ALL">Tất cả kho</option>
                <option value={Warehouse.TAY_PHAT}>Kho Tây Phát</option>
                <option value={Warehouse.TNC}>Kho TNC</option>
            </select>

             <select
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'ALL' | ProductType)}
            >
                <option value="ALL">Tất cả loại</option>
                <option value={ProductType.GOODS}>Hàng hóa</option>
                <option value={ProductType.SERVICE}>Dịch vụ</option>
            </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Phân loại</th>
                <th className="px-6 py-4 text-right">Giá vốn</th>
                <th className="px-6 py-4 text-right">Giá bán</th>
                <th className="px-6 py-4 text-center">Lợi nhuận</th>
                {(selectedWarehouse === 'ALL' || selectedWarehouse === Warehouse.TAY_PHAT) && (
                    <th className="px-6 py-4 text-center bg-indigo-50/50 border-l border-indigo-100">Kho Tây Phát</th>
                )}
                {(selectedWarehouse === 'ALL' || selectedWarehouse === Warehouse.TNC) && (
                    <th className="px-6 py-4 text-center bg-orange-50/50 border-l border-orange-100">Kho TNC</th>
                )}
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                      <div>
                          <p className="font-semibold text-slate-800">{product.name}</p>
                          <p className="font-mono text-xs text-slate-400 mt-0.5">{product.sku}</p>
                      </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                        ${product.type === ProductType.GOODS ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                    `}>
                        {product.type === ProductType.GOODS ? 'Hàng hóa' : 'Dịch vụ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500">
                    {product.costPrice > 0 ? product.costPrice.toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900">
                    {product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                          {calculateMargin(product.price, product.costPrice)}%
                      </span>
                  </td>
                  {(selectedWarehouse === 'ALL' || selectedWarehouse === Warehouse.TAY_PHAT) && (
                    <td className="px-6 py-4 text-center bg-indigo-50/20 border-l border-indigo-50">
                        {product.type === ProductType.SERVICE ? (
                            <span className="text-slate-300 text-xs">--</span>
                        ) : (
                            <span className={`font-bold px-2 py-1 rounded ${product.stock[Warehouse.TAY_PHAT] < 5 ? 'bg-red-100 text-red-600' : 'text-slate-700'}`}>
                                {product.stock[Warehouse.TAY_PHAT]}
                            </span>
                        )}
                    </td>
                  )}
                  {(selectedWarehouse === 'ALL' || selectedWarehouse === Warehouse.TNC) && (
                    <td className="px-6 py-4 text-center bg-orange-50/20 border-l border-orange-50">
                        {product.type === ProductType.SERVICE ? (
                            <span className="text-slate-300 text-xs">--</span>
                        ) : (
                            <span className={`font-bold px-2 py-1 rounded ${product.stock[Warehouse.TNC] < 5 ? 'bg-red-100 text-red-600' : 'text-slate-700'}`}>
                                {product.stock[Warehouse.TNC]}
                            </span>
                        )}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-end gap-2">
                        <button className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors" title="Chỉnh sửa">
                            <span className="material-icons-round text-lg">edit</span>
                        </button>
                        <button className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors" title="Xóa">
                            <span className="material-icons-round text-lg">delete</span>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <span className="material-icons-round text-4xl text-slate-300 mb-2">inventory_2</span>
                <p>Không tìm thấy sản phẩm nào phù hợp.</p>
            </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Thêm sản phẩm mới</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Tên sản phẩm / Dịch vụ <span className="text-red-500">*</span></label>
                             <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newProduct.name}
                                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                placeholder="Nhập tên sản phẩm..."
                             />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Mã SKU <span className="text-red-500">*</span></label>
                             <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase"
                                value={newProduct.sku}
                                onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                                placeholder="SP001"
                             />
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Loại</label>
                             <select 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                value={newProduct.type}
                                onChange={e => setNewProduct({...newProduct, type: e.target.value as ProductType})}
                             >
                                 <option value={ProductType.GOODS}>Hàng hóa</option>
                                 <option value={ProductType.SERVICE}>Dịch vụ</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán (VNĐ)</label>
                             <input 
                                type="number" 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newProduct.price}
                                onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                             />
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Giá vốn (VNĐ)</label>
                             <input 
                                type="number" 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newProduct.costPrice}
                                onChange={e => setNewProduct({...newProduct, costPrice: Number(e.target.value)})}
                             />
                        </div>
                        <div className="col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị tính</label>
                             <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Cái, Chiếc, Bộ, Lần..."
                                value={newProduct.unit}
                                onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                             />
                        </div>
                        
                        {newProduct.type === ProductType.GOODS && (
                            <>
                                <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                                    <h4 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                                        <span className="material-icons-round text-base text-slate-400">warehouse</span>
                                        Số lượng tồn kho ban đầu
                                    </h4>
                                </div>
                                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                     <label className="block text-xs font-bold text-indigo-700 mb-1">Kho Tây Phát</label>
                                     <input 
                                        type="number" 
                                        className="w-full border border-indigo-200 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={newProduct.stockTayPhat}
                                        onChange={e => setNewProduct({...newProduct, stockTayPhat: Number(e.target.value)})}
                                     />
                                </div>
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                     <label className="block text-xs font-bold text-orange-700 mb-1">Kho TNC</label>
                                     <input 
                                        type="number" 
                                        className="w-full border border-orange-200 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-orange-500"
                                        value={newProduct.stockTNC}
                                        onChange={e => setNewProduct({...newProduct, stockTNC: Number(e.target.value)})}
                                     />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-800 rounded-lg transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleSaveProduct}
                        className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all active:scale-95"
                    >
                        Lưu sản phẩm
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
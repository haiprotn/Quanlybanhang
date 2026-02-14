
import React, { useState } from 'react';
import { Supplier } from '../types';

interface SuppliersProps {
  suppliers: Supplier[];
  onAddSupplier: (s: Supplier) => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, onAddSupplier }) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', address: '', contactPerson: '' });

  const filteredSuppliers = suppliers.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.phone.includes(search)
  );

  const handleSave = () => {
      if(!newSupplier.name) return;
      onAddSupplier({
          id: `sup-${Date.now()}`,
          ...newSupplier,
          totalDebtToSupplier: 0
      });
      setIsModalOpen(false);
      setNewSupplier({ name: '', phone: '', address: '', contactPerson: '' });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nhà Cung Cấp</h1>
          <p className="text-slate-500 text-sm">Quản lý đối tác và công nợ phải trả</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
        >
          <span className="material-icons-round">add</span> Thêm NCC
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative">
              <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm nhà cung cấp..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
          </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(s => (
              <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full group hover:border-indigo-300 transition-colors">
                  <div>
                      <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-slate-800">{s.name}</h3>
                          <div className="p-2 bg-slate-50 rounded-full text-slate-400 group-hover:text-indigo-600 transition-colors">
                              <span className="material-icons-round">store</span>
                          </div>
                      </div>
                      <div className="space-y-1 text-sm text-slate-500 mb-4">
                          <p className="flex items-center gap-2"><span className="material-icons-round text-xs">person</span> {s.contactPerson || '---'}</p>
                          <p className="flex items-center gap-2"><span className="material-icons-round text-xs">phone</span> {s.phone}</p>
                          <p className="flex items-center gap-2"><span className="material-icons-round text-xs">place</span> {s.address || '---'}</p>
                      </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Nợ phải trả</span>
                      <span className={`font-bold text-lg ${s.totalDebtToSupplier > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {s.totalDebtToSupplier.toLocaleString()} ₫
                      </span>
                  </div>
              </div>
          ))}
      </div>
      
      {filteredSuppliers.length === 0 && <p className="text-center text-slate-400 mt-10">Chưa có nhà cung cấp nào.</p>}

      {/* Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                  <h3 className="font-bold text-lg text-slate-800">Thêm Nhà Cung Cấp</h3>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên NCC <span className="text-red-500">*</span></label>
                      <input className="w-full border p-2 rounded" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Người liên hệ</label>
                      <input className="w-full border p-2 rounded" value={newSupplier.contactPerson} onChange={e => setNewSupplier({...newSupplier, contactPerson: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Điện thoại</label>
                      <input className="w-full border p-2 rounded" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Địa chỉ</label>
                      <input className="w-full border p-2 rounded" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} />
                  </div>
                  <div className="flex gap-2 pt-2">
                      <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 py-2 rounded text-slate-700 font-bold">Hủy</button>
                      <button onClick={handleSave} className="flex-1 bg-indigo-600 py-2 rounded text-white font-bold">Lưu</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Suppliers;

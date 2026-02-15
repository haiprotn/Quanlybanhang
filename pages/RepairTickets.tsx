
import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, Customer, Product, InvoiceItem, Employee, DeviceInfo, Warehouse, SystemSettings } from '../types';
import { generateRepairTicketHTML } from '../templates/repairTicketTemplate';
import { generateReceiptHTML } from '../templates/receiptTemplate';
import { suggestRepairNote } from '../services/geminiService';

interface RepairTicketsProps {
  invoices: Invoice[];
  customers: Customer[];
  products: Product[];
  currentUser: Employee;
  onUpdateInvoice: (invoiceId: string, updates: Partial<Invoice>) => void;
  onAddInvoice: (invoice: Invoice) => void;
  onAddCustomer: (customer: Customer) => void;
  systemSettings: SystemSettings;
}

const STATUS_CONFIG = {
  RECEIVED: { label: 'Mới tiếp nhận', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: 'inventory' },
  CHECKING: { label: 'Đang kiểm tra', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: 'search' },
  QUOTING: { label: 'Chờ khách duyệt', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: 'request_quote' },
  WAITING_PARTS: { label: 'Chờ linh kiện', color: 'bg-pink-100 text-pink-800 border-pink-300', icon: 'pending' },
  IN_PROGRESS: { label: 'Đang sửa chữa', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: 'build' },
  COMPLETED: { label: 'Đã xong - Chờ giao', color: 'bg-green-100 text-green-800 border-green-300', icon: 'check_circle' },
  DELIVERED: { label: 'Đã trả máy', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: 'done_all' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-gray-200 text-gray-500 border-gray-300', icon: 'cancel' },
};

const RepairTickets: React.FC<RepairTicketsProps> = ({ invoices, customers, products, currentUser, onUpdateInvoice, onAddInvoice, onAddCustomer, systemSettings }) => {
  const [activeTab, setActiveTab] = useState<string>('ACTIVE'); 
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // -- Modals --
  const [selectedTicket, setSelectedTicket] = useState<Invoice | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  
  // Reception Modal State
  const [isReceptionModalOpen, setIsReceptionModalOpen] = useState(false);
  const [receptionData, setReceptionData] = useState<DeviceInfo>({ deviceName: '', symptoms: '', password: '', accessories: '' });
  const [receptionCustomer, setReceptionCustomer] = useState('');
  const [receptionNote, setReceptionNote] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  // New Customer Modal inside Reception
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [newCustData, setNewCustData] = useState({ name: '', phone: '', address: '' });

  // Process Modal State
  const [tempItems, setTempItems] = useState<InvoiceItem[]>([]);
  const [tempDiagnosis, setTempDiagnosis] = useState('');
  const [tempNote, setTempNote] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Payment Confirmation Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Permissions
  const isTech = currentUser.role === 'TECHNICIAN' || currentUser.role === 'ADMIN';
  const isSales = currentUser.role === 'SALES' || currentUser.role === 'ADMIN';

  // Logic to filter tickets
  const repairTickets = useMemo(() => {
    return invoices
      .filter(inv => inv.invoiceType === 'REPAIR')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices]);

  const filteredTickets = useMemo(() => {
    // If specific status filter is active, override the tab logic
    if (statusFilter !== 'ALL') {
        return repairTickets.filter(t => t.repairStatus === statusFilter);
    }

    // Default Tab Logic
    if (activeTab === 'COMPLETED') return repairTickets.filter(t => t.repairStatus === 'DELIVERED');
    if (activeTab === 'CANCELLED') return repairTickets.filter(t => t.repairStatus === 'CANCELLED');
    // ACTIVE: Everything not DELIVERED and not CANCELLED
    return repairTickets.filter(t => t.repairStatus !== 'DELIVERED' && t.repairStatus !== 'CANCELLED');
  }, [repairTickets, activeTab, statusFilter]);

  // Sync state if invoice updates from outside (though we usually close modal on update)
  useEffect(() => {
      if (selectedTicket) {
          const fresh = invoices.find(i => i.id === selectedTicket.id);
          if(fresh && fresh.repairStatus !== selectedTicket.repairStatus) {
              setSelectedTicket(fresh);
          }
      }
  }, [invoices, selectedTicket]);

  // --- RECEPTION LOGIC ---
  const handleSuggestNote = async () => {
    if(!receptionData.symptoms) return;
    setSuggesting(true);
    const note = await suggestRepairNote(receptionData.symptoms);
    setReceptionNote(note);
    setSuggesting(false);
  }

  const handleCreateReception = (print: boolean) => {
    if(!receptionCustomer || !receptionData.deviceName) { alert("Thiếu thông tin khách hoặc máy!"); return; }
    
    const cust = customers.find(c => c.id === receptionCustomer);
    const newTicket: Invoice = {
        id: `REP-${Math.floor(Math.random() * 100000)}`,
        customerId: receptionCustomer,
        customerName: cust?.name || 'Khách',
        date: new Date().toISOString(),
        items: [],
        totalAmount: 0,
        paidAmount: 0,
        warehouse: Warehouse.TAY_PHAT, // Default
        status: 'UNPAID',
        invoiceType: 'REPAIR',
        repairStatus: 'RECEIVED',
        deviceInfo: receptionData,
        note: receptionNote,
    };
    onAddInvoice(newTicket);
    setIsReceptionModalOpen(false);
    
    // Reset form
    setReceptionData({ deviceName: '', symptoms: '', password: '', accessories: '' });
    setReceptionNote('');
    setReceptionCustomer('');

    if(print) {
        const w = window.open('', '_blank');
        w?.document.write(generateRepairTicketHTML(newTicket, cust, newTicket.deviceInfo!.symptoms, newTicket.note || '', systemSettings));
        w?.document.close();
    }
  };

  const handleSaveNewCustomer = () => {
      if(!newCustData.name || !newCustData.phone) return;
      const c: Customer = {
          id: `c-${Date.now()}`,
          name: newCustData.name,
          phone: newCustData.phone,
          address: newCustData.address,
          totalDebt: 0
      };
      onAddCustomer(c);
      setReceptionCustomer(c.id);
      setIsAddCustModalOpen(false);
      setNewCustData({ name: '', phone: '', address: '' });
  };

  // --- PROCESS TICKET LOGIC ---

  const openProcessModal = (e: React.MouseEvent, ticket: Invoice) => {
    e.stopPropagation();
    setSelectedTicket(ticket);
    setTempItems([...ticket.items]);
    setTempDiagnosis(ticket.deviceInfo?.diagnosis || '');
    setTempNote(ticket.note || '');
    setIsProcessModalOpen(true);
  };

  const handleUpdateTicket = (newStatus: string | null = null) => {
    if (!selectedTicket) return;

    const totalAmount = tempItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    let statusToUpdate = newStatus;
    if (!statusToUpdate) {
        statusToUpdate = selectedTicket.repairStatus || 'RECEIVED';
        if (statusToUpdate === 'RECEIVED' && tempDiagnosis) statusToUpdate = 'CHECKING';
        if (statusToUpdate === 'CHECKING' && tempItems.length > 0) statusToUpdate = 'QUOTING';
    }

    // Ensure deviceInfo exists
    const safeDeviceInfo = selectedTicket.deviceInfo || { deviceName: 'Unknown', symptoms: '' };

    onUpdateInvoice(selectedTicket.id, {
      items: tempItems,
      totalAmount,
      note: tempNote,
      repairStatus: statusToUpdate as any,
      deviceInfo: {
        ...safeDeviceInfo,
        diagnosis: tempDiagnosis
      }
    });
    
    // Close modal to refresh data view
    setIsProcessModalOpen(false);
  };

  const handleInitiatePayment = (e?: React.MouseEvent) => {
      if(e) { e.preventDefault(); e.stopPropagation(); }
      if(!selectedTicket) return;
      
      const currentTotal = tempItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      setPaymentAmount(currentTotal); // Default to full amount
      setIsPaymentModalOpen(true);
  }

  const handleConfirmPaymentAndPrint = () => {
      if(!selectedTicket) return;

      const totalAmount = tempItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      const isPaidFull = paymentAmount >= totalAmount;

      // Prepare invoice for printing
      const cust = customers.find(c => c.id === selectedTicket.customerId);
      const invoiceForPrint: Invoice = {
          ...selectedTicket,
          items: tempItems,
          totalAmount: totalAmount,
          status: isPaidFull ? 'PAID' : 'PARTIAL',
          paidAmount: paymentAmount,
          repairStatus: 'DELIVERED',
          salesId: currentUser.id
      };

      // Open print window immediately
      const w = window.open('', '_blank');
      if (w) {
          w.document.write(generateReceiptHTML(invoiceForPrint, cust, systemSettings));
          w.document.close();
      } else {
          alert("Vui lòng cho phép mở Popup để in hóa đơn");
      }

      // Update App State
      onUpdateInvoice(selectedTicket.id, {
          items: tempItems,
          totalAmount,
          paidAmount: Math.min(paymentAmount, totalAmount),
          status: isPaidFull ? 'PAID' : (paymentAmount > 0 ? 'PARTIAL' : 'UNPAID'),
          repairStatus: 'DELIVERED',
          salesId: currentUser.id,
          note: tempNote,
          deviceInfo: {
              ...(selectedTicket.deviceInfo || { deviceName: '', symptoms: '' }),
              diagnosis: tempDiagnosis
          }
      });

      setIsPaymentModalOpen(false);
      setIsProcessModalOpen(false);
  }

  // --- UI HELPERS ---
  const StatusBadge = ({ status }: { status: string }) => {
    const conf = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.RECEIVED;
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${conf.color}`}>
        <span className="material-icons-round text-[14px]">{conf.icon}</span>
        {conf.label}
      </span>
    );
  };

  const addItem = (p: Product) => {
      setTempItems(prev => {
          const exist = prev.find(i => i.productId === p.id);
          if(exist) return prev.map(i => i.productId === p.id ? {...i, quantity: i.quantity+1} : i);
          return [...prev, { productId: p.id, productName: p.name, quantity: 1, price: p.price, type: p.type }];
      });
  }

  const currentTotal = tempItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Sửa chữa</h1>
          <p className="text-slate-500 text-sm">
             Xin chào <span className="font-bold text-indigo-600">{currentUser.name}</span> ({currentUser.role})
          </p>
        </div>
        
        <div className="flex gap-2">
            <button 
                type="button"
                onClick={() => setIsReceptionModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md"
            >
                <span className="material-icons-round">add_circle</span> Tiếp nhận máy
            </button>
        </div>
      </div>
      
      {/* Tab Filter & Status Filter */}
      <div className="flex justify-between items-center">
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
            {[{id:'ACTIVE', label:'Đang xử lý'}, {id:'COMPLETED', label:'Đã trả máy'}, {id:'CANCELLED', label:'Đã hủy'}].map(tab => (
              <button
                  type="button"
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setStatusFilter('ALL'); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id && statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {tab.label}
              </button>
            ))}
        </div>

        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">Lọc trạng thái:</span>
            <select
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="ALL">Tất cả (Theo Tab)</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                ))}
            </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-2">
         {filteredTickets.map(ticket => (
             <div key={ticket.id} onClick={(e) => openProcessModal(e, ticket)} className="bg-white border border-slate-200 rounded-xl p-4 mb-3 hover:shadow-md cursor-pointer flex justify-between items-center group">
                 <div className="flex gap-4 items-center">
                     <div className={`w-1.5 h-12 rounded-full ${STATUS_CONFIG[ticket.repairStatus as keyof typeof STATUS_CONFIG]?.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                     <div>
                         <div className="flex items-center gap-2 mb-1">
                             <span className="font-mono font-bold text-indigo-700">{ticket.id}</span>
                             <StatusBadge status={ticket.repairStatus || 'RECEIVED'} />
                         </div>
                         <h3 className="font-bold text-slate-800">{ticket.customerName} - {ticket.deviceInfo?.deviceName}</h3>
                         <p className="text-sm text-slate-500 truncate max-w-md">{ticket.deviceInfo?.symptoms}</p>
                     </div>
                 </div>
                 <div className="text-right">
                     <p className="font-bold text-lg text-indigo-700">{ticket.totalAmount.toLocaleString()} ₫</p>
                     <p className="text-xs text-slate-400">{new Date(ticket.date).toLocaleDateString('vi-VN')}</p>
                 </div>
             </div>
         ))}
         {filteredTickets.length === 0 && <p className="text-center text-slate-400 mt-10">Không có phiếu nào.</p>}
      </div>

      {/* --- MODAL: TIẾP NHẬN MÁY --- */}
      {isReceptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-indigo-600 text-white p-4 font-bold text-lg flex justify-between">
                    <span>Tiếp nhận máy sửa chữa</span>
                    <button type="button" onClick={() => setIsReceptionModalOpen(false)}><span className="material-icons-round">close</span></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Customer Select */}
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Khách hàng</label>
                            <select className="w-full border p-2 rounded" value={receptionCustomer} onChange={e => setReceptionCustomer(e.target.value)}>
                                <option value="">-- Chọn khách --</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                            </select>
                        </div>
                        <button type="button" onClick={() => setIsAddCustModalOpen(true)} className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded font-bold hover:bg-indigo-100"><span className="material-icons-round">person_add</span></button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Tên thiết bị / Model</label>
                            <input className="w-full border p-2 rounded font-bold" value={receptionData.deviceName} onChange={e => setReceptionData({...receptionData, deviceName: e.target.value})} placeholder="VD: Laptop Dell XPS 13" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu máy (Nếu có)</label>
                            <input className="w-full border p-2 rounded" value={receptionData.password} onChange={e => setReceptionData({...receptionData, password: e.target.value})} placeholder="VD: 1234" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Tình trạng / Mô tả lỗi (Khách báo)</label>
                        <textarea className="w-full border p-2 rounded h-20 resize-none" value={receptionData.symptoms} onChange={e => setReceptionData({...receptionData, symptoms: e.target.value})} placeholder="VD: Máy không lên nguồn, đèn báo nhấp nháy..." />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Phụ kiện kèm theo</label>
                        <input className="w-full border p-2 rounded" value={receptionData.accessories} onChange={e => setReceptionData({...receptionData, accessories: e.target.value})} placeholder="VD: Sạc, Chuột, Túi..." />
                    </div>

                    <div className="border-t pt-4">
                         <div className="flex justify-between items-center mb-2">
                             <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><span className="material-icons-round text-sm">sticky_note_2</span> Ghi chú nhận máy (In phiếu)</label>
                             <button type="button" onClick={handleSuggestNote} disabled={suggesting || !receptionData.symptoms} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 font-bold flex items-center gap-1">
                                 {suggesting ? 'Đang viết...' : <><span className="material-icons-round text-sm">auto_awesome</span> Gợi ý AI</>}
                             </button>
                         </div>
                         <textarea className="w-full border p-2 rounded h-16 resize-none text-sm bg-slate-50" value={receptionNote} onChange={e => setReceptionNote(e.target.value)} placeholder="Ghi chú thêm..." />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex gap-2 justify-end">
                    <button type="button" onClick={() => setIsReceptionModalOpen(false)} className="px-4 py-2 bg-white border rounded text-slate-600 font-bold hover:bg-slate-100">Hủy</button>
                    <button type="button" onClick={() => handleCreateReception(true)} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 shadow flex items-center gap-2">
                        <span className="material-icons-round">print</span> Lưu & In Phiếu
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL: THÊM KHÁCH HÀNG (LỒNG TRONG TIẾP NHẬN) --- */}
      {isAddCustModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
                  <h3 className="font-bold text-lg">Thêm khách hàng nhanh</h3>
                  <input className="w-full border p-2 rounded" placeholder="Tên khách hàng" value={newCustData.name} onChange={e => setNewCustData({...newCustData, name: e.target.value})} />
                  <input className="w-full border p-2 rounded" placeholder="Số điện thoại" value={newCustData.phone} onChange={e => setNewCustData({...newCustData, phone: e.target.value})} />
                  <input className="w-full border p-2 rounded" placeholder="Địa chỉ" value={newCustData.address} onChange={e => setNewCustData({...newCustData, address: e.target.value})} />
                  <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setIsAddCustModalOpen(false)} className="flex-1 bg-slate-100 py-2 rounded font-bold">Hủy</button>
                      <button type="button" onClick={handleSaveNewCustomer} className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold">Lưu</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL: XỬ LÝ KỸ THUẬT / BÁO GIÁ --- */}
      {isProcessModalOpen && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
                 <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                     <div>
                         <h2 className="font-bold text-lg flex items-center gap-2">
                            Phiếu: {selectedTicket.id} 
                            <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-normal">{selectedTicket.customerName}</span>
                         </h2>
                     </div>
                     <button type="button" onClick={() => setIsProcessModalOpen(false)}><span className="material-icons-round">close</span></button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                     {/* Left: Info & Diagnosis */}
                     <div className="md:col-span-1 space-y-4 border-r pr-6">
                         <div className="bg-slate-50 p-3 rounded-lg border">
                             <h4 className="font-bold text-slate-700 text-sm mb-2 uppercase">Thông tin thiết bị</h4>
                             <p className="text-sm"><strong>Máy:</strong> {selectedTicket.deviceInfo?.deviceName}</p>
                             <p className="text-sm"><strong>Lỗi:</strong> {selectedTicket.deviceInfo?.symptoms}</p>
                             <p className="text-sm"><strong>Pass:</strong> {selectedTicket.deviceInfo?.password || '---'}</p>
                             <p className="text-sm"><strong>PK:</strong> {selectedTicket.deviceInfo?.accessories || '---'}</p>
                         </div>

                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Chẩn đoán kỹ thuật / Kết quả kiểm tra</label>
                             <textarea 
                                className="w-full border p-2 rounded h-32 resize-none text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-yellow-50" 
                                placeholder="Nhập kết quả kiểm tra..."
                                value={tempDiagnosis}
                                onChange={e => setTempDiagnosis(e.target.value)}
                                disabled={!isTech}
                             />
                         </div>
                         
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ghi chú nội bộ</label>
                             <textarea 
                                className="w-full border p-2 rounded h-20 resize-none text-sm" 
                                value={tempNote}
                                onChange={e => setTempNote(e.target.value)}
                             />
                         </div>
                     </div>

                     {/* Right: Items & Actions */}
                     <div className="md:col-span-2 flex flex-col h-full">
                         <div className="flex-1 flex flex-col">
                             <div className="flex justify-between items-center mb-2">
                                 <h4 className="font-bold text-slate-700 uppercase text-sm">Linh kiện & Dịch vụ sử dụng</h4>
                                 <div className="relative">
                                     <input 
                                        className="border rounded-full pl-8 pr-3 py-1 text-sm w-48 focus:w-64 transition-all outline-none" 
                                        placeholder="Tìm linh kiện..."
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                     />
                                     <span className="material-icons-round absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                     {productSearch && (
                                         <div className="absolute top-full right-0 mt-1 w-64 bg-white shadow-xl border rounded-lg max-h-48 overflow-y-auto z-10">
                                             {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                                 <button 
                                                    key={p.id} 
                                                    type="button"
                                                    onClick={() => { addItem(p); setProductSearch(''); }}
                                                    className="w-full text-left p-2 hover:bg-indigo-50 text-sm border-b truncate"
                                                 >
                                                     {p.name} - <span className="font-bold">{p.price.toLocaleString()}</span>
                                                 </button>
                                             ))}
                                         </div>
                                     )}
                                 </div>
                             </div>

                             <div className="border rounded-lg flex-1 overflow-y-auto bg-slate-50 mb-4 p-2">
                                 {tempItems.length === 0 ? (
                                     <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Chưa có linh kiện/dịch vụ nào</div>
                                 ) : (
                                     <table className="w-full text-sm text-left">
                                         <thead>
                                             <tr className="text-slate-500 border-b">
                                                 <th className="pb-2">Tên</th>
                                                 <th className="pb-2 w-16 text-center">SL</th>
                                                 <th className="pb-2 w-24 text-right">Giá</th>
                                                 <th className="pb-2 w-10"></th>
                                             </tr>
                                         </thead>
                                         <tbody>
                                             {tempItems.map((item, idx) => (
                                                 <tr key={idx} className="border-b border-slate-200 last:border-0">
                                                     <td className="py-2">{item.productName}</td>
                                                     <td className="py-2 text-center font-bold">
                                                         <input 
                                                            type="number" 
                                                            className="w-10 text-center bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none"
                                                            value={item.quantity}
                                                            onChange={e => {
                                                                const newQ = Number(e.target.value);
                                                                setTempItems(prev => prev.map((it, i) => i === idx ? {...it, quantity: newQ} : it));
                                                            }}
                                                         />
                                                     </td>
                                                     <td className="py-2 text-right">{item.price.toLocaleString()}</td>
                                                     <td className="py-2 text-right">
                                                         <button onClick={() => setTempItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><span className="material-icons-round text-sm">close</span></button>
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 )}
                             </div>

                             <div className="flex justify-between items-center text-lg font-bold bg-indigo-50 p-3 rounded-lg mb-4 text-indigo-800">
                                 <span>Tổng chi phí dự kiến:</span>
                                 <span>{currentTotal.toLocaleString()} ₫</span>
                             </div>

                             {/* Status Actions */}
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                 <button onClick={() => handleUpdateTicket('CHECKING')} className={`p-2 rounded font-bold text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300 ${!isTech && 'opacity-50'}`}>Đang kiểm tra</button>
                                 <button onClick={() => handleUpdateTicket('QUOTING')} className={`p-2 rounded font-bold text-sm bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-300 ${!isSales && 'opacity-50'}`}>Báo giá khách</button>
                                 <button onClick={() => handleUpdateTicket('WAITING_PARTS')} className={`p-2 rounded font-bold text-sm bg-pink-100 text-pink-800 hover:bg-pink-200 border border-pink-300 ${!isTech && 'opacity-50'}`}>Chờ linh kiện</button>
                                 <button onClick={() => handleUpdateTicket('IN_PROGRESS')} className={`p-2 rounded font-bold text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 ${!isTech && 'opacity-50'}`}>Tiến hành sửa</button>
                                 <button onClick={() => handleUpdateTicket('COMPLETED')} className={`p-2 rounded font-bold text-sm bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 ${!isTech && 'opacity-50'}`}>Đã xong</button>
                                 <button onClick={() => handleUpdateTicket('CANCELLED')} className="p-2 rounded font-bold text-sm bg-slate-200 text-slate-600 hover:bg-slate-300 border border-slate-300">Hủy phiếu</button>
                                 
                                 <button 
                                    onClick={handleInitiatePayment} 
                                    className="col-span-2 p-2 rounded font-bold text-sm bg-purple-600 text-white hover:bg-purple-700 shadow-md flex justify-center items-center gap-2"
                                 >
                                    <span className="material-icons-round">payments</span> Trả Máy & Thu Tiền
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>
                 
                 <div className="bg-slate-100 p-4 border-t flex justify-between items-center text-sm text-slate-500">
                     <span>Cập nhật lần cuối: {new Date().toLocaleString()}</span>
                     <button onClick={() => handleUpdateTicket()} className="bg-slate-800 text-white px-6 py-2 rounded font-bold hover:bg-slate-900">Lưu thay đổi</button>
                 </div>
             </div>
          </div>
      )}

      {/* --- MODAL: THANH TOÁN --- */}
      {isPaymentModalOpen && selectedTicket && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                  <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="material-icons-round text-3xl">check_circle</span>
                      </div>
                      <h3 className="font-bold text-xl text-slate-800">Xác nhận trả máy</h3>
                      <p className="text-slate-500 text-sm mt-1">Khách hàng: {selectedTicket.customerName}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="flex justify-between mb-2">
                          <span className="text-slate-600 font-medium">Tổng chi phí:</span>
                          <span className="font-bold text-slate-800">{currentTotal.toLocaleString()} ₫</span>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Khách thanh toán</label>
                          <input 
                            type="number" 
                            className="w-full border-2 border-green-500 rounded p-2 text-xl font-bold text-green-700 text-right focus:outline-none" 
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(Number(e.target.value))}
                          />
                      </div>
                      <div className="flex justify-between mt-2 text-sm">
                          <span className="text-slate-500">Còn nợ:</span>
                          <span className={`font-bold ${currentTotal - paymentAmount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                              {Math.max(0, currentTotal - paymentAmount).toLocaleString()} ₫
                          </span>
                      </div>
                  </div>

                  <button 
                    onClick={handleConfirmPaymentAndPrint}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                      <span className="material-icons-round">print</span> Hoàn tất & In hóa đơn
                  </button>
                  <button onClick={() => setIsPaymentModalOpen(false)} className="w-full text-slate-500 font-bold text-sm py-2 hover:bg-slate-50 rounded">Quay lại</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default RepairTickets;

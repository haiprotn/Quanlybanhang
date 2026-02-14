
import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, Customer, Product, InvoiceItem, Employee, DeviceInfo, Warehouse } from '../types';
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

const RepairTickets: React.FC<RepairTicketsProps> = ({ invoices, customers, products, currentUser, onUpdateInvoice, onAddInvoice, onAddCustomer }) => {
  const [activeTab, setActiveTab] = useState<string>('ACTIVE'); 
  
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
    if (activeTab === 'COMPLETED') return repairTickets.filter(t => t.repairStatus === 'DELIVERED');
    if (activeTab === 'CANCELLED') return repairTickets.filter(t => t.repairStatus === 'CANCELLED');
    return repairTickets.filter(t => t.repairStatus !== 'DELIVERED' && t.repairStatus !== 'CANCELLED');
  }, [repairTickets, activeTab]);

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
        w?.document.write(generateRepairTicketHTML(newTicket, cust, newTicket.deviceInfo!.symptoms, newTicket.note || ''));
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
          w.document.write(generateReceiptHTML(invoiceForPrint, cust));
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md animate-pulse"
            >
                <span className="material-icons-round">add_circle</span> Tiếp nhận máy
            </button>
        </div>
      </div>
      
      {/* Tab Filter */}
      <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
           {[{id:'ACTIVE', label:'Đang xử lý'}, {id:'COMPLETED', label:'Đã trả máy'}, {id:'CANCELLED', label:'Đã hủy'}].map(tab => (
             <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
             >
               {tab.label}
             </button>
           ))}
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
                        <button type="button" onClick={() => setIsAddCustModalOpen(true)} className="bg-green-600 text-white p-2 rounded mb-[1px]"><span className="material-icons-round">person_add</span></button>
                    </div>

                    {/* Device Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Tên máy / Model</label>
                            <input type="text" className="w-full border p-2 rounded" value={receptionData.deviceName} onChange={e => setReceptionData({...receptionData, deviceName: e.target.value})} placeholder="VD: Dell XPS 15" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu</label>
                            <input type="text" className="w-full border p-2 rounded" value={receptionData.password} onChange={e => setReceptionData({...receptionData, password: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Tình trạng (Khách báo)</label>
                        <textarea className="w-full border p-2 rounded h-20" value={receptionData.symptoms} onChange={e => setReceptionData({...receptionData, symptoms: e.target.value})} placeholder="Mô tả lỗi..."></textarea>
                    </div>
                    <div className="relative">
                        <label className="text-xs font-bold text-slate-500 uppercase">Ghi chú tiếp nhận (AI Support)</label>
                        <textarea className="w-full border p-2 rounded h-20 bg-orange-50" value={receptionNote} onChange={e => setReceptionNote(e.target.value)}></textarea>
                        <button type="button" onClick={handleSuggestNote} disabled={suggesting} className="absolute right-2 bottom-2 text-orange-500 hover:text-orange-700"><span className="material-icons-round">auto_awesome</span></button>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex gap-3">
                    <button type="button" onClick={() => handleCreateReception(false)} className="flex-1 py-3 bg-slate-200 font-bold rounded text-slate-700">Lưu phiếu</button>
                    <button type="button" onClick={() => handleCreateReception(true)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded">Lưu & In Phiếu</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL: XỬ LÝ (Role Based) --- */}
      {isProcessModalOpen && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                 <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                     <div>
                         <h2 className="font-bold text-xl">{selectedTicket.customerName} - {selectedTicket.deviceInfo?.deviceName}</h2>
                         <p className="text-xs text-slate-400">Phiếu: {selectedTicket.id}</p>
                     </div>
                     <button type="button" onClick={() => setIsProcessModalOpen(false)}><span className="material-icons-round">close</span></button>
                 </div>
                 
                 <div className="flex-1 flex overflow-hidden">
                     {/* LEFT: TECH AREA */}
                     <div className="w-1/3 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto">
                         <h3 className="font-bold text-indigo-700 mb-2 flex items-center gap-2">
                             <span className="material-icons-round">handyman</span> KỸ THUẬT VIÊN
                         </h3>
                         <div className="bg-white p-3 rounded border shadow-sm mb-4">
                             <p className="text-xs text-slate-500 font-bold">Lỗi khách báo:</p>
                             <p className="text-sm text-red-600 mb-2">{selectedTicket.deviceInfo?.symptoms}</p>
                             
                             <label className="text-xs text-slate-500 font-bold block mt-3">Kết quả kiểm tra / Chẩn đoán:</label>
                             <textarea 
                                disabled={!isTech && selectedTicket.repairStatus !== 'RECEIVED'}
                                className="w-full border border-slate-300 rounded p-2 text-sm h-32 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={tempDiagnosis}
                                onChange={(e) => setTempDiagnosis(e.target.value)}
                                placeholder="Kỹ thuật nhập kết quả kiểm tra..."
                             ></textarea>
                         </div>
                         
                         <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                             <label className="text-xs text-yellow-800 font-bold block">Ghi chú nội bộ:</label>
                             <textarea 
                                className="w-full bg-transparent border-b border-yellow-300 text-sm h-20 outline-none mt-1"
                                value={tempNote}
                                onChange={(e) => setTempNote(e.target.value)}
                             ></textarea>
                         </div>
                         
                         {isTech && (
                             <button type="button" onClick={() => handleUpdateTicket()} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold shadow-sm">
                                 Cập nhật thông tin KT
                             </button>
                         )}
                     </div>

                     {/* MIDDLE: QUOTING (For Sales & Tech) */}
                     <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
                         <div className="p-3 border-b border-slate-100 bg-slate-50">
                             <input type="text" placeholder="Tìm linh kiện..." className="w-full border rounded p-2 text-sm" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                         </div>
                         <div className="flex-1 overflow-y-auto p-2">
                             {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                 <button type="button" key={p.id} onClick={() => addItem(p)} className="w-full text-left p-2 hover:bg-indigo-50 border-b border-slate-100 flex justify-between items-center group">
                                     <div>
                                         <p className="text-sm font-semibold">{p.name}</p>
                                         <p className="text-xs text-slate-500">Kho: {p.stock[Warehouse.TAY_PHAT]}</p>
                                     </div>
                                     <span className="text-indigo-600 font-bold text-sm">{p.price.toLocaleString()}</span>
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* RIGHT: SALES / INVOICE */}
                     <div className="w-1/3 flex flex-col bg-slate-50">
                         <div className="p-4 border-b border-slate-200">
                             <h3 className="font-bold text-green-700 flex items-center gap-2">
                                 <span className="material-icons-round">payments</span> BÁO GIÁ & THANH TOÁN
                             </h3>
                             <StatusBadge status={selectedTicket.repairStatus || 'RECEIVED'} />
                         </div>
                         <div className="flex-1 overflow-y-auto p-4 space-y-2">
                             {tempItems.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border">
                                     <div className="flex-1">
                                         <p className="text-sm font-medium">{item.productName}</p>
                                         <p className="text-xs text-slate-500">{item.price.toLocaleString()} x {item.quantity}</p>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <span className="font-bold text-indigo-700">{(item.price * item.quantity).toLocaleString()}</span>
                                         {(isSales || isTech) && <button type="button" onClick={() => setTempItems(prev => prev.filter(i => i.productId !== item.productId))} className="text-red-400"><span className="material-icons-round text-sm">close</span></button>}
                                     </div>
                                 </div>
                             ))}
                             {tempItems.length === 0 && <p className="text-center text-slate-400 text-sm mt-4">Chưa có linh kiện/dịch vụ</p>}
                         </div>
                         
                         <div className="p-4 bg-white border-t border-slate-200">
                             <div className="flex justify-between mb-4 text-lg font-bold">
                                 <span>Tổng cộng:</span>
                                 <span className="text-indigo-700">{tempItems.reduce((sum,i) => sum+(i.price*i.quantity),0).toLocaleString()} ₫</span>
                             </div>
                             
                             {/* ACTIONS FLOW */}
                             <div className="space-y-2">
                                 {/* 1. Tech sends Quote */}
                                 {selectedTicket.repairStatus === 'CHECKING' && (
                                     <button 
                                        type="button" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleUpdateTicket('QUOTING');
                                        }} 
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-bold"
                                     >
                                        Chuyển Báo Giá (Cho Sale)
                                     </button>
                                 )}
                                 
                                 {/* 2. Sales OR Tech Confirms with Customer (Flexible Role) */}
                                 {((isSales || isTech) && selectedTicket.repairStatus === 'QUOTING') && (
                                     <button 
                                        type="button" 
                                        onClick={(e) => { 
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleUpdateTicket('IN_PROGRESS'); 
                                        }} 
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold shadow-md transition-transform active:scale-95"
                                     >
                                         Khách Chốt Sửa (Tiến hành)
                                     </button>
                                 )}
                                 
                                 {/* 3. Tech Finishes */}
                                 {(isTech && selectedTicket.repairStatus === 'IN_PROGRESS') && (
                                     <button 
                                        type="button" 
                                        onClick={(e) => { 
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleUpdateTicket('COMPLETED'); 
                                        }} 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold shadow-md transition-transform active:scale-95"
                                     >
                                         Báo Đã Sửa Xong
                                     </button>
                                 )}
                                 
                                 {/* 4. Sales Creates Invoice */}
                                 {(isSales && selectedTicket.repairStatus === 'COMPLETED') && (
                                     <button type="button" onClick={handleInitiatePayment} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded font-bold flex justify-center items-center gap-2 shadow-lg animate-bounce-short">
                                         <span className="material-icons-round">receipt_long</span> LẬP HÓA ĐƠN & TRẢ MÁY
                                     </button>
                                 )}

                                 <button type="button" onClick={() => handleUpdateTicket()} className="w-full border border-slate-300 text-slate-600 py-2 rounded font-medium hover:bg-slate-100">Lưu tạm (Không đổi trạng thái)</button>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {isPaymentModalOpen && selectedTicket && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                          <span className="material-icons-round">point_of_sale</span> Thanh toán sửa chữa
                      </h3>
                      <button onClick={() => setIsPaymentModalOpen(false)}><span className="material-icons-round">close</span></button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-500 font-medium">Tổng tiền dịch vụ:</span>
                          <span className="text-xl font-bold text-purple-700">{currentTotal.toLocaleString()} ₫</span>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Khách thanh toán:</label>
                          <input 
                              type="number" 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          />
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-600">
                              {paymentAmount < currentTotal ? 'Khách còn nợ:' : 'Tiền thừa trả khách:'}
                          </span>
                          <span className={`text-lg font-bold ${paymentAmount < currentTotal ? 'text-red-600' : 'text-green-600'}`}>
                              {Math.abs(currentTotal - paymentAmount).toLocaleString()} ₫
                          </span>
                      </div>
                      
                      {paymentAmount < currentTotal && (
                          <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                              <span className="material-icons-round text-sm">warning</span>
                              <span>Số tiền thiếu sẽ được tự động ghi vào công nợ của khách hàng này.</span>
                          </div>
                      )}

                      <button 
                          onClick={handleConfirmPaymentAndPrint}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-200 mt-2 transition-transform active:scale-95 flex items-center justify-center gap-2"
                      >
                          <span className="material-icons-round">print</span> Xác nhận & In phiếu
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Add Cust Modal (Simple version) */}
      {isAddCustModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96 space-y-3">
                  <h3 className="font-bold">Thêm khách hàng nhanh</h3>
                  <input className="w-full border p-2 rounded" placeholder="Tên" value={newCustData.name} onChange={e=>setNewCustData({...newCustData, name: e.target.value})} />
                  <input className="w-full border p-2 rounded" placeholder="SĐT" value={newCustData.phone} onChange={e=>setNewCustData({...newCustData, phone: e.target.value})} />
                  <input className="w-full border p-2 rounded" placeholder="Địa chỉ" value={newCustData.address} onChange={e=>setNewCustData({...newCustData, address: e.target.value})} />
                  <button type="button" onClick={handleSaveNewCustomer} className="w-full bg-green-600 text-white py-2 rounded font-bold">Lưu</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default RepairTickets;

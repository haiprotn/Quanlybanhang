import React, { useState } from 'react';
import { Customer, Invoice } from '../types';
import { generateDebtReport } from '../services/geminiService';

interface DebtManagementProps {
  customers: Customer[];
  invoices: Invoice[];
}

const DebtManagement: React.FC<DebtManagementProps> = ({ customers, invoices }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'HISTORY'>('INVOICES');
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const totalReceivables = customers.reduce((sum, c) => sum + c.totalDebt, 0);
  const totalCustomersWithDebt = customers.filter(c => c.totalDebt > 0).length;

  const handleAnalyzeDebt = async (customer: Customer) => {
    setAnalyzing(true);
    setAiAnalysis('');
    const report = await generateDebtReport(customer, invoices);
    setAiAnalysis(report);
    setAnalyzing(false);
  };

  const getCustomerInvoices = (customerId: string) => {
    // Exclude cancelled invoices
    return invoices.filter(inv => inv.customerId === customerId && inv.status !== 'CANCELLED');
  };

  const copyReminder = (customer: Customer) => {
      const text = `Kính gửi Anh/Chị ${customer.name},\nCông ty xin thông báo tổng dư nợ hiện tại của quý khách là ${customer.totalDebt.toLocaleString()} VNĐ.\nKính mong quý khách sắp xếp thanh toán sớm.\nXin cảm ơn!`;
      navigator.clipboard.writeText(text);
      alert("Đã sao chép nội dung nhắc nợ vào bộ nhớ tạm!");
  };

  const handlePayment = () => {
      // Mock payment logic
      alert(`Đã lập phiếu thu ${paymentAmount.toLocaleString()} VNĐ cho khách hàng ${selectedCustomer?.name}. (Tính năng Demo)`);
      setShowPaymentModal(false);
      setPaymentAmount(0);
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-6 animate-fade-in">
        {/* Debt Dashboard */}
        <div className="flex justify-between items-center">
             <div>
                <h1 className="text-2xl font-bold text-slate-800">Quản lý Công nợ</h1>
                <p className="text-slate-500 text-sm">Theo dõi thu nợ và dòng tiền</p>
             </div>
             <div className="flex gap-4">
                 <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                     <div className="p-2 bg-red-50 rounded-full text-red-600">
                         <span className="material-icons-round">trending_down</span>
                     </div>
                     <div>
                         <p className="text-xs text-slate-500 font-medium">Tổng phải thu</p>
                         <p className="text-lg font-bold text-red-600">{totalReceivables.toLocaleString()} ₫</p>
                     </div>
                 </div>
                 <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                     <div className="p-2 bg-orange-50 rounded-full text-orange-600">
                         <span className="material-icons-round">people</span>
                     </div>
                     <div>
                         <p className="text-xs text-slate-500 font-medium">Khách đang nợ</p>
                         <p className="text-lg font-bold text-slate-800">{totalCustomersWithDebt}</p>
                     </div>
                 </div>
             </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Left: Customer List */}
            <div className="w-1/3 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <input 
                        type="text" 
                        placeholder="Tìm khách hàng..."
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                {customers.map(customer => (
                    <button
                    key={customer.id}
                    onClick={() => { setSelectedCustomer(customer); setAiAnalysis(''); setActiveTab('INVOICES'); }}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group
                        ${selectedCustomer?.id === customer.id ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200' : ''}
                    `}
                    >
                    <div>
                        <p className={`font-semibold text-sm ${selectedCustomer?.id === customer.id ? 'text-indigo-800' : 'text-slate-800'}`}>{customer.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{customer.phone}</p>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold text-sm ${customer.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {customer.totalDebt.toLocaleString()} ₫
                        </p>
                        {customer.totalDebt > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Nợ xấu</span>}
                    </div>
                    </button>
                ))}
                </div>
            </div>

            {/* Right: Details */}
            <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
                {selectedCustomer ? (
                <>
                    {/* Customer Header */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{selectedCustomer.name}</h2>
                                <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                    <span className="flex items-center gap-1"><span className="material-icons-round text-base">phone</span> {selectedCustomer.phone}</span>
                                    <span className="flex items-center gap-1"><span className="material-icons-round text-base">place</span> {selectedCustomer.address}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Dư nợ hiện tại</p>
                                <p className="text-3xl font-bold text-red-600 tracking-tight">{selectedCustomer.totalDebt.toLocaleString()} ₫</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4">
                             <button 
                                onClick={() => { setPaymentAmount(selectedCustomer.totalDebt); setShowPaymentModal(true); }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                             >
                                 <span className="material-icons-round text-lg">payments</span>
                                 Lập phiếu thu
                             </button>
                             <button 
                                onClick={() => copyReminder(selectedCustomer)}
                                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
                             >
                                 <span className="material-icons-round text-lg text-blue-500">chat</span>
                                 Sao chép nhắc nợ
                             </button>
                        </div>
                    </div>

                    {/* AI Section */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-white">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                                <span className="material-icons-round text-lg">psychology</span>
                                Phân tích tín dụng AI
                            </div>
                            {!aiAnalysis && (
                                <button 
                                    onClick={() => handleAnalyzeDebt(selectedCustomer)}
                                    disabled={analyzing}
                                    className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-200 disabled:opacity-50 font-medium transition-colors"
                                >
                                    {analyzing ? 'Đang suy nghĩ...' : 'Phân tích ngay'}
                                </button>
                            )}
                        </div>
                        
                        {analyzing && (
                            <div className="animate-pulse flex space-x-4 py-2">
                                <div className="flex-1 space-y-2">
                                <div className="h-2 bg-slate-200 rounded w-full"></div>
                                <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        )}
                        
                        {aiAnalysis && (
                            <div className="text-sm text-slate-700 leading-relaxed italic bg-white p-3 rounded border border-indigo-100">
                                "{aiAnalysis}"
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200">
                         <button 
                            onClick={() => setActiveTab('INVOICES')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'INVOICES' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                             Lịch sử Hóa đơn
                         </button>
                         <button 
                            onClick={() => setActiveTab('HISTORY')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'HISTORY' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                             Lịch sử Thanh toán
                         </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-0">
                        {activeTab === 'INVOICES' ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">Mã phiếu</th>
                                        <th className="px-6 py-3">Ngày</th>
                                        <th className="px-6 py-3 text-right">Tổng tiền</th>
                                        <th className="px-6 py-3 text-right">Đã thanh toán</th>
                                        <th className="px-6 py-3 text-right">Còn nợ</th>
                                        <th className="px-6 py-3 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {getCustomerInvoices(selectedCustomer.id).length > 0 ? (
                                        getCustomerInvoices(selectedCustomer.id).map(inv => {
                                            const remaining = inv.totalAmount - inv.paidAmount;
                                            return (
                                            <tr key={inv.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-3 font-medium text-indigo-600">{inv.id}</td>
                                                <td className="px-6 py-3 text-slate-600">{inv.date}</td>
                                                <td className="px-6 py-3 text-right font-medium">{inv.totalAmount.toLocaleString()}</td>
                                                <td className="px-6 py-3 text-right text-green-600">{inv.paidAmount.toLocaleString()}</td>
                                                <td className="px-6 py-3 text-right font-bold text-red-500">{remaining > 0 ? remaining.toLocaleString() : '-'}</td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase
                                                        ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                                                        inv.status === 'PARTIAL' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}
                                                    `}>
                                                        {inv.status === 'PAID' ? 'Hoàn thành' : inv.status === 'PARTIAL' ? 'Một phần' : 'Chưa trả'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )})
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                                                Khách hàng chưa có hóa đơn nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <span className="material-icons-round text-4xl mb-2 opacity-30">history</span>
                                <p>Chưa có lịch sử thanh toán</p>
                            </div>
                        )}
                    </div>
                </>
                ) : (
                <div className="flex-1 bg-slate-50 flex items-center justify-center text-slate-400 flex-col gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="material-icons-round text-3xl text-slate-300">person_search</span>
                    </div>
                    <p className="font-medium">Chọn khách hàng để xem chi tiết công nợ</p>
                </div>
                )}

                {/* Payment Modal Overlay */}
                {showPaymentModal && selectedCustomer && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                             <div className="bg-green-600 p-4 flex justify-between items-center text-white">
                                 <h3 className="font-bold flex items-center gap-2">
                                     <span className="material-icons-round">payments</span> Lập phiếu thu
                                 </h3>
                                 <button onClick={() => setShowPaymentModal(false)} className="hover:bg-green-700 p-1 rounded transition-colors"><span className="material-icons-round">close</span></button>
                             </div>
                             <div className="p-6 space-y-4">
                                 <div>
                                     <label className="block text-sm font-medium text-slate-700 mb-1">Khách hàng</label>
                                     <input type="text" value={selectedCustomer.name} disabled className="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-sm text-slate-500" />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền thanh toán (VNĐ)</label>
                                     <input 
                                        type="number" 
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-lg font-bold text-green-700 focus:ring-2 focus:ring-green-500 outline-none" 
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                                     <textarea className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-20 resize-none" placeholder="Nội dung thu..."></textarea>
                                 </div>
                                 <button onClick={handlePayment} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-200 transition-all">
                                     Xác nhận thu tiền
                                 </button>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default DebtManagement;
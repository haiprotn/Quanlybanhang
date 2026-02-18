
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { VATInvoice, VATInvoiceItem, Warehouse } from '../types';
import { parseInvoiceFromText, parseInvoiceFromImage } from '../services/geminiService';
import { extractTextFromPDF } from '../services/pdfService';

interface VATInvoicesProps {
    invoices: VATInvoice[];
    onAddInvoice: (inv: VATInvoice) => void;
    onUpdateInvoice: (inv: VATInvoice) => void;
}

const VATInvoices: React.FC<VATInvoicesProps> = ({ invoices, onAddInvoice, onUpdateInvoice }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // --- FILTER STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterWarehouse, setFilterWarehouse] = useState<'ALL' | Warehouse>('ALL');
    const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // File Upload State
    const [isAiParsing, setIsAiParsing] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [rawText, setRawText] = useState(''); 
    const [dragActive, setDragActive] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState<Partial<VATInvoice>>({
        type: 'IN',
        warehouse: Warehouse.TAY_PHAT,
        taxRate: 10,
        items: [],
        totalAmount: 0,
        totalBeforeTax: 0,
        taxAmount: 0
    });

    // --- FILTER LOGIC ---
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                inv.invoiceNumber.toLowerCase().includes(searchLower) ||
                inv.partnerName.toLowerCase().includes(searchLower) ||
                inv.taxCode.includes(searchLower);
            const matchesWarehouse = filterWarehouse === 'ALL' || inv.warehouse === filterWarehouse;
            const matchesType = filterType === 'ALL' || inv.type === filterType;
            let matchesDate = true;
            if (startDate) matchesDate = matchesDate && inv.date >= startDate;
            if (endDate) matchesDate = matchesDate && inv.date <= endDate;
            return matchesSearch && matchesWarehouse && matchesType && matchesDate;
        });
    }, [invoices, searchTerm, filterWarehouse, filterType, startDate, endDate]);

    const resetForm = () => {
        setFormData({ type: 'IN', warehouse: Warehouse.TAY_PHAT, taxRate: 10, items: [], totalAmount: 0, totalBeforeTax: 0, taxAmount: 0 });
        setRawText('');
        setEditingId(null);
        setAiError(null);
        setIsModalOpen(false);
    }

    const recalculateTotals = (items: VATInvoiceItem[], rate: number) => {
        const totalBefore = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = Math.round(totalBefore * (rate / 100));
        setFormData(prev => ({
            ...prev,
            items: items,
            taxRate: rate,
            totalBeforeTax: totalBefore,
            taxAmount: tax,
            totalAmount: totalBefore + tax
        }));
    };

    const handleEdit = (invoice: VATInvoice) => {
        setFormData({ ...invoice });
        setEditingId(invoice.id);
        setRawText(`(Đang chỉnh sửa hóa đơn: ${invoice.invoiceNumber})`);
        setIsModalOpen(true);
    };

    const applyParsedResult = (result: any) => {
        if(result) {
            setAiError(null);
            const detectedType = (result.type === 'IN' || result.type === 'OUT') ? result.type : formData.type;
            let detectedWarehouse = formData.warehouse;
            if (result.internalCompany === 'TNC') detectedWarehouse = Warehouse.TNC;
            if (result.internalCompany === 'TAY_PHAT') detectedWarehouse = Warehouse.TAY_PHAT;

            setFormData(prev => ({
                ...prev,
                type: detectedType,
                warehouse: detectedWarehouse,
                invoiceNumber: result.invoiceNumber,
                date: result.date,
                partnerName: result.partnerName,
                taxCode: result.taxCode,
                items: result.items || [],
            }));
            recalculateTotals(result.items || [], result.taxRate || 10);
        }
    }

    const handleAiParseText = async (textToParse: string) => {
        if (!textToParse.trim()) return;
        setIsAiParsing(true);
        setAiError(null);
        try {
            const result = await parseInvoiceFromText(textToParse);
            if(result) applyParsedResult(result);
            else setAiError("Không thể trích xuất (Kết quả rỗng).");
        } catch(e: any) {
            setAiError("Lỗi kết nối AI. Kiểm tra API Key trong Cài đặt.");
        } finally {
            setIsAiParsing(false);
        }
    };

    const handleAiParseImage = async (base64: string, mimeType: string) => {
        setIsAiParsing(true);
        setAiError(null);
        try {
            const result = await parseInvoiceFromImage(base64, mimeType);
            if(result) applyParsedResult(result);
            else setAiError("Không thể trích xuất (Kết quả rỗng).");
        } catch (e: any) {
            setAiError("Lỗi kết nối AI. Kiểm tra API Key trong Cài đặt.");
        } finally {
            setIsAiParsing(false);
        }
    }

    const handleFile = async (file: File) => {
        if (!file) return;
        if (file.type === 'application/pdf') {
            setIsAiParsing(true);
            setRawText("Đang đọc file PDF...");
            try {
                const text = await extractTextFromPDF(file);
                setRawText(text); 
                await handleAiParseText(text);
            } catch (err: any) {
                setAiError("Lỗi đọc PDF: " + err.message);
                setRawText("Lỗi đọc file: " + err.message);
                setIsAiParsing(false);
            }
        } else if (file.type.startsWith('image/')) {
            setIsAiParsing(true);
            setRawText("Đang xử lý hình ảnh...");
            const reader = new FileReader();
            reader.onload = async () => {
                const base64String = (reader.result as string).split(',')[1];
                await handleAiParseImage(base64String, file.type);
                setRawText("(Đã xử lý hình ảnh OCR)");
            };
            reader.readAsDataURL(file);
        } else {
            setAiError("Chỉ hỗ trợ file PDF hoặc file Ảnh (JPG, PNG)");
        }
    };

    const handleAddItem = () => {
        const newItem: VATInvoiceItem = { productName: '', unit: '', quantity: 1, unitPrice: 0, total: 0 };
        const newItems = [...(formData.items || []), newItem];
        recalculateTotals(newItems, formData.taxRate || 10);
    };

    const handleUpdateItem = (index: number, field: keyof VATInvoiceItem, value: any) => {
        const newItems = [...(formData.items || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
        recalculateTotals(newItems, formData.taxRate || 10);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = (formData.items || []).filter((_, i) => i !== index);
        recalculateTotals(newItems, formData.taxRate || 10);
    };

    const handleSave = () => {
        if(!formData.invoiceNumber || !formData.partnerName) {
            alert("Thiếu thông tin bắt buộc (Số hóa đơn, Đơn vị)!");
            return;
        }
        const invToSave: VATInvoice = {
            id: editingId ? editingId : `VAT-${Date.now()}`,
            invoiceNumber: formData.invoiceNumber!,
            date: formData.date || new Date().toISOString().split('T')[0],
            partnerName: formData.partnerName!,
            taxCode: formData.taxCode || '',
            items: formData.items || [],
            totalBeforeTax: Number(formData.totalBeforeTax),
            taxRate: Number(formData.taxRate),
            taxAmount: Number(formData.taxAmount),
            totalAmount: Number(formData.totalAmount),
            type: formData.type as 'IN' | 'OUT',
            warehouse: formData.warehouse || Warehouse.TAY_PHAT,
            status: 'PENDING'
        };
        if (editingId) onUpdateInvoice(invToSave);
        else onAddInvoice(invToSave);
        resetForm();
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Hóa đơn VAT</h1>
                    <p className="text-slate-500 text-sm">Quản lý hóa đơn đầu vào - đầu ra & bóc tách dữ liệu AI</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                        <span className="material-icons-round">post_add</span> Tạo Hóa Đơn Mới
                    </button>
                </div>
            </div>

            {/* Main Content (List) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 relative">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input type="text" placeholder="Tìm số HĐ, tên đối tác..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                 </div>
                 <div className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase"><th className="px-6 py-4">Số HĐ</th><th className="px-6 py-4">Đối tác</th><th className="px-6 py-4 text-right">Tổng cộng</th><th className="px-6 py-4"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm">
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4">{inv.partnerName}</td>
                                    <td className="px-6 py-4 text-right font-bold">{inv.totalAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center"><button onClick={() => handleEdit(inv)} className="text-indigo-600"><span className="material-icons-round">edit</span></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    {/* MODAL WRAPPER: Sử dụng h-[85vh] và căn giữa */}
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[85vh] flex flex-col overflow-hidden animate-fade-in transition-all">
                        
                        {/* HEADER */}
                        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <span className="material-icons-round">receipt_long</span> {editingId ? 'Chỉnh Sửa' : 'Thêm Hóa đơn'}
                            </h3>
                            <button onClick={resetForm} className="hover:bg-indigo-500 p-1 rounded"><span className="material-icons-round">close</span></button>
                        </div>
                        
                        {/* BODY CONTENT: Chia 2 cột */}
                        <div className="flex-1 flex overflow-hidden">
                            
                            {/* LEFT COLUMN: Upload & Raw Data (Fixed Width) */}
                            <div className="w-[380px] border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
                                <div className="p-4 border-b border-slate-200 bg-white shrink-0">
                                    <h4 className="font-bold text-xs text-slate-500 uppercase mb-2">1. Tải lên (PDF/Ảnh)</h4>
                                    <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}>
                                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept=".pdf, .jpg, .jpeg, .png" />
                                        {isAiParsing ? (
                                            <div className="flex flex-col items-center gap-2 py-2">
                                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                                <span className="text-xs font-bold text-indigo-600">Đang đọc dữ liệu...</span>
                                            </div>
                                        ) : (
                                            <div className="py-2">
                                                <span className="material-icons-round text-3xl text-slate-300 mb-1">cloud_upload</span>
                                                <p className="text-sm font-bold text-slate-700">Kéo thả hoặc Chọn file</p>
                                            </div>
                                        )}
                                    </div>
                                    {aiError && (
                                        <div className="mt-2 bg-red-50 text-red-600 p-2 rounded text-xs font-medium border border-red-100 flex gap-2 items-start">
                                            <span className="material-icons-round text-sm">error</span>
                                            <span className="flex-1">{aiError}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 p-3 flex flex-col min-h-0">
                                     <h4 className="font-bold text-xs text-slate-500 uppercase mb-2 shrink-0">Dữ liệu thô (OCR)</h4>
                                     <textarea 
                                        className="flex-1 w-full border border-slate-300 rounded-lg p-3 text-xs font-mono resize-none focus:outline-none focus:border-indigo-500" 
                                        value={rawText} 
                                        onChange={e => setRawText(e.target.value)} 
                                        placeholder="Nội dung trích xuất sẽ hiện ở đây..."
                                     ></textarea>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Form Data (Fluid Width) */}
                            <div className="flex-1 flex flex-col min-w-0 bg-white">
                                <div className="flex-1 overflow-y-auto p-6">
                                    <h4 className="font-bold text-xs text-slate-500 uppercase mb-4">2. Thông tin chi tiết</h4>
                                    
                                    <div className="grid grid-cols-12 gap-4 mb-6">
                                         <div className="col-span-3">
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Số hóa đơn</label>
                                            <input className="w-full border border-slate-300 p-2 rounded text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.invoiceNumber || ''} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} />
                                         </div>
                                         <div className="col-span-3">
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ngày hóa đơn</label>
                                            <input type="date" className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                                         </div>
                                         <div className="col-span-6">
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mã số thuế</label>
                                            <input className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.taxCode || ''} onChange={e => setFormData({...formData, taxCode: e.target.value})} />
                                         </div>
                                         <div className="col-span-8">
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Đơn vị (Đối tác)</label>
                                            <input className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.partnerName || ''} onChange={e => setFormData({...formData, partnerName: e.target.value})} />
                                         </div>
                                         <div className="col-span-4">
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Loại hóa đơn</label>
                                            <select className="w-full border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                                                <option value="IN">Đầu vào (Mua hàng)</option>
                                                <option value="OUT">Đầu ra (Bán hàng)</option>
                                            </select>
                                         </div>
                                    </div>
                                    
                                    <h4 className="font-bold text-xs text-slate-500 uppercase mb-2">Chi tiết hàng hóa</h4>
                                    <table className="w-full text-left text-sm mb-4 border border-slate-200">
                                        <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                                            <tr>
                                                <th className="p-2 border-r">Tên hàng hóa, dịch vụ</th>
                                                <th className="p-2 w-16 border-r text-center">ĐVT</th>
                                                <th className="p-2 w-20 border-r text-center">SL</th>
                                                <th className="p-2 w-32 border-r text-right">Đơn giá</th>
                                                <th className="p-2 w-32 text-right">Thành tiền</th>
                                                <th className="p-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {formData.items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-2 border-r"><input className="w-full outline-none" value={item.productName} onChange={e => handleUpdateItem(idx, 'productName', e.target.value)} /></td>
                                                    <td className="p-2 border-r"><input className="w-full outline-none text-center" value={item.unit} onChange={e => handleUpdateItem(idx, 'unit', e.target.value)} /></td>
                                                    <td className="p-2 border-r"><input type="number" className="w-full outline-none text-center" value={item.quantity} onChange={e => handleUpdateItem(idx, 'quantity', Number(e.target.value))} /></td>
                                                    <td className="p-2 border-r"><input type="number" className="w-full outline-none text-right" value={item.unitPrice} onChange={e => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))} /></td>
                                                    <td className="p-2 text-right font-bold text-slate-700">{item.total.toLocaleString()}</td>
                                                    <td className="p-2 text-center"><button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600"><span className="material-icons-round text-sm">close</span></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button onClick={handleAddItem} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded mb-4"><span className="material-icons-round text-sm">add</span> Thêm dòng</button>
                                    
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                                        <div className="flex justify-between text-sm"><span>Cộng tiền hàng:</span> <span className="font-bold">{formData.totalBeforeTax?.toLocaleString()}</span></div>
                                        <div className="flex justify-between text-sm items-center">
                                            <span>Thuế suất GTGT:</span> 
                                            <select className="border border-slate-300 rounded p-1 text-xs bg-white outline-none" value={formData.taxRate} onChange={e => recalculateTotals(formData.items||[], Number(e.target.value))}>
                                                <option value="0">0%</option>
                                                <option value="5">5%</option>
                                                <option value="8">8%</option>
                                                <option value="10">10%</option>
                                            </select>
                                        </div>
                                        <div className="flex justify-between text-sm"><span>Tiền thuế:</span> <span className="font-bold">{formData.taxAmount?.toLocaleString()}</span></div>
                                        <div className="flex justify-between text-lg font-bold text-indigo-700 border-t border-slate-200 pt-2 mt-2"><span>TỔNG CỘNG:</span> <span>{formData.totalAmount?.toLocaleString()} ₫</span></div>
                                    </div>
                                </div>
                                
                                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
                                    <button onClick={resetForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-600 transition-colors">Hủy</button>
                                    <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition-colors flex items-center gap-2">
                                        <span className="material-icons-round">save</span> Lưu Hóa Đơn
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default VATInvoices;

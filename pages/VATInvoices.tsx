
import React, { useState, useMemo } from 'react';
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
            // 1. Text Search (Invoice Number, Partner Name, Tax Code)
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                inv.invoiceNumber.toLowerCase().includes(searchLower) ||
                inv.partnerName.toLowerCase().includes(searchLower) ||
                inv.taxCode.includes(searchLower);

            // 2. Warehouse Filter
            const matchesWarehouse = filterWarehouse === 'ALL' || inv.warehouse === filterWarehouse;

            // 3. Type Filter
            const matchesType = filterType === 'ALL' || inv.type === filterType;

            // 4. Date Range
            let matchesDate = true;
            if (startDate) matchesDate = matchesDate && inv.date >= startDate;
            if (endDate) matchesDate = matchesDate && inv.date <= endDate;

            return matchesSearch && matchesWarehouse && matchesType && matchesDate;
        });
    }, [invoices, searchTerm, filterWarehouse, filterType, startDate, endDate]);

    // Calculate Summary based on filtered results
    const summary = useMemo(() => {
        return filteredInvoices.reduce((acc, curr) => ({
            count: acc.count + 1,
            totalAmount: acc.totalAmount + curr.totalAmount,
            totalTax: acc.totalTax + curr.taxAmount
        }), { count: 0, totalAmount: 0, totalTax: 0 });
    }, [filteredInvoices]);

    const resetForm = () => {
        setFormData({ 
            type: 'IN', 
            warehouse: Warehouse.TAY_PHAT,
            taxRate: 10, 
            items: [], 
            totalAmount: 0, 
            totalBeforeTax: 0, 
            taxAmount: 0 
        });
        setRawText('');
        setEditingId(null);
        setIsModalOpen(false);
    }

    // Helper to recalc totals based on items
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

    const handleAiParseText = async (textToParse: string) => {
        if (!textToParse.trim()) {
            alert("Vui lòng nhập nội dung hoặc upload file trước.");
            return;
        }
        setIsAiParsing(true);
        const result = await parseInvoiceFromText(textToParse);
        setIsAiParsing(false);
        applyParsedResult(result);
    };

    const handleAiParseImage = async (base64: string, mimeType: string) => {
        setIsAiParsing(true);
        const result = await parseInvoiceFromImage(base64, mimeType);
        setIsAiParsing(false);
        applyParsedResult(result);
    }

    const applyParsedResult = (result: any) => {
        if(result) {
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
        } else {
            alert("AI không thể trích xuất thông tin. Hãy kiểm tra lại nội dung văn bản hoặc chất lượng hình ảnh.");
        }
    }

    // --- FILE HANDLING ---

    const handleFile = async (file: File) => {
        if (!file) return;

        if (file.type === 'application/pdf') {
            setIsAiParsing(true);
            setRawText("Đang đọc file PDF...");
            try {
                const text = await extractTextFromPDF(file);
                setRawText(text); 
                const result = await parseInvoiceFromText(text);
                applyParsedResult(result);
            } catch (err: any) {
                alert("Lỗi đọc PDF: " + err.message);
                setRawText("Lỗi đọc file: " + err.message);
            } finally {
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
            alert("Chỉ hỗ trợ file PDF hoặc file Ảnh (JPG, PNG)");
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    // --- FORM HANDLERS ---

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

        if (editingId) {
            onUpdateInvoice(invToSave);
        } else {
            onAddInvoice(invToSave);
        }
        
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
                    <button 
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
                    >
                        <span className="material-icons-round">post_add</span> Tạo Hóa Đơn Mới
                    </button>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Search Text */}
                    <div className="md:col-span-4 relative">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Tìm số HĐ, tên đối tác, MST..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter Warehouse */}
                    <div className="md:col-span-2">
                         <select 
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            value={filterWarehouse}
                            onChange={(e) => setFilterWarehouse(e.target.value as any)}
                        >
                            <option value="ALL">Tất cả Công ty</option>
                            <option value={Warehouse.TAY_PHAT}>Giải pháp Tây Phát</option>
                            <option value={Warehouse.TNC}>TNC (Máy tính TN)</option>
                        </select>
                    </div>

                    {/* Filter Type */}
                    <div className="md:col-span-2">
                         <select 
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                        >
                            <option value="ALL">Tất cả Loại</option>
                            <option value="IN">Đầu vào (Mua)</option>
                            <option value="OUT">Đầu ra (Bán)</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="md:col-span-4 flex gap-2">
                        <input 
                            type="date" 
                            className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            title="Từ ngày"
                        />
                        <span className="self-center text-slate-400">-</span>
                        <input 
                            type="date" 
                            className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            title="Đến ngày"
                        />
                    </div>
                </div>

                {/* Summary Filter Stats */}
                <div className="flex gap-6 pt-2 border-t border-slate-100 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">Số hóa đơn:</span>
                        <span className="font-bold text-slate-800">{summary.count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">Tổng tiền thuế:</span>
                        <span className="font-bold text-slate-800">{summary.totalTax.toLocaleString()} ₫</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">Tổng giá trị:</span>
                        <span className="font-bold text-indigo-600 text-base">{summary.totalAmount.toLocaleString()} ₫</span>
                    </div>
                </div>
            </div>

            {/* Invoice List Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Loại / Kho</th>
                            <th className="px-6 py-4">Số HĐ</th>
                            <th className="px-6 py-4">Ngày</th>
                            <th className="px-6 py-4">Đối tác</th>
                            <th className="px-6 py-4">Nội dung</th>
                            <th className="px-6 py-4 text-right">Tổng cộng</th>
                            <th className="px-6 py-4 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                        {filteredInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                            ${inv.type === 'IN' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                                        `}>
                                            {inv.type === 'IN' ? 'Đầu vào' : 'Đầu ra'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                            {inv.warehouse === Warehouse.TNC ? 'TNC' : 'Tây Phát'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-700">{inv.invoiceNumber}</td>
                                <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{inv.partnerName}</td>
                                <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                                    {inv.items.map(i => i.productName).join(', ')}
                                </td>
                                <td className="px-6 py-4 text-right font-bold">{inv.totalAmount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleEdit(inv)}
                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full hover:bg-indigo-100 transition-colors"
                                        title="Chỉnh sửa chi tiết"
                                    >
                                        <span className="material-icons-round text-lg">edit</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredInvoices.length === 0 && (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                         <span className="material-icons-round text-4xl mb-2 opacity-50">search_off</span>
                         <p>Không tìm thấy hóa đơn nào phù hợp với bộ lọc.</p>
                    </div>
                )}
            </div>

            {/* ADD INVOICE MODAL (Content remains same as before, included for full file replacement) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-[95vw] h-[90vh] flex flex-col overflow-hidden animate-fade-in">
                        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <span className="material-icons-round">receipt_long</span> 
                                {editingId ? 'Chỉnh Sửa Hóa Đơn' : 'Thêm Hóa đơn VAT'}
                            </h3>
                            <button onClick={resetForm}><span className="material-icons-round">close</span></button>
                        </div>
                        
                        <div className="flex-1 flex overflow-hidden">
                            {/* LEFT: UPLOAD / SOURCE */}
                            <div className="w-5/12 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-slate-200 bg-white shrink-0">
                                    <h4 className="font-bold text-indigo-700 text-sm uppercase flex items-center gap-1 mb-2">
                                        <span className="material-icons-round text-base">cloud_upload</span> Upload Hóa đơn
                                    </h4>
                                    
                                    <div 
                                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative mb-3
                                            ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-white'}
                                        `}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                            onChange={handleFileChange}
                                            accept=".pdf, .jpg, .jpeg, .png"
                                        />
                                        
                                        {isAiParsing ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                                <span className="text-xs font-bold text-indigo-600">Đang xử lý...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="material-icons-round text-4xl text-slate-300 mb-2">upload_file</span>
                                                <p className="text-sm font-bold text-slate-700">Kéo thả file vào đây</p>
                                                <p className="text-xs text-slate-400 mt-1">hoặc nhấn để chọn file (PDF/Ảnh)</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col p-4 overflow-hidden bg-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-slate-600 text-xs uppercase flex items-center gap-1">
                                            <span className="material-icons-round text-sm">article</span>
                                            Nội dung thô (Từ file):
                                        </h4>
                                        <button 
                                            onClick={() => handleAiParseText(rawText)}
                                            disabled={isAiParsing || !rawText}
                                            className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded font-bold hover:bg-indigo-200 disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                        >
                                            <span className="material-icons-round text-[12px]">auto_fix_high</span>
                                            Chạy lại AI
                                        </button>
                                    </div>
                                    <textarea 
                                        className="flex-1 w-full border border-slate-300 rounded-lg p-3 text-xs font-mono resize-none outline-none focus:ring-1 focus:ring-indigo-500 bg-white leading-relaxed shadow-inner"
                                        placeholder="Nội dung file sẽ hiện ở đây. Bạn có thể paste văn bản vào đây để phân tích..."
                                        value={rawText}
                                        onChange={e => setRawText(e.target.value)}
                                        spellCheck={false}
                                    ></textarea>
                                </div>
                            </div>

                            {/* RIGHT: DETAILED FORM */}
                            <div className="w-7/12 p-6 overflow-y-auto bg-white">
                                <div className="grid grid-cols-4 gap-4 mb-6">
                                    <div className="col-span-2">
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Loại & Công ty (Kho)</label>
                                         <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                                            <div className="flex gap-1 border-r border-slate-300 pr-2">
                                                <button 
                                                    onClick={() => setFormData({...formData, type: 'IN'})}
                                                    className={`px-3 py-1 text-xs font-bold rounded ${formData.type === 'IN' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
                                                >Đầu vào</button>
                                                <button 
                                                    onClick={() => setFormData({...formData, type: 'OUT'})}
                                                    className={`px-3 py-1 text-xs font-bold rounded ${formData.type === 'OUT' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500'}`}
                                                >Đầu ra</button>
                                            </div>
                                            <select 
                                                className="flex-1 text-xs font-bold bg-transparent outline-none"
                                                value={formData.warehouse}
                                                onChange={(e) => setFormData({...formData, warehouse: e.target.value as Warehouse})}
                                            >
                                                <option value={Warehouse.TAY_PHAT}>Giải pháp Tây Phát</option>
                                                <option value={Warehouse.TNC}>TNC (Máy Tính Tây Ninh)</option>
                                            </select>
                                         </div>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số hóa đơn</label>
                                        <input className="w-full border p-2 rounded text-sm font-bold text-slate-800" value={formData.invoiceNumber || ''} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} placeholder="VD: 0012345" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày hóa đơn</label>
                                        <input type="date" className="w-full border p-2 rounded text-sm" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mã số thuế</label>
                                        <input className="w-full border p-2 rounded text-sm font-mono" value={formData.taxCode || ''} onChange={e => setFormData({...formData, taxCode: e.target.value})} />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Đơn vị Mua / Bán (Đối tác)</label>
                                        <input className="w-full border p-2 rounded text-sm font-semibold" value={formData.partnerName || ''} onChange={e => setFormData({...formData, partnerName: e.target.value})} />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-slate-700 text-sm uppercase">Chi tiết danh mục sản phẩm</h4>
                                        <button onClick={handleAddItem} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-bold flex items-center gap-1">
                                            <span className="material-icons-round text-sm">add</span> Thêm dòng
                                        </button>
                                    </div>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                                                <tr>
                                                    <th className="px-3 py-2">Tên hàng hóa, dịch vụ</th>
                                                    <th className="px-3 py-2 w-16 text-center">ĐVT</th>
                                                    <th className="px-3 py-2 w-16 text-center">SL</th>
                                                    <th className="px-3 py-2 w-28 text-right">Đơn giá</th>
                                                    <th className="px-3 py-2 w-28 text-right">Thành tiền</th>
                                                    <th className="px-3 py-2 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {formData.items?.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="p-2">
                                                            <input className="w-full border-none bg-transparent outline-none font-medium" value={item.productName} onChange={e => handleUpdateItem(index, 'productName', e.target.value)} placeholder="Nhập tên SP..." />
                                                        </td>
                                                        <td className="p-2">
                                                            <input className="w-full border-none bg-transparent outline-none text-center" value={item.unit} onChange={e => handleUpdateItem(index, 'unit', e.target.value)} />
                                                        </td>
                                                        <td className="p-2">
                                                            <input type="number" className="w-full border-none bg-transparent outline-none text-center font-bold" value={item.quantity} onChange={e => handleUpdateItem(index, 'quantity', Number(e.target.value))} />
                                                        </td>
                                                        <td className="p-2">
                                                            <input type="number" className="w-full border-none bg-transparent outline-none text-right" value={item.unitPrice} onChange={e => handleUpdateItem(index, 'unitPrice', Number(e.target.value))} />
                                                        </td>
                                                        <td className="p-2 text-right font-bold text-slate-700">
                                                            {(item.quantity * item.unitPrice).toLocaleString()}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <button onClick={() => handleRemoveItem(index)} className="text-slate-300 hover:text-red-500"><span className="material-icons-round text-base">delete</span></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <div className="w-2/3 bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Cộng tiền hàng:</span>
                                            <span className="font-bold">{formData.totalBeforeTax?.toLocaleString()} ₫</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 text-sm">Thuế suất GTGT:</span>
                                            <select 
                                                className="border rounded px-2 py-1 text-sm bg-white outline-none"
                                                value={formData.taxRate}
                                                onChange={e => recalculateTotals(formData.items || [], Number(e.target.value))}
                                            >
                                                <option value="0">0%</option>
                                                <option value="8">8%</option>
                                                <option value="10">10%</option>
                                            </select>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Tiền thuế GTGT:</span>
                                            <span className="font-bold text-red-600">{formData.taxAmount?.toLocaleString()} ₫</span>
                                        </div>
                                        <div className="flex justify-between text-lg border-t border-slate-200 pt-2 mt-2">
                                            <span className="font-bold text-slate-800">Tổng thanh toán:</span>
                                            <span className="font-bold text-indigo-700">{formData.totalAmount?.toLocaleString()} ₫</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-white shrink-0">
                            <button onClick={resetForm} className="px-4 py-2 bg-slate-100 rounded text-slate-700 font-bold hover:bg-slate-200">Hủy</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 rounded text-white font-bold shadow-lg hover:bg-indigo-700 transition-transform active:scale-95">Lưu Hóa Đơn</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VATInvoices;

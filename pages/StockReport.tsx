
import React, { useMemo } from 'react';
import { Product, Invoice, PurchaseOrder, ProductType, SystemSettings, Warehouse } from '../types';
import { exportToCSV } from '../utils/exportUtils';
import { generateStockReportHTML } from '../templates/reportTemplates';

interface StockReportProps {
  products: Product[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  systemSettings: SystemSettings;
}

const StockReport: React.FC<StockReportProps> = ({ products, invoices, purchaseOrders, systemSettings }) => {
  
  const reportData = useMemo(() => {
    return products
      .filter(p => p.type === ProductType.GOODS)
      .map(product => {
        // Calculate Total Imported (from POs)
        const totalImported = purchaseOrders.reduce((sum, po) => {
            const item = po.items.find(i => i.productId === product.id);
            return sum + (item ? item.quantity : 0);
        }, 0);

        // Calculate Total Exported (from Invoices - Sale & Repair)
        const totalExported = invoices.reduce((sum, inv) => {
            // Ignore cancelled invoices
            if(inv.status === 'CANCELLED' || inv.repairStatus === 'CANCELLED') return sum;
            
            const item = inv.items.find(i => i.productId === product.id);
            return sum + (item ? item.quantity : 0);
        }, 0);

        const currentStock = Object.values(product.stock).reduce((a, b) => a + b, 0);

        return {
            ...product,
            totalImported,
            totalExported,
            currentStock
        };
    });
  }, [products, invoices, purchaseOrders]);

  const handleExportExcel = () => {
    const data = reportData.map(item => ({
        SKU: item.sku,
        TenSanPham: item.name,
        DVT: item.unit,
        TongNhap: item.totalImported,
        TongXuat: item.totalExported,
        TonKho: item.currentStock,
        TriGiaTon: item.currentStock * item.costPrice
    }));
    exportToCSV(
        data, 
        ['Mã SP', 'Tên Sản Phẩm', 'ĐVT', 'Tổng Nhập', 'Tổng Xuất', 'Tồn Cuối', 'Trị Giá Tồn'],
        ['SKU', 'TenSanPham', 'DVT', 'TongNhap', 'TongXuat', 'TonKho', 'TriGiaTon'],
        'Bao_Cao_Ton_Kho'
    );
  };

  const handlePrintReport = () => {
      const w = window.open('', '_blank');
      if(w) {
          w.document.write(generateStockReportHTML(reportData, systemSettings));
          w.document.close();
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Báo cáo Xuất - Nhập - Tồn</h1>
                <p className="text-slate-500 text-sm">Tổng hợp biến động kho hàng hóa</p>
            </div>
            <div className="flex gap-2">
                <button onClick={handlePrintReport} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-colors">
                    <span className="material-icons-round">print</span> In Báo Cáo
                </button>
                <button onClick={handleExportExcel} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-colors">
                    <span className="material-icons-round">file_download</span> Xuất Excel
                </button>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Mã SP</th>
                        <th className="px-6 py-4">Tên Sản Phẩm</th>
                        <th className="px-6 py-4 text-center">ĐVT</th>
                        <th className="px-6 py-4 text-center text-blue-600 bg-blue-50/30">Tổng Nhập</th>
                        <th className="px-6 py-4 text-center text-orange-600 bg-orange-50/30">Tổng Xuất</th>
                        <th className="px-6 py-4 text-center text-green-600 bg-green-50/30">Tồn Cuối</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                    {reportData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-500">{item.sku}</td>
                            <td className="px-6 py-4 font-semibold text-slate-800">{item.name}</td>
                            <td className="px-6 py-4 text-center text-slate-500">{item.unit}</td>
                            <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/10">{item.totalImported}</td>
                            <td className="px-6 py-4 text-center font-bold text-orange-600 bg-orange-50/10">{item.totalExported}</td>
                            <td className="px-6 py-4 text-center font-bold text-green-700 bg-green-50/10">{item.currentStock}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {reportData.length === 0 && (
                <div className="p-8 text-center text-slate-400">Không có dữ liệu hàng hóa.</div>
            )}
        </div>
    </div>
  );
};

export default StockReport;

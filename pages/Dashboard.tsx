import React, { useEffect, useState } from 'react';
import { Invoice, Warehouse } from '../types';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyzeBusinessHealth } from '../services/geminiService';

interface DashboardProps {
  invoices: Invoice[];
}

const Dashboard: React.FC<DashboardProps> = ({ invoices }) => {
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Calculate stats
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalDebt = invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
  const totalOrders = invoices.length;

  const tayPhatRevenue = invoices
    .filter((inv) => inv.warehouse === Warehouse.TAY_PHAT)
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const tncRevenue = invoices
    .filter((inv) => inv.warehouse === Warehouse.TNC)
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const data = [
    { name: 'Tây Phát', revenue: tayPhatRevenue },
    { name: 'TNC', revenue: tncRevenue },
  ];

  useEffect(() => {
    // Only call AI if we haven't fetched advice yet to avoid loop/cost
    if (!aiAdvice && invoices.length > 0) {
      setLoadingAi(true);
      analyzeBusinessHealth(invoices).then(advice => {
        setAiAdvice(advice);
        setLoadingAi(false);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, []); // Run once on mount

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tổng quan kinh doanh</h1>
          <p className="text-slate-500 text-sm">Cập nhật tình hình 2 kho và công nợ</p>
        </div>
        <button 
            onClick={() => {
                setLoadingAi(true);
                analyzeBusinessHealth(invoices).then(res => { setAiAdvice(res); setLoadingAi(false)});
            }}
            className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
            <span className="material-icons-round text-base">refresh</span> Cập nhật phân tích AI
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Doanh Thu"
          value={`${(totalRevenue / 1000000).toFixed(1)}tr`}
          subValue="VNĐ"
          icon="payments"
          color="indigo"
        />
        <StatCard
          title="Tổng Công Nợ"
          value={`${(totalDebt / 1000000).toFixed(1)}tr`}
          subValue="Cần thu hồi gấp"
          icon="warning"
          color="red"
        />
        <StatCard
          title="Đơn hàng / Dịch vụ"
          value={totalOrders.toString()}
          subValue="Tháng này"
          icon="receipt"
          color="green"
        />
        <StatCard
          title="Hiệu suất TNC"
          value={`${(tncRevenue / 1000000).toFixed(1)}tr`}
          subValue="Doanh thu kho TNC"
          icon="store"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-6">Doanh thu theo kho</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                    cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#f97316'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <span className="material-icons-round absolute -right-4 -bottom-4 text-9xl text-white opacity-10">psychology</span>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-icons-round text-yellow-300">auto_awesome</span>
                    <h3 className="font-bold text-lg">Góc nhìn AI</h3>
                </div>
                
                {loadingAi ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-2 bg-indigo-400 rounded w-3/4"></div>
                        <div className="h-2 bg-indigo-400 rounded w-full"></div>
                        <div className="h-2 bg-indigo-400 rounded w-5/6"></div>
                    </div>
                ) : (
                    <p className="text-indigo-100 text-sm leading-relaxed whitespace-pre-line">
                        {aiAdvice || "Đang chờ dữ liệu để phân tích..."}
                    </p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
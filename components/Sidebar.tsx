
import React from 'react';
import { PageView, Employee } from '../types';

interface SidebarProps {
  currentView: PageView;
  onChangeView: (view: PageView) => void;
  currentUser: Employee;
  onSwitchUser: (employee: Employee) => void;
  employees: Employee[];
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, currentUser, onLogout }) => {
  const menuItems: { id: PageView; label: string; icon: string; roles: string[] }[] = [
    { id: 'DASHBOARD', label: 'Tổng quan', icon: 'dashboard', roles: ['ADMIN', 'SALES'] },
    { id: 'POS', label: 'Bán lẻ (POS)', icon: 'point_of_sale', roles: ['ADMIN', 'SALES'] },
    { id: 'REPAIR_TICKETS', label: 'Quản lý Sửa chữa', icon: 'build', roles: ['ADMIN', 'SALES', 'TECHNICIAN'] }, 
    { id: 'INVENTORY', label: 'Kho hàng', icon: 'inventory_2', roles: ['ADMIN', 'SALES', 'TECHNICIAN'] },
    { id: 'IMPORT_GOODS', label: 'Nhập hàng', icon: 'archive', roles: ['ADMIN', 'SALES'] },
    { id: 'STOCK_REPORT', label: 'Báo cáo X-N-T', icon: 'analytics', roles: ['ADMIN', 'SALES'] },
    { id: 'DEBT', label: 'Công nợ & Hóa đơn', icon: 'receipt_long', roles: ['ADMIN', 'SALES'] },
    { id: 'VAT_INVOICES', label: 'Hóa đơn VAT', icon: 'description', roles: ['ADMIN'] },
    { id: 'CUSTOMERS', label: 'Khách hàng', icon: 'people', roles: ['ADMIN', 'SALES'] },
    { id: 'SUPPLIERS', label: 'Nhà cung cấp', icon: 'local_shipping', roles: ['ADMIN', 'SALES'] },
    { id: 'EMPLOYEES', label: 'Nhân viên', icon: 'badge', roles: ['ADMIN'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(currentUser.role));

  const getRoleBadge = (role: string) => {
      switch(role) {
          case 'ADMIN': return 'bg-red-100 text-red-700';
          case 'TECHNICIAN': return 'bg-blue-100 text-blue-700';
          case 'SALES': return 'bg-green-100 text-green-700';
          default: return 'bg-gray-100';
      }
  }

  return (
    <div className="w-64 bg-white h-screen border-r border-slate-200 flex flex-col fixed left-0 top-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-indigo-600">
          <span className="material-icons-round text-3xl">build_circle</span>
          <span className="font-bold text-xl tracking-tight text-slate-800">ServicePro</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200
              ${currentView === item.id 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            <span className={`material-icons-round ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${getRoleBadge(currentUser.role)}`}>
                {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{currentUser.role}</p>
            </div>
        </div>
        
        <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors text-sm font-medium"
        >
            <span className="material-icons-round text-lg">logout</span>
            Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

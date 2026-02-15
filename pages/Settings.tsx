
import React, { useState } from 'react';
import { RoleDefinition, Permission, SystemSettings } from '../types';

interface SettingsProps {
    roleDefinitions: RoleDefinition[];
    onUpdateRoleDefinition: (updatedRoles: RoleDefinition[]) => void;
    systemSettings: SystemSettings;
    onUpdateSystemSettings: (settings: SystemSettings) => void;
}

const ALL_PERMISSIONS: { code: Permission; label: string; group: string }[] = [
    { code: 'VIEW_DASHBOARD', label: 'Xem Báo cáo Tổng quan', group: 'Chung' },
    { code: 'VIEW_POS', label: 'Truy cập POS Bán lẻ', group: 'Bán hàng' },
    { code: 'VIEW_REPAIR_TICKETS', label: 'Quản lý Phiếu sửa chữa', group: 'Dịch vụ' },
    { code: 'VIEW_CUSTOMERS', label: 'Quản lý Khách hàng', group: 'Bán hàng' },
    { code: 'VIEW_INVENTORY', label: 'Xem tồn kho', group: 'Kho' },
    { code: 'VIEW_IMPORT_GOODS', label: 'Nhập hàng hóa', group: 'Kho' },
    { code: 'VIEW_STOCK_REPORT', label: 'Xem Báo cáo X-N-T', group: 'Kho' },
    { code: 'VIEW_SUPPLIERS', label: 'Quản lý Nhà cung cấp', group: 'Kho' },
    { code: 'VIEW_DEBT', label: 'Quản lý Công nợ', group: 'Kế toán' },
    { code: 'VIEW_VAT_INVOICES', label: 'Quản lý Hóa đơn VAT', group: 'Kế toán' },
    { code: 'VIEW_EMPLOYEES', label: 'Quản lý Nhân viên', group: 'Hệ thống' },
    { code: 'VIEW_SETTINGS', label: 'Cấu hình Phân quyền', group: 'Hệ thống' },
    { code: 'ACTION_DELETE_DATA', label: 'Xóa dữ liệu (Nâng cao)', group: 'Hệ thống' },
    { code: 'ACTION_EDIT_PRICE', label: 'Sửa giá bán', group: 'Bán hàng' },
];

type SettingsTab = 'GENERAL' | 'PERMISSIONS' | 'PRINT_TEMPLATES';

const Settings: React.FC<SettingsProps> = ({ roleDefinitions, onUpdateRoleDefinition, systemSettings, onUpdateSystemSettings }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('GENERAL');

    // --- Permissions Logic ---
    const handleTogglePermission = (roleCode: string, permission: Permission) => {
        const updatedRoles = roleDefinitions.map(role => {
            if (role.code === roleCode) {
                if (roleCode === 'ADMIN' && permission === 'VIEW_SETTINGS') return role;
                const hasPerm = role.permissions.includes(permission);
                return {
                    ...role,
                    permissions: hasPerm 
                        ? role.permissions.filter(p => p !== permission)
                        : [...role.permissions, permission]
                };
            }
            return role;
        });
        onUpdateRoleDefinition(updatedRoles);
    };

    const groupedPermissions = ALL_PERMISSIONS.reduce((acc, perm) => {
        if (!acc[perm.group]) acc[perm.group] = [];
        acc[perm.group].push(perm);
        return acc;
    }, {} as Record<string, typeof ALL_PERMISSIONS>);

    // --- Render Content ---
    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Cài đặt Hệ thống</h1>
                    <p className="text-slate-500 text-sm">Quản lý thông tin cửa hàng, mẫu in và phân quyền</p>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-white border border-slate-200 rounded-xl overflow-hidden shrink-0 flex flex-col">
                    <button 
                        onClick={() => setActiveTab('GENERAL')}
                        className={`text-left px-6 py-4 border-b border-slate-100 flex items-center gap-3 transition-colors ${activeTab === 'GENERAL' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-l-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="material-icons-round">store</span> Thông tin Cửa hàng
                    </button>
                    <button 
                        onClick={() => setActiveTab('PRINT_TEMPLATES')}
                        className={`text-left px-6 py-4 border-b border-slate-100 flex items-center gap-3 transition-colors ${activeTab === 'PRINT_TEMPLATES' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-l-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="material-icons-round">print</span> Cấu hình Mẫu in
                    </button>
                    <button 
                        onClick={() => setActiveTab('PERMISSIONS')}
                        className={`text-left px-6 py-4 border-b border-slate-100 flex items-center gap-3 transition-colors ${activeTab === 'PERMISSIONS' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-l-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="material-icons-round">admin_panel_settings</span> Phân quyền & Vai trò
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-6 overflow-y-auto">
                    
                    {/* TAB: GENERAL */}
                    {activeTab === 'GENERAL' && (
                        <div className="space-y-6 max-w-2xl">
                            <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-4">Thông tin chung</h3>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Tên công ty / Cửa hàng</label>
                                <input 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={systemSettings.companyName}
                                    onChange={(e) => onUpdateSystemSettings({...systemSettings, companyName: e.target.value})}
                                />
                                <p className="text-xs text-slate-400 mt-1">Sẽ hiển thị trên tiêu đề hóa đơn</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Địa chỉ</label>
                                <input 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={systemSettings.companyAddress}
                                    onChange={(e) => onUpdateSystemSettings({...systemSettings, companyAddress: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Số điện thoại / Hotline</label>
                                <input 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={systemSettings.companyPhone}
                                    onChange={(e) => onUpdateSystemSettings({...systemSettings, companyPhone: e.target.value})}
                                />
                            </div>
                            <div className="pt-4">
                                <button className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-colors">
                                    Lưu Thay Đổi
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB: PRINT TEMPLATES */}
                    {activeTab === 'PRINT_TEMPLATES' && (
                        <div className="space-y-8 max-w-3xl">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-4">Hóa Đơn Bán Lẻ</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">Lời chào cuối hóa đơn (Footer)</label>
                                        <textarea 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                                            value={systemSettings.invoiceFooterNote}
                                            onChange={(e) => onUpdateSystemSettings({...systemSettings, invoiceFooterNote: e.target.value})}
                                        ></textarea>
                                        <p className="text-xs text-slate-400 mt-1">Hỗ trợ xuống dòng.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-4">Phiếu Tiếp Nhận Dịch Vụ</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">Quy định & Lưu ý (Footer)</label>
                                        <textarea 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                                            value={systemSettings.repairTicketFooterNote}
                                            onChange={(e) => onUpdateSystemSettings({...systemSettings, repairTicketFooterNote: e.target.value})}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                             <div className="pt-4">
                                <button className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-colors">
                                    Lưu Cấu Hình In
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB: PERMISSIONS */}
                    {activeTab === 'PERMISSIONS' && (
                        <div className="overflow-x-auto">
                            <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-4">Ma trận Phân quyền</h3>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 w-64">
                                            Chức năng
                                        </th>
                                        {roleDefinitions.map(role => (
                                            <th key={role.code} className="px-4 py-4 text-center min-w-[120px]">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-slate-800 text-sm">{role.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{role.code}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(groupedPermissions).map(([group, permissions]) => (
                                        <React.Fragment key={group}>
                                            <tr className="bg-slate-50/50">
                                                <td colSpan={roleDefinitions.length + 1} className="px-6 py-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                                    {group}
                                                </td>
                                            </tr>
                                            {permissions.map(perm => (
                                                <tr key={perm.code} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 text-sm font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                                                        {perm.label}
                                                    </td>
                                                    {roleDefinitions.map(role => {
                                                        const isChecked = role.permissions.includes(perm.code);
                                                        const isAdminSettings = role.code === 'ADMIN' && perm.code === 'VIEW_SETTINGS';
                                                        
                                                        return (
                                                            <td key={role.code} className="px-4 py-3 text-center">
                                                                <div className="flex justify-center">
                                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            className="sr-only peer"
                                                                            checked={isChecked}
                                                                            disabled={isAdminSettings} 
                                                                            onChange={() => handleTogglePermission(role.code, perm.code)}
                                                                        />
                                                                        <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all 
                                                                            ${isChecked 
                                                                                ? 'bg-indigo-600 peer-checked:bg-indigo-600' 
                                                                                : 'bg-slate-200'}
                                                                            ${isAdminSettings ? 'opacity-50 cursor-not-allowed' : ''}
                                                                        `}></div>
                                                                    </label>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                                <strong>Lưu ý:</strong> Quản trị viên (ADMIN) luôn có quyền truy cập vào trang Cài đặt để tránh bị khóa khỏi hệ thống.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;

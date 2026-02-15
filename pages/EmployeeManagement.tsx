
import React, { useState } from 'react';
import { Employee, Role, RoleDefinition } from '../types';

interface EmployeeManagementProps {
  employees: Employee[];
  roleDefinitions: RoleDefinition[]; 
  onAddEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, roleDefinitions, onAddEmployee, onDeleteEmployee }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmp, setNewEmp] = useState<{ name: string; username: string; role: Role; password: string }>({
    name: '',
    username: '',
    role: 'SALES',
    password: ''
  });

  const handleSave = () => {
    if (!newEmp.name || !newEmp.username || !newEmp.password) {
        alert("Vui lòng nhập đầy đủ Tên, Username và Mật khẩu!");
        return;
    }
    
    // Check if username exists
    if (employees.some(e => e.username === newEmp.username)) {
        alert("Tên đăng nhập này đã tồn tại!");
        return;
    }

    onAddEmployee({
      id: `emp-${Date.now()}`,
      ...newEmp
    });
    setIsModalOpen(false);
    setNewEmp({ name: '', username: '', role: 'SALES', password: '' });
  };

  const getRoleName = (code: string) => {
      const def = roleDefinitions.find(r => r.code === code);
      return def ? def.name : code;
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Nhân viên</h1>
          <p className="text-slate-500 text-sm">Phân quyền và quản lý tài khoản</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Tìm nhân viên..." 
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            <span className="material-icons-round">person_add</span> Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => (
          <div key={emp.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div className="flex gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-slate-100 text-slate-600`}>
                {emp.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{emp.name}</h3>
                <p className="text-sm text-slate-500">@{emp.username}</p>
                <div className="flex gap-2 mt-2">
                     <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-700 border-slate-200">
                       {getRoleName(emp.role)}
                     </span>
                </div>
              </div>
            </div>
            {emp.role !== 'ADMIN' && (
                <button 
                    onClick={() => { if(window.confirm('Xóa nhân viên này?')) onDeleteEmployee(emp.id) }}
                    className="text-slate-400 hover:text-red-500"
                >
                    <span className="material-icons-round">delete</span>
                </button>
            )}
          </div>
        ))}
        {filteredEmployees.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-400">
                Không tìm thấy nhân viên nào phù hợp.
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-lg border-b border-slate-100 pb-2">Thêm nhân viên mới</h3>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Họ tên nhân viên</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={newEmp.name} 
                onChange={e => setNewEmp({...newEmp, name: e.target.value})} 
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Tên đăng nhập</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={newEmp.username} 
                onChange={e => setNewEmp({...newEmp, username: e.target.value})} 
                placeholder="VD: nv_banhang"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu</label>
              <input 
                type="password" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={newEmp.password} 
                onChange={e => setNewEmp({...newEmp, password: e.target.value})} 
                placeholder="******"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Vai trò (Phân quyền)</label>
              <select 
                className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={newEmp.role} 
                onChange={e => setNewEmp({...newEmp, role: e.target.value as Role})}
              >
                  {roleDefinitions.map(role => (
                      <option key={role.code} value={role.code}>{role.name}</option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2 mt-4 border-t border-slate-100">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded transition-colors">Hủy</button>
              <button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded transition-colors shadow-lg shadow-indigo-200">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;

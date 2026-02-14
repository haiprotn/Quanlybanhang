
import React, { useState } from 'react';
import { Employee, Role } from '../types';

interface EmployeeManagementProps {
  employees: Employee[];
  onAddEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, onAddEmployee, onDeleteEmployee }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState<{ name: string; username: string; role: Role }>({
    name: '',
    username: '',
    role: 'SALES'
  });

  const handleSave = () => {
    if (!newEmp.name || !newEmp.username) return;
    onAddEmployee({
      id: `emp-${Date.now()}`,
      ...newEmp
    });
    setIsModalOpen(false);
    setNewEmp({ name: '', username: '', role: 'SALES' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Nhân viên</h1>
          <p className="text-slate-500 text-sm">Phân quyền và quản lý tài khoản</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <span className="material-icons-round">person_add</span> Thêm nhân viên
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div className="flex gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                ${emp.role === 'ADMIN' ? 'bg-red-100 text-red-600' : 
                  emp.role === 'TECHNICIAN' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
              `}>
                {emp.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{emp.name}</h3>
                <p className="text-sm text-slate-500">@{emp.username}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                   ${emp.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-100' : 
                     emp.role === 'TECHNICIAN' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}
                `}>
                  {emp.role}
                </span>
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-lg">Thêm nhân viên</h3>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Họ tên</label>
              <input type="text" className="w-full border p-2 rounded" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Tên đăng nhập</label>
              <input type="text" className="w-full border p-2 rounded" value={newEmp.username} onChange={e => setNewEmp({...newEmp, username: e.target.value})} />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Vai trò</label>
              <select className="w-full border p-2 rounded" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value as Role})}>
                <option value="SALES">Nhân viên Bán hàng</option>
                <option value="TECHNICIAN">Kỹ thuật viên</option>
                <option value="ADMIN">Quản lý (Admin)</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded">Hủy</button>
              <button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;

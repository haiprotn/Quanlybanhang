
import React, { useState } from 'react';
import { Employee } from '../types';

interface LoginProps {
  employees: Employee[];
  onLogin: (employee: Employee) => void;
}

const Login: React.FC<LoginProps> = ({ employees, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication
    const user = employees.find(emp => emp.username === username);
    
    // In a real app, check password hash. Here we just accept any password for demo if user exists
    // Or simulate a specific password like '123'
    if (user && password === '123') {
      onLogin(user);
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng (Mặc định: 123)');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
        <div className="w-full p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <span className="material-icons-round text-3xl">build_circle</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">ServicePro</h1>
            <p className="text-slate-500 text-sm mt-2">Đăng nhập hệ thống quản lý</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên đăng nhập</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="admin, sales, tech..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mật khẩu</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••"
              />
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              Đăng nhập
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">Tài khoản demo: admin / sales / tech</p>
            <p className="text-xs text-slate-400">Mật khẩu: 123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: string;
  color: 'indigo' | 'green' | 'red' | 'orange';
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  orange: 'bg-orange-50 text-orange-600',
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorMap[color]}`}>
        <span className="material-icons-round">{icon}</span>
      </div>
    </div>
  );
};

export default StatCard;
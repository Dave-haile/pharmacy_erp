
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendColor, colorClass }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
      <div className={`p-4 rounded-lg ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {trend && (
          <p className={`text-xs mt-1 font-semibold ${trendColor}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;

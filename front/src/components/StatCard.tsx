
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
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center space-x-3">
      <div className={`p-2.5 rounded-md ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <h3 className="text-lg font-bold text-slate-800">{value}</h3>
        {trend && (
          <p className={`text-[10px] mt-0.5 font-semibold ${trendColor}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;

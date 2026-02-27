
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
    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-2.5 transition-colors">
      <div className={`p-2 rounded-md ${colorClass} dark:bg-opacity-10`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{value}</h3>
        {trend && (
          <p className={`text-[9px] mt-0.5 font-semibold ${trendColor}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
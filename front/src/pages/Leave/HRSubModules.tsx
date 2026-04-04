import React from "react";
import {
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HRModulePlaceholderProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const HRModulePlaceholder: React.FC<HRModulePlaceholderProps> = ({
  title,
  icon,
  description,
  color,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/hr")}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
        <div
          className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 border border-${color}-500/20 shadow-lg shadow-${color}-500/5`}
        >
          {icon}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Pending Requests",
            value: "12",
            icon: Clock3,
            status: "warning",
          },
          {
            label: "Approved Today",
            value: "45",
            icon: CheckCircle2,
            status: "success",
          },
          {
            label: "Requires Attention",
            value: "3",
            icon: AlertCircle,
            status: "danger",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {stat.label}
              </span>
              <stat.icon
                size={16}
                className={
                  stat.status === "success"
                    ? "text-emerald-500"
                    : stat.status === "warning"
                      ? "text-amber-500"
                      : "text-rose-500"
                }
              />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Placeholder */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center p-10">
        <div
          className={`w-20 h-20 rounded-3xl bg-${color}-500/10 flex items-center justify-center text-${color}-600 dark:text-${color}-400 mb-6`}
        >
          {React.cloneElement(icon as React.ReactElement, { size: 40 })}
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          {title} Dashboard
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
          This module is currently being integrated with the core ERP system.
          You will soon be able to manage {title.toLowerCase()} directly from
          here.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg">
            View Reports
          </button>
          <button className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            Module Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export const LeaveManagement: React.FC = () => (
  <HRModulePlaceholder
    title="Leave Management"
    icon={<Calendar size={24} />}
    description="Track and manage employee time-off requests"
    color="blue"
  />
);

export const Attendance: React.FC = () => (
  <HRModulePlaceholder
    title="Attendance Tracking"
    icon={<Clock size={24} />}
    description="Monitor daily attendance and work hours"
    color="emerald"
  />
);

export const Performance: React.FC = () => (
  <HRModulePlaceholder
    title="Performance Review"
    icon={<TrendingUp size={24} />}
    description="Evaluate and track employee growth and goals"
    color="purple"
  />
);

export const Payroll: React.FC = () => (
  <HRModulePlaceholder
    title="Payroll Processing"
    icon={<DollarSign size={24} />}
    description="Manage salaries, bonuses, and tax deductions"
    color="rose"
  />
);

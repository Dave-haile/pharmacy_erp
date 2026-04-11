import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";

const employeeDistribution = [
  { department: "Production", count: 45 },
  { department: "Quality Control", count: 28 },
  { department: "R&D", count: 12 },
  { department: "Sales", count: 34 },
  { department: "HR & Admin", count: 8 },
];

const hiringTrend = [
  { month: "Jan", count: 5 },
  { month: "Feb", count: 8 },
  { month: "Mar", count: 4 },
  { month: "Apr", count: 11 },
  { month: "May", count: 14 },
  { month: "Jun", count: 9 },
];

const attendanceStats = [
  { name: "Present", value: 85, color: "#10b981" },
  { name: "On Leave", value: 10, color: "#3b82f6" },
  { name: "Absent", value: 5, color: "#ef4444" },
];

interface LinkItem {
  label: string;
  path: string;
  highlighted?: boolean;
  active?: boolean;
  icon?: React.ReactNode;
}

interface SectionProps {
  title: string;
  subtitle: string;
  accentColor: string;
  icon: React.ReactNode;
  links: LinkItem[];
}

const CategorySection: React.FC<SectionProps> = ({
  title,
  subtitle,
  accentColor,
  icon,
  links,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center space-x-2.5">
          <div
            className={`p-1.5 rounded-lg ${accentColor} text-white shadow-sm`}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, {
                  size: 16,
                })
              : icon}
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-0.5">
              {title}
            </h2>
            <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
        {links.map((link, idx) => (
          <button
            key={idx}
            onClick={() => link.path !== "#" && navigate(link.path)}
            className="w-full group flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div
                className={`w-1 h-1 rounded-full shrink-0 transition-all duration-300 ${
                  link.highlighted
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    : "bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400"
                }`}
              />
              <div className="flex flex-col">
                <span
                  className={`text-[11px] font-bold tracking-tight transition-colors ${
                    link.active
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                  }`}
                >
                  {link.label}
                </span>
                {link.highlighted && (
                  <span className="text-[7px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-tighter -mt-0.5">
                    Verified Module
                  </span>
                )}
              </div>
            </div>

            <div className="text-slate-300 dark:text-slate-700 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const HRHub: React.FC = () => {
  const sections: SectionProps[] = [
    {
      title: "Employee Lifecycle",
      subtitle: "Onboarding & Records",
      accentColor: "bg-blue-500",
      icon: <Users />,
      links: [
        {
          label: "Employee Directory",
          path: "/hr/employees",
          highlighted: true,
        },
        {
          label: "Department Registry",
          path: "/hr/departments",
          highlighted: true,
        },
        {
          label: "New Department",
          path: "/hr/departments/new",
          highlighted: true,
        },
        {
          label: "New Employee Onboarding",
          path: "/hr/employees/new",
          highlighted: true,
        },
        { label: "Employee Designations", path: "/hr/designations", highlighted: true },
        {
          label: "Department Structure",
          path: "/hr/departments",
          active: true,
        },
        { label: "Employee Transfers", path: "#" },
        { label: "Promotion Management", path: "#" },
        { label: "Separation / Termination", path: "#" },
        { label: "Employee Grievances", path: "#" },
      ],
    },
    {
      title: "Attendance & Leave",
      subtitle: "Time Tracking & Absence",
      accentColor: "bg-emerald-500",
      icon: <Calendar />,
      links: [
        {
          label: "Daily Attendance",
          path: "/hr/attendance",
          highlighted: true,
        },
        { label: "Leave Applications", path: "/hr/leave", highlighted: true },
        { label: "Leave Allocation", path: "/hr/leave", highlighted: true },
        { label: "Leave Type", path: "/hr/leave-types", highlighted: true },
        { label: "Holiday List", path: "#", active: true },
        { label: "Shift Management", path: "#" },
        { label: "Overtime Requests", path: "#" },
        { label: "Attendance Reports", path: "/hr/attendance" },
      ],
    },
    {
      title: "Payroll & Benefits",
      subtitle: "Compensation & Tax",
      accentColor: "bg-amber-500",
      icon: <DollarSign />,
      links: [
        { label: "Salary Structures", path: "#", highlighted: true },
        { label: "Payroll Processing", path: "/hr/payroll", highlighted: true },
        { label: "Salary Slips", path: "#", highlighted: true },
        { label: "Bonus & Incentives", path: "#" },
        { label: "Tax Declarations", path: "#" },
        { label: "Employee Benefits", path: "#" },
        { label: "Expense Claims", path: "#" },
      ],
    },
    {
      title: "Performance & Growth",
      subtitle: "Reviews & Training",
      accentColor: "bg-purple-500",
      icon: <TrendingUp />,
      links: [
        {
          label: "Performance Reviews",
          path: "/hr/performance",
          highlighted: true,
        },
        { label: "Goal Tracking", path: "/hr/performance", highlighted: true },
        { label: "Training Programs", path: "#" },
        { label: "Skill Matrix", path: "#" },
        { label: "Feedback System", path: "#" },
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <header className="relative py-6 md:py-10 flex flex-col items-center text-center overflow-hidden border-b border-slate-200 dark:border-slate-800 -mx-2.5 md:-mx-5 px-2.5 md:px-5 mb-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-slate-50 dark:bg-slate-900/20 -z-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] rounded-full -z-10" />

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Human Capital Management
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
          HR Operations{" "}
          <span className="text-blue-600 dark:text-blue-400">Hub</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl animate-in slide-in-from-top duration-1000">
          <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Department Distribution
              </h3>
              <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                +2 New
              </span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeDistribution}>
                  <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <XAxis dataKey="department" hide />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "8px",
                      backgroundColor: "#0f172a",
                      color: "#fff",
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Hiring Trend
              </h3>
              <span className="text-[8px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full">
                Growth
              </span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hiringTrend}>
                  <defs>
                    <linearGradient id="hiringGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#hiringGrad)"
                  />
                  <XAxis dataKey="month" hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "8px",
                      backgroundColor: "#0f172a",
                      color: "#fff",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm flex items-center">
            <div className="flex-1">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Today's Attendance
              </h3>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceStats}
                      innerRadius={22}
                      outerRadius={38}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {attendanceStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        fontSize: "8px",
                        backgroundColor: "#0f172a",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-1.5 ml-2 pr-2">
              {attendanceStats.map((item) => (
                <div key={item.name} className="flex items-center space-x-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate w-14 leading-none">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-1.5">
        {sections.map((section, idx) => (
          <CategorySection key={idx} {...section} />
        ))}
      </div>

      <footer className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-900 dark:bg-slate-900/80 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />

          <div className="space-y-1.5 relative z-10 text-center md:text-left">
            <div className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[8px] font-black uppercase tracking-widest mb-2">
              Strategic HR
            </div>
            <h3 className="text-xl font-black tracking-tight">
              Optimize Your Workforce
            </h3>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              Use AI to predict employee churn, identify skill gaps, and
              automate payroll compliance across all departments.
            </p>
          </div>

          <button className="relative z-10 bg-white text-slate-900 hover:bg-slate-100 font-black px-8 py-3 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95 whitespace-nowrap text-xs uppercase tracking-wider">
            Employee Analytics
          </button>
        </div>
      </footer>
    </div>
  );
};

export default HRHub;

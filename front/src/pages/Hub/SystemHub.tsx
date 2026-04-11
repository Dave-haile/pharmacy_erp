// import React from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   BookOpenCheck,
//   Database,
//   FileSpreadsheet,
//   PackageSearch,
//   Settings,
//   ShieldCheck,
//   Users,
// } from "lucide-react";

// interface LinkItem {
//   label: string;
//   path: string;
//   highlighted?: boolean;
//   active?: boolean;
// }

// interface SectionProps {
//   title: string;
//   subtitle: string;
//   accentColor: string;
//   icon: React.ReactNode;
//   links: LinkItem[];
// }

// const CategorySection: React.FC<SectionProps> = ({
//   title,
//   subtitle,
//   accentColor,
//   icon,
//   links,
// }) => {
//   const navigate = useNavigate();

//   return (
//     <div className="flex flex-col h-full bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
//       <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
//         <div className="flex items-center space-x-2.5">
//           <div
//             className={`p-1.5 rounded-lg ${accentColor} text-white shadow-sm`}
//           >
//             {React.cloneElement(icon as React.ReactElement, { size: 16 })}
//           </div>
//           <div>
//             <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-0.5">
//               {title}
//             </h2>
//             <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
//               {subtitle}
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
//         {links.map((link, idx) => (
//           <button
//             key={idx}
//             onClick={() => link.path !== "#" && navigate(link.path)}
//             className="w-full group flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 text-left"
//           >
//             <div className="flex items-center space-x-3 overflow-hidden">
//               <div
//                 className={`w-1 h-1 rounded-full shrink-0 transition-all duration-300 ${
//                   link.highlighted
//                     ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
//                     : "bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400"
//                 }`}
//               />
//               <div className="flex flex-col">
//                 <span
//                   className={`text-[11px] font-bold tracking-tight transition-colors ${
//                     link.active
//                       ? "text-emerald-600 dark:text-emerald-400"
//                       : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
//                   }`}
//                 >
//                   {link.label}
//                 </span>
//                 {link.highlighted && (
//                   <span className="text-[7px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-tighter -mt-0.5">
//                     Available Now
//                   </span>
//                 )}
//               </div>
//             </div>

//             <div className="text-slate-300 dark:text-slate-700 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5">
//               <svg
//                 className="w-3 h-3"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2.5"
//                   d="M9 5l7 7-7 7"
//                 />
//               </svg>
//             </div>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

// const SystemHub: React.FC = () => {
//   const navigate = useNavigate();

//   const sections: SectionProps[] = [
//     {
//       title: "Access & Security",
//       subtitle: "Users, Roles & Control",
//       accentColor: "bg-rose-500",
//       icon: <Users />,
//       links: [
//         { label: "User Management", path: "/users", highlighted: true },
//         { label: "Create User", path: "/users/new", highlighted: true },
//         { label: "Audit Logs", path: "/audit-logs", highlighted: true },
//       ],
//     },
//     {
//       title: "Data Operations",
//       subtitle: "Imports & Master Setup",
//       accentColor: "bg-emerald-500",
//       icon: <Database />,
//       links: [
//         {
//           label: "Data Import",
//           path: "/system/data-import",
//           highlighted: true,
//         },
//         {
//           label: "Medicine Import",
//           path: "/inventory/medicines/import",
//           highlighted: true,
//         },
//         {
//           label: "Create Medicine",
//           path: "/inventory/medicines/new-medicine",
//           highlighted: true,
//         },
//         {
//           label: "Category Registry",
//           path: "/inventory/categories",
//           highlighted: true,
//         },
//         {
//           label: "Supplier Registry",
//           path: "/inventory/suppliers",
//           highlighted: true,
//         },
//       ],
//     },
//     {
//       title: "Inventory Governance",
//       subtitle: "Control & Review",
//       accentColor: "bg-amber-500",
//       icon: <ShieldCheck />,
//       links: [
//         {
//           label: "Table Registry",
//           path: "/system/table-registry",
//           highlighted: true,
//         },
//         {
//           label: "Inventory Control",
//           path: "/inventory/control",
//           highlighted: true,
//         },
//         {
//           label: "Stock Ledger",
//           path: "/inventory/stock-ledger",
//           highlighted: true,
//         },
//         {
//           label: "Stock Adjustments",
//           path: "/inventory/stock-adjustments",
//           highlighted: true,
//         },
//         {
//           label: "Inventory Hub",
//           path: "/inventory",
//           active: true,
//         },
//       ],
//     },
//   ];

//   const systemStats = [
//     {
//       label: "Security",
//       value: "Users & Logs",
//       note: "Manage access and monitor system activity.",
//       icon: <Settings className="w-4 h-4" />,
//       tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
//     },
//     {
//       label: "Imports",
//       value: "Bulk Setup",
//       note: "Open master-data import and creation workflows.",
//       icon: <FileSpreadsheet className="w-4 h-4" />,
//       tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
//     },
//     {
//       label: "Oversight",
//       value: "Control Center",
//       note: "Jump into inventory controls and system-level tools.",
//       icon: <PackageSearch className="w-4 h-4" />,
//       tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
//     },
//   ];

//   return (
//     <div className="space-y-8 animate-in fade-in duration-700 pb-12">
//       <header className="relative py-6 md:py-10 flex flex-col items-center text-center overflow-hidden border-b border-slate-200 dark:border-slate-800 -mx-2.5 md:-mx-5 px-2.5 md:px-5 mb-6">
//         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-slate-50 dark:bg-slate-900/20 -z-20" />
//         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[640px] h-[320px] bg-rose-500/5 dark:bg-rose-500/10 blur-[100px] rounded-full -z-10" />

//         <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
//           <span className="relative flex h-1.5 w-1.5">
//             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
//             <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
//           </span>
//           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
//             Platform Administration
//           </span>
//         </div>

//         <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
//           System <span className="text-rose-600 dark:text-rose-400">Hub</span>
//         </h1>

//         <p className="max-w-3xl text-sm md:text-base font-medium text-slate-600 dark:text-slate-300 mb-6">
//           Central access point for user administration, data imports, audit
//           review, and other system-level workflows.
//         </p>

//         <div className="flex flex-wrap justify-center gap-2">
//           <button
//             onClick={() => navigate("/users")}
//             className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-rose-600 active:scale-95"
//           >
//             <Users className="w-3.5 h-3.5" />
//             Open Users
//           </button>
//           <button
//             onClick={() => navigate("/inventory/medicines/import")}
//             className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
//           >
//             <BookOpenCheck className="w-3.5 h-3.5" />
//             Open Imports
//           </button>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mt-8 animate-in slide-in-from-top duration-1000">
//           {systemStats.map((stat) => (
//             <div
//               key={stat.label}
//               className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm text-left"
//             >
//               <div className="flex items-center justify-between mb-3">
//                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
//                   {stat.label}
//                 </span>
//                 <div className={`rounded-lg p-2 ${stat.tone}`}>{stat.icon}</div>
//               </div>
//               <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
//                 {stat.value}
//               </h3>
//               <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
//                 {stat.note}
//               </p>
//             </div>
//           ))}
//         </div>
//       </header>

//       <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
//         {sections.map((section) => (
//           <CategorySection key={section.title} {...section} />
//         ))}
//       </section>
//     </div>
//   );
// };

// export default SystemHub;

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Settings,
  Activity,
  Database,
  Terminal,
  Server,
  Users,
  ShieldCheck,
} from "lucide-react";

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
            {React.cloneElement(icon as React.ReactElement, {
              className: "w-4 h-4",
            })}
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

const SystemHub: React.FC = () => {
  const sections: SectionProps[] = [
    {
      title: "Access & Security",
      subtitle: "Users, Roles & Control",
      accentColor: "bg-rose-500",
      icon: <Users />,
      links: [
        { label: "User Management", path: "/system/users", highlighted: true },
        { label: "Create User", path: "/system/users/new", highlighted: true },
        { label: "Role Permissions", path: "#" },
        { label: "API Keys", path: "#" },
        { label: "Security Settings", path: "#" },
        { label: "Active Sessions", path: "#" },
        { label: "Two-Factor Auth", path: "#" },
      ],
    },
    {
      title: "Data Operations",
      subtitle: "Imports & Master Setup",
      accentColor: "bg-emerald-500",
      icon: <Database />,
      links: [
        {
          label: "Data Import",
          path: "/system/data-import",
          highlighted: true,
        },
        {
          label: "Table Registry",
          path: "/system/table-registry",
          highlighted: true,
        },
        {
          label: "Medicine Import",
          path: "/inventory/medicines/import",
          highlighted: true,
        },
        { label: "Print Formats", path: "#", highlighted: true },
        { label: "Naming Series", path: "#" },
        {
          label: "Global Settings",
          path: "/system/settings",
          highlighted: true,
        },
        { label: "Email Configuration", path: "#" },
        { label: "System Notifications", path: "#" },
        { label: "Localization", path: "#" },
      ],
    },
    {
      title: "Logs & Monitoring",
      subtitle: "Audits & Health",
      accentColor: "bg-rose-600",
      icon: <Activity />,
      links: [
        { label: "Audit Logs", path: "/audit-logs", highlighted: true },
        { label: "Error Logs", path: "#" },
        { label: "System Health", path: "#" },
        { label: "Backup & Restore", path: "#" },
        { label: "Data Export", path: "#" },
        { label: "Version Info", path: "#" },
      ],
    },
    {
      title: "Inventory Governance",
      subtitle: "Control & Review",
      accentColor: "bg-amber-500",
      icon: <ShieldCheck />,
      links: [
        {
          label: "Inventory Control",
          path: "/inventory/control",
          highlighted: true,
        },
        {
          label: "Stock Ledger",
          path: "/inventory/stock-ledger",
          highlighted: true,
        },
        {
          label: "Stock Adjustments",
          path: "/inventory/stock-adjustments",
          highlighted: true,
        },
        {
          label: "Inventory Hub",
          path: "/inventory",
          active: true,
        },
      ],
    },
  ];

  // const sections: SectionProps[] = [
  //   {
  //     title: 'User Access & Security',
  //     subtitle: 'Identity & Permissions',
  //     accentColor: 'bg-indigo-600',
  //     icon: <Shield />,
  //     links: [
  //       { label: 'User Management', path: '/system/users', highlighted: true },
  //       { label: 'Role Permissions', path: '#' },
  //       { label: 'API Keys', path: '#' },
  //       { label: 'Security Settings', path: '#' },
  //       { label: 'Active Sessions', path: '#' },
  //       { label: 'Two-Factor Auth', path: '#' },
  //     ]
  //   },
  //   {
  //     title: 'System Configuration',
  //     subtitle: 'Global Preferences',
  //     accentColor: 'bg-emerald-600',
  //     icon: <Settings />,
  //     links: [
  //       { label: 'Table Registrar', path: '/system/table-registrar', highlighted: true },
  //       { label: 'Data Import', path: '/system/data-import', highlighted: true },
  //       { label: 'Print Formats', path: '#', highlighted: true },
  //       { label: 'Naming Series', path: '#' },
  //       { label: 'Global Settings', path: '/system/settings', highlighted: true },
  //       { label: 'Email Configuration', path: '#' },
  //       { label: 'System Notifications', path: '#' },
  //       { label: 'Localization', path: '#' },
  //     ]
  //   },
  //   {
  //     title: 'Logs & Monitoring',
  //     subtitle: 'Audits & Health',
  //     accentColor: 'bg-rose-600',
  //     icon: <Activity />,
  //     links: [
  //       { label: 'Audit Logs', path: '/audit-logs', highlighted: true },
  //       { label: 'Error Logs', path: '#' },
  //       { label: 'System Health', path: '#' },
  //       { label: 'Backup & Restore', path: '#' },
  //       { label: 'Data Export', path: '#' },
  //       { label: 'Version Info', path: '#' },
  //     ]
  //   }
  // ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <header className="relative py-6 md:py-10 flex flex-col items-center text-center overflow-hidden border-b border-slate-200 dark:border-slate-800 -mx-2.5 md:-mx-5 px-2.5 md:px-5 mb-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-slate-50 dark:bg-slate-900/20 -z-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] rounded-full -z-10" />

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
          <Server className="w-3 h-3 text-indigo-500" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            System Administration Hub
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
          System{" "}
          <span className="text-indigo-600 dark:text-indigo-400">
            Management
          </span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl mx-auto">
          Configure global parameters, manage user access, and monitor
          system-wide activity logs from a centralized control panel.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-1.5">
        {sections.map((section, idx) => (
          <CategorySection key={idx} {...section} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              System Console
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Execute administrative commands and scripts.
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Database Manager
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitor database performance and optimize tables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHub;

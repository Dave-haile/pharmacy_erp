import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  subItems?: { path: string; label: string; icon: string }[];
}
const navItems: NavItem[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    path: "/inventory",
    label: "Inventory",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    subItems: [
      {
        path: "/inventory",
        label: "Inventory Hub",
        icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
      },
      {
        path: "/inventory/control",
        label: "Stock Control",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      },
      {
        path: "/inventory/items",
        label: "Item Master",
        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      },
      {
        path: "/inventory/stock-entry",
        label: "Stock Entry",
        icon: "M12 4v16m8-8H4",
      },
      {
        path: "/inventory/stock-ledger",
        label: "Stock Ledger",
        icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      },
      {
        path: "/inventory/suppliers",
        label: "Supplier Registry",
        icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-10a4 4 0 100-8 4 4 0 000 8zM9 7a4 4 0 11-8 0 4 4 0 018 0z",
      },
    ],
  },
  {
    path: "/sales",
    label: "Sales",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    subItems: [
      {
        path: "/sales",
        label: "Sales Hub",
        icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      },
      { path: "/sales/new", label: "New Sale", icon: "M12 4v16m8-8H4" },
      {
        path: "/sales/history",
        label: "Sales History",
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      },
    ],
  },
  {
    path: "/hr",
    label: "Human Resources",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    subItems: [
      {
        path: "/hr",
        label: "HR Dashboard",
        icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM9 9h6M9 13h6M9 17h3",
      },
      {
        path: "/hr/employees",
        label: "Employees",
        icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-10a4 4 0 100-8 4 4 0 000 8zM9 7a4 4 0 11-8 0 4 4 0 018 0z",
      },
      {
        path: "/hr/leave",
        label: "Leave Management",
        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z",
      },
      {
        path: "/hr/attendance",
        label: "Attendance",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      },
      {
        path: "/hr/performance",
        label: "Performance",
        icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      },
      {
        path: "/hr/payroll",
        label: "Payroll",
        icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
    ],
  },
  {
    path: "/users",
    label: "User Management",
    icon: "M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m12 0H7m6-10a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    path: "/audit-logs",
    label: "Audit Logs",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    path: "/ai-insights",
    label: "AI Risk Analyzer",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-1.03 0-1.9-.4-2.593-.912l-.547-.547z",
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  toggleCollapse,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const sidebarClasses = `
    fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 flex flex-col border-r border-slate-200 dark:border-none shadow-xl z-50 transition-all duration-300
    ${isCollapsed ? "w-14" : "w-48"}
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={sidebarClasses}>
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div
              className="bg-emerald-500 p-1 rounded-lg shrink-0 cursor-pointer"
              onClick={() => {
                navigate("/");
              }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.675.337a4 4 0 01-2.574.345l-2.387-.477a2 2 0 00-1.022.547l-1.113 1.113a2 2 0 00.586 3.414l5.051.754a4 4 0 001.49-.035l5.051-.754a2 2 0 00.586-3.414l-1.113-1.113z"
                />
              </svg>
            </div>
            {!isCollapsed && (
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                PharmaFlow
              </span>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft
              className={`w-5 h-5 text-slate-400 dark:text-slate-600 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.subItems && location.pathname.startsWith(item.path));
            const isExpanded = expandedMenus.includes(item.label);
            // {navItems.map((item) => {
            //   const isActive =
            //     location.pathname === item.path ||
            //     (item.path !== "/" &&
            //       location.pathname.startsWith(`${item.path}/`));
            // return (
            //   <Link
            //     key={item.path}
            //     to={item.path}
            //     onClick={() => setIsMobileOpen(false)}
            //     title={isCollapsed ? item.label : ""}
            //     className={`flex items-center rounded-lg transition-all duration-200 group relative ${
            //       isCollapsed
            //         ? "justify-center p-1.5"
            //         : "space-x-2 px-2.5 py-1.5"
            //     } ${
            //       isActive
            //         ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
            //         : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            //     }`}
            //   >
            //     <svg
            //       className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}
            //       fill="none"
            //       stroke="currentColor"
            //       viewBox="0 0 24 24"
            //     >
            //       <path
            //         strokeLinecap="round"
            //         strokeLinejoin="round"
            //         strokeWidth="2"
            //         d={item.icon}
            //       />
            //     </svg>
            //     {!isCollapsed && (
            //       <span className="text-xs font-medium whitespace-nowrap">
            //         {item.label}
            //       </span>
            //     )}

            //     {isCollapsed && isActive && (
            //       <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
            //     )}
            //   </Link>
            // );
            return (
              <div key={item.path} className="space-y-0.5">
                {item.subItems && !isCollapsed ? (
                  <div
                    className={`flex items-center rounded-lg transition-all duration-200 group relative ${
                      isActive
                        ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className="flex-1 flex items-center space-x-2 px-1 py-1.5"
                    >
                      <svg
                        className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d={item.icon}
                        />
                      </svg>
                      <span className="text-xs font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                    </Link>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className="p-1.5 ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors z-10"
                    >
                      <svg
                        className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    title={isCollapsed ? item.label : ""}
                    className={`flex items-center rounded-lg transition-all duration-200 group relative ${
                      isCollapsed
                        ? "justify-center p-1.5"
                        : "space-x-2 px-2.5 py-1.5"
                    } ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d={item.icon}
                      />
                    </svg>
                    {!isCollapsed && (
                      <span className="text-xs font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                    )}

                    {isCollapsed && isActive && (
                      <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                    )}
                  </Link>
                )}

                {/* Sub-items */}
                {item.subItems && isExpanded && !isCollapsed && (
                  <div className="ml-6 space-y-0.5 border-l border-slate-200 dark:border-slate-800 pl-2 py-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                            isSubActive
                              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                              : "text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <svg
                            className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d={subItem.icon}
                            />
                          </svg>
                          <span>{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-2.5 py-1.5">
          {/* <div
            className={`bg-slate-100 dark:bg-slate-800/50 rounded-lg p-0.5 flex items-center ${isCollapsed ? "flex-col space-y-0.5" : "space-x-0.5"}`}
          >
            <button
              onClick={() => setTheme("light")}
              title="Light Mode"
              className={`flex-1 flex items-center justify-center p-1 rounded-md transition-all ${
                theme === "light"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
              {!isCollapsed && (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider">
                  Light
                </span>
              )}
            </button>
            <button
              onClick={() => setTheme("dark")}
              title="Dark Mode"
              className={`flex-1 flex items-center justify-center p-1 rounded-md transition-all ${
                theme === "dark"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
              {!isCollapsed && (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider">
                  Dark
                </span>
              )}
            </button>
            <button
              onClick={() => setTheme("system")}
              title="System Theme"
              className={`flex-1 flex items-center justify-center p-1 rounded-md transition-all ${
                theme === "system"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {!isCollapsed && (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider">
                  Auto
                </span>
              )}
            </button>
          </div> */}
        </div>

        <div
          className={`p-2.5 border-t border-slate-200 dark:border-slate-800 ${isCollapsed ? "flex justify-center" : ""}`}
        >
          <div
            className={`bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center transition-all ${isCollapsed ? "p-1" : "p-2.5 space-x-2"}`}
          >
            <img
              src="https://picsum.photos/28/28"
              className="w-7 h-7 rounded-full shrink-0"
              alt="User"
            />
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                  Dr. Aris Thorne
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                  QA Manager
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

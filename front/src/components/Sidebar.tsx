import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../components/context/ThemeContext";

const navItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    path: "/inventory",
    label: "Inventory",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    path: "/manufacturing",
    label: "Manufacturing",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    path: "/quality",
    label: "Quality Control",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
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
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const sidebarClasses = `
    fixed left-0 top-0 h-screen bg-slate-900 flex flex-col shadow-2xl z-50 transition-all duration-300
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
              <span className="text-base font-bold text-white tracking-tight whitespace-nowrap">
                PharmaFlow
              </span>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
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
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <svg
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}
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
            );
          })}
        </nav>

        <div className="px-2.5 py-1.5">
          <div
            className={`bg-slate-800/50 rounded-lg p-0.5 flex items-center ${isCollapsed ? "flex-col space-y-0.5" : "space-x-0.5"}`}
          >
            <button
              onClick={() => setTheme("light")}
              title="Light Mode"
              className={`flex-1 flex items-center justify-center p-1 rounded-md transition-all ${
                theme === "light"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
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
                  : "text-slate-400 hover:text-slate-200"
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
                  : "text-slate-400 hover:text-slate-200"
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
          </div>
        </div>

        <div
          className={`p-2.5 border-t border-slate-800 ${isCollapsed ? "flex justify-center" : ""}`}
        >
          <div
            className={`bg-slate-800 rounded-lg flex items-center transition-all ${isCollapsed ? "p-1" : "p-2.5 space-x-2"}`}
          >
            <img
              src="https://picsum.photos/28/28"
              className="w-7 h-7 rounded-full shrink-0"
              alt="User"
            />
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-[11px] font-semibold text-white truncate">
                  {user?.email}
                </p>
                <p className="text-[9px] text-slate-400 truncate">
                  {user?.role}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => logout()}
              className="mt-2 w-full hover:cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;

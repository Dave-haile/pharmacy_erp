import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  User,
  Settings,
  Moon,
  Sun,
  Monitor,
  ChevronDown,
  LogOut,
  Bell,
  Menu,
} from "lucide-react";
import { useTheme } from "./context/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { theme, setTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themeIcons = {
    light: <Sun className="w-3.5 h-3.5" />,
    dark: <Moon className="w-3.5 h-3.5" />,
    system: <Monitor className="w-3.5 h-3.5" />,
  };

  const quickLinks = [
    { name: 'Item Master', path: '/inventory/items', icon: <Search className="w-3 h-3" /> },
    { name: 'Audit Logs', path: '/audit-logs', icon: <Bell className="w-3 h-3" /> },
    { name: 'Inventory Control', path: '/inventory/control', icon: <Settings className="w-3 h-3" /> },
    { name: 'User Profile', path: '/profile', icon: <User className="w-3 h-3" /> }
  ];
  const recentSearches = [
    'Aspirin Batch BT-9921',
    'Inventory Low Stock',
    'Audit Logs Feb 2026',
    'Supplier: Global Pharma'
  ];


  return (
    <header className="sticky top-0 z-110 flex items-center justify-between px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Mobile Menu Toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 mr-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative group">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearchFocused ? 'text-emerald-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search everything..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full pl-10 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-bold text-slate-400 dark:text-slate-500 shadow-sm">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[1px] font-bold text-slate-400 dark:text-slate-500 shadow-sm">K</kbd>
          </div>
        </div>

        {isSearchFocused && (
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
          >
            <div className="mb-3">
              <p className="px-3 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recent Searches</p>
              <div className="space-y-0.5">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{search}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="px-3 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quick Links</p>
              <div className="grid grid-cols-2 gap-1">
                {quickLinks.map((link, idx) => (
                  <button
                    key={idx}
                    onClick={() => { navigate(link.path); setIsSearchFocused(false); }}
                    className="flex items-center space-x-2.5 px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-emerald-500">
                      {link.icon}
                    </div>
                    <span>{link.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 p-1 pl-2 pr-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
          >
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-500/20">
              {user?.first_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-none uppercase">
                {user?.first_name || "User"}
              </p>
              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-tighter">
                {user?.role || "User"}
              </p>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Account
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {user?.email || "user@example.com"}
                </p>
              </div>

              <div className="p-1.5">
                <button className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs font-bold">
                  <User className="w-4 h-4" />
                  <span>Profile Settings</span>
                </button>
                <button className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs font-bold">
                  <Settings className="w-4 h-4" />
                  <span>System Preferences</span>
                </button>
              </div>

              <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                <p className="px-3 py-1.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Theme
                </p>
                <div className="grid grid-cols-3 gap-1 px-1.5 pb-1.5">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${theme === t
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                    >
                      {themeIcons[t]}
                      <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">
                        {t}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

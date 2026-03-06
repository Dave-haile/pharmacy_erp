import React, { useEffect, useState } from "react";
import AppLogo from "./AppLogo";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/auth/AuthContext";
import { useTheme } from "@/src/components/context/ThemeContext";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed z-50 top-0 inset-x-0 px-6 lg:px-10 py-4 flex justify-between items-center pointer-events-none transition-all duration-500 ${scrolled
        ? "bg-bg-base/80 backdrop-blur-xl border-b border-white/10"
        : ""
        }`}
    >
      {/* Logo */}
      <div className="pointer-events-auto flex items-center gap-3">
        <AppLogo
          size={32}
          text="PharmaERP"
          className="text-foreground"
        />
      </div>
      {/* Nav links (desktop) */}
      <div className="hidden md:flex pointer-events-auto items-center gap-1 px-2 py-1.5 rounded-full glass border border-foreground/5 dark:border-foreground/10">
        {["Platform", "Compliance", "Modules", "Pricing"]?.map((item) => (
          <a
            key={item}
            href={`#${item?.toLowerCase()}`}
            className=" text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors px-4 py-1.5 rounded-full hover:bg-foreground/5"
          >
            {item}
          </a>
        ))}
      </div>
      {/* CTA + Theme Toggle */}
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="relative w-10 h-10 rounded-full border border-foreground/10 flex items-center justify-center hover:bg-foreground/5 transition-all hover:border-foreground/20 group"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground transition-all duration-300"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground transition-all duration-300"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-emerald-600 text-white px-5 py-2 cursor-pointer rounded-xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-emerald-600/20"
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
                className="text-sm font-bold text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}

          <Link
            to="#demo"
            className="flex items-center gap-2 text-sm font-semibold text-white bg-slate-900 dark:bg-emerald-600 px-5 py-2.5 rounded-full hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-sm"
          >
            Request Demo
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}

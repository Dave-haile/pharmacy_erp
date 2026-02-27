import React, { useState } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 bg-slate-50 dark:bg-slate-950 min-h-screen ${isCollapsed ? "lg:ml-14" : "lg:ml-48"}`}
      >
        {/* Mobile Header Toggle */}
        <Header onMenuClick={() => setIsMobileOpen(true)} />

        <div className="max-w-6xl mx-auto p-2.5 md:p-5">{children}</div>
      </main>
    </div>
  );
};

export default MainLayout;

import React, { useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import InventoryHub from "./pages/InventoryHub";
import Inventory from "./pages/Inventory";
import ItemMaster from "./pages/ItemMaster";
import ItemGrouping from "./pages/ItemGrouping";
import BatchDetails from "./pages/BatchDetails";
import Login from "./pages/Login";
import AIAnalysis from "./pages/AIAnalysis";
import { AuthProvider, useAuth } from "./auth/AuthContext";

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
        className={`flex-1 transition-all duration-300 bg-slate-50 min-h-screen ${isCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        {/* Mobile Header Toggle */}
        <header className="lg:hidden sticky top-0 bg-slate-900 text-white p-4 flex items-center justify-between z-30 shadow-md">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <svg
                className="w-5 h-5 text-white"
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
            <span className="font-bold tracking-tight">PharmaFlow</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({
  element,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <MainLayout>{element}</MainLayout> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute element={<Dashboard />} />} />
          <Route
            path="/inventory"
            element={<PrivateRoute element={<InventoryHub />} />}
          />
          <Route
            path="/inventory/control"
            element={<PrivateRoute element={<Inventory />} />}
          />
          <Route
            path="/inventory/item-master"
            element={<PrivateRoute element={<ItemMaster />} />}
          />
          <Route
            path="/inventory/item-grouping"
            element={<PrivateRoute element={<ItemGrouping />} />}
          />
          <Route
            path="/inventory/:id"
            element={<PrivateRoute element={<BatchDetails />} />}
          />
          <Route
            path="/ai-insights"
            element={<PrivateRoute element={<AIAnalysis />} />}
          />
          <Route
            path="/manufacturing"
            element={
              <PrivateRoute
                element={
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">
                      Manufacturing Module Under Construction
                    </h1>
                  </div>
                }
              />
            }
          />
          <Route
            path="/quality"
            element={
              <PrivateRoute
                element={
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">
                      Quality Control Module Under Construction
                    </h1>
                  </div>
                }
              />
            }
          />
          <Route
            path="/sales"
            element={
              <PrivateRoute
                element={
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">
                      Sales & Distribution Module Under Construction
                    </h1>
                  </div>
                }
              />
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

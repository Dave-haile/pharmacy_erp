import type { ReactNode } from "react";
import Dashboard from "@/src/pages/Dashboard";
import InventoryHub from "@/src/pages/InventoryHub";
import Inventory from "@/src/pages/Inventory";
import ItemMaster from "@/src/pages/ItemMaster";
import ItemGrouping from "@/src/pages/ItemGrouping";
import BatchDetails from "@/src/pages/BatchDetails";
import StockInItems from "@/src/pages/stock-entries/StockInItems";
import Login from "@/src/pages/Login";
import AIAnalysis from "@/src/pages/AIAnalysis";
import CreateItem from "@/src/components/CreateItem";
import ItemDetails from "@/src/components/ItemDetails";
import StockEntry from "@/src/pages/stock-entries/StockEntry";
import LandingPage from "@/src/pages/Landing/LandingPage";
import { RouteGuard } from "../common/RouteGuard";
import NotFound from "@/src/pages/NotFound";
import AuditLogs from "@/src/pages/AuditLogs";
interface RouteConfig {
  key: string;
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    key: "home",
    name: "Home",
    path: "/",
    element: <LandingPage />,
  },
  {
    key: "login",
    name: "Login",
    path: "/login",
    element: <Login />,
  },
  {
    key: "dashboard",
    name: "Dashboard",
    path: "/dashboard",
    element: (
      <RouteGuard>
        <Dashboard />
      </RouteGuard>
    ),
  },
  {
    key: "inventory",
    name: "Inventory",
    path: "/inventory",
    element: (
      <RouteGuard>
        <InventoryHub />
      </RouteGuard>
    ),
  },
  {
    key: "inventory-control",
    name: "Inventory Control",
    path: "/inventory/control",
    element: (
      <RouteGuard>
        <Inventory />
      </RouteGuard>
    ),
  },
  {
    key: "stock-in-items",
    name: "Stock In Items",
    path: "/inventory/stock-entries",
    element: (
      <RouteGuard>
        <StockInItems />
      </RouteGuard>
    ),
  },
  {
    key: "stock-entry",
    name: "Stock Entry",
    path: "/inventory/stock-entries/:postingNumber",
    element: (
      <RouteGuard>
        <StockEntry />
      </RouteGuard>
    ),
  },
  {
    key: "items",
    name: "Items",
    path: "inventory/medicines",
    element: (
      <RouteGuard>
        <ItemMaster />
      </RouteGuard>
    ),
  },
  {
    key: "create-item",
    name: "Create Item",
    path: "inventory/medicines/new-medicine",
    element: (
      <RouteGuard>
        <CreateItem />
      </RouteGuard>
    ),
  },
  {
    key: "item-details",
    name: "Item Details",
    path: "inventory/medicines/:naming_series",
    element: (
      <RouteGuard>
        <ItemDetails />
      </RouteGuard>
    ),
  },
  {
    key: "item-grouping",
    name: "Item Grouping",
    path: "/inventory/categories",
    element: (
      <RouteGuard>
        <ItemGrouping />
      </RouteGuard>
    ),
  },
  {
    key: "batch-details",
    name: "Batch Details",
    path: "/inventory/:id",
    element: (
      <RouteGuard>
        <BatchDetails />
      </RouteGuard>
    ),
  },
  {
    key: "ai-insights",
    name: "AI Insights",
    path: "/ai-insights",
    element: (
      <RouteGuard>
        <AIAnalysis />
      </RouteGuard>
    ),
  },
  {
    key: "manufacturing",
    name: "Manufacturing",
    path: "/manufacturing",
    element: (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold">
          Manufacturing Module Under Construction
        </h1>
      </div>
    ),
  },
  {
    key: "quality",
    name: "Quality",
    path: "/quality",
    element: (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold">
          Quality Control Module Under Construction
        </h1>
      </div>
    ),
  },
  {
    key: "sales",
    name: "Sales",
    path: "/sales",
    element: (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold">Sales Module Under Construction</h1>
      </div>
    ),
  },
  {
    key: "logs",
    name: "Audit Logs",
    path: "/audit-logs",
    element: (
      <RouteGuard>
        <AuditLogs />
      </RouteGuard>
    ),
  },
  {
    key: "not-found",
    name: "Not Found",
    path: "*",
    element: <NotFound />,
  },
];

export default routes;

import type { ReactNode } from "react";
import Dashboard from "@/src/pages/Dashboard/Dashboard";
import InventoryHub from "@/src/pages/Hub/InventoryHub";
import Inventory from "@/src/pages/Invetory/Inventory";
import ItemMaster from "@/src/pages/Medicine/MedicineRegistary";
import BatchDetails from "@/src/pages/BatchDetails";
import StockInItems from "@/src/pages/stock-entries/StockInItems";
import Login from "@/src/pages/Login";
import AIAnalysis from "@/src/pages/AIAnalysis/AIAnalysis";
import MedicineDetails from "@/src/components/MedicineDetails";
import StockEntry from "@/src/pages/stock-entries/StockEntry";
import LandingPage from "@/src/pages/Landing/LandingPage";
import { RouteGuard } from "../common/RouteGuard";
import NotFound from "@/src/pages/NotFound";
import AuditLogs from "@/src/pages/Logs/AuditLogs";
import SupplierRegistry from "@/src/pages/suppliers/SupplierRegistry";
import SupplierForm from "@/src/pages/suppliers/SupplierForm";
import SupplierDetails from "@/src/pages/suppliers/SupplierDetails";
import StockOutRegistry from "@/src/pages/sales/StockOutRegistry";
import StockOutDetails from "@/src/pages/sales/StockOutDetails";
import StockOutPrint from "@/src/pages/sales/StockOutPrint";
import CreateMedicine from "@/src/pages/Medicine/CreateMedicine";
import CategoryRegistry from "@/src/pages/categories/CategoryRegistry";
import CategoryForm from "@/src/pages/categories/CategoryForm";
import CategoryDetails from "@/src/pages/categories/CategoryDetails";
import StockLedgerPage from "@/src/pages/reports/StockLedger";
import NearExpiryReport from "@/src/pages/reports/NearExpiryReport";
import ValuationReport from "@/src/pages/reports/ValuationReport";
import SalesSummaryReport from "@/src/pages/reports/SalesSummaryReport";
import StockAdjustmentsRegistry from "@/src/pages/adjustments/StockAdjustmentsRegistry";
import StockAdjustmentDetails from "@/src/pages/adjustments/StockAdjustmentDetails";
import SalesReturnsRegistry from "@/src/pages/returns/SalesReturnsRegistry";
import SalesReturnDetails from "@/src/pages/returns/SalesReturnDetails";
import SupplierReturnsRegistry from "@/src/pages/returns/SupplierReturnsRegistry";
import SupplierReturnDetails from "@/src/pages/returns/SupplierReturnDetails";
import PurchasesRegistry from "@/src/pages/purchasing/PurchasesRegistry";
import PurchaseDetails from "@/src/pages/purchasing/PurchaseDetails";
import GrnRegistry from "@/src/pages/purchasing/GrnRegistry";
import GrnDetails from "@/src/pages/purchasing/GrnDetails";
import UserRegistry from "@/src/pages/users/UserRegistry";
import UserCreate from "@/src/pages/users/UserCreate";
import UserDetailsByEmail from "@/src/pages/users/UserDetailsByEmail";
import HRHub from "@/src/pages/Hub/HRhub";
import DepartmentDetails from "@/src/pages/HR/DepartmentDetails";
import DepartmentForm from "@/src/pages/HR/DepartmentForm";
import DepartmentRegistry from "@/src/pages/HR/DepartmentRegistry";
import EmployeeRegistry from "@/src/pages/HR/EmployeeRegistry";
import EmployeeEditor from "@/src/pages/HR/EmployeeEditor";
import {
  Attendance,
  LeaveManagement,
  Payroll,
  Performance,
} from "@/src/pages/Leave/HRSubModules";
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
    key: "stock-ledger",
    name: "Stock Ledger",
    path: "/inventory/stock-ledger",
    element: (
      <RouteGuard>
        <StockLedgerPage />
      </RouteGuard>
    ),
  },
  {
    key: "report-near-expiry",
    name: "Near Expiry Report",
    path: "/inventory/near-expiry",
    element: (
      <RouteGuard>
        <NearExpiryReport />
      </RouteGuard>
    ),
  },
  {
    key: "report-valuation",
    name: "Valuation Report",
    path: "/inventory/valuation",
    element: (
      <RouteGuard>
        <ValuationReport />
      </RouteGuard>
    ),
  },
  {
    key: "report-sales-summary",
    name: "Sales Summary",
    path: "/inventory/sales-summary",
    element: (
      <RouteGuard>
        <SalesSummaryReport />
      </RouteGuard>
    ),
  },
  {
    key: "stock-adjustments",
    name: "Stock Adjustments",
    path: "/inventory/stock-adjustments",
    element: (
      <RouteGuard>
        <StockAdjustmentsRegistry />
      </RouteGuard>
    ),
  },
  {
    key: "stock-adjustment-details",
    name: "Stock Adjustment",
    path: "/inventory/stock-adjustments/:id",
    element: (
      <RouteGuard>
        <StockAdjustmentDetails />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "sales-returns",
    name: "Customer Returns",
    path: "/inventory/sales-returns",
    element: (
      <RouteGuard>
        <SalesReturnsRegistry />
      </RouteGuard>
    ),
  },
  {
    key: "sales-return-details",
    name: "Customer Return",
    path: "/inventory/sales-returns/:id",
    element: (
      <RouteGuard>
        <SalesReturnDetails />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "supplier-returns",
    name: "Supplier Returns",
    path: "/inventory/supplier-returns",
    element: (
      <RouteGuard>
        <SupplierReturnsRegistry />
      </RouteGuard>
    ),
  },
  {
    key: "supplier-return-details",
    name: "Supplier Return",
    path: "/inventory/supplier-returns/:id",
    element: (
      <RouteGuard>
        <SupplierReturnDetails />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "purchases",
    name: "Purchases",
    path: "/inventory/purchases",
    element: (
      <RouteGuard>
        <PurchasesRegistry />
      </RouteGuard>
    ),
  },
  {
    key: "purchase-details",
    name: "Purchase",
    path: "/inventory/purchases/:id",
    element: (
      <RouteGuard>
        <PurchaseDetails />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "grn",
    name: "GRN",
    path: "/inventory/grn",
    element: (
      <RouteGuard>
        <GrnRegistry />
      </RouteGuard>
    ),
  },
  {
    key: "grn-details",
    name: "GRN Details",
    path: "/inventory/grn/:id",
    element: (
      <RouteGuard>
        <GrnDetails />
      </RouteGuard>
    ),
    visible: false,
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
    key: "suppliers",
    name: "Suppliers",
    path: "inventory/suppliers",
    element: (
      <RouteGuard>
        <SupplierRegistry />
      </RouteGuard>
    ),
  },
  {
    key: "create-supplier",
    name: "Create Supplier",
    path: "inventory/suppliers/new-supplier",
    element: (
      <RouteGuard>
        <SupplierForm />
      </RouteGuard>
    ),
  },
  {
    key: "supplier-details",
    name: "Supplier Details",
    path: "inventory/suppliers/:naming_series",
    element: (
      <RouteGuard>
        <SupplierDetails />
      </RouteGuard>
    ),
  },
  {
    key: "create-item",
    name: "Create Item",
    path: "inventory/medicines/new-medicine",
    element: (
      <RouteGuard>
        <CreateMedicine />
      </RouteGuard>
    ),
  },
  {
    key: "medicine-details",
    name: "Medicine Details",
    path: "inventory/medicines/:naming_series",
    element: (
      <RouteGuard>
        <MedicineDetails />
      </RouteGuard>
    ),
  },
  {
    key: "categories",
    name: "Categories",
    path: "/inventory/categories",
    element: (
      <RouteGuard>
        <CategoryRegistry />
      </RouteGuard>
    ),
  },
  {
    key: "create-category",
    name: "Create Category",
    path: "/inventory/categories/new",
    element: (
      <RouteGuard>
        <CategoryForm />
      </RouteGuard>
    ),
  },
  {
    key: "category-details",
    name: "Category Details",
    path: "/inventory/categories/:naming_series",
    element: (
      <RouteGuard>
        <CategoryDetails />
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
    key: "stock-out-registry",
    name: "Stock Out Register",
    path: "inventory/stock-outs",
    element: (
      <RouteGuard>
        <StockOutRegistry />
      </RouteGuard>
    ),
  },
  {
    key: "stock-out-details",
    name: "Stock Out",
    path: "inventory/stock-outs/:postingNumber",
    element: (
      <RouteGuard>
        <StockOutDetails />
      </RouteGuard>
    ),
  },
  {
    key: "stock-out-print",
    name: "Print Stock Out",
    path: "/inventory/stock-outs/:postingNumber/print",
    element: (
      <RouteGuard>
        <StockOutPrint />
      </RouteGuard>
    ),
    visible: false,
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
    key: "users",
    name: "User Registry",
    path: "/users",
    element: (
      <RouteGuard>
        <UserRegistry />
      </RouteGuard>
    ),
  },
  {
    key: "create-user",
    name: "Create User",
    path: "/users/new",
    element: (
      <RouteGuard>
        <UserCreate />
      </RouteGuard>
    ),
  },
  {
    key: "user-details",
    name: "User Details",
    path: "/users/:email",
    element: (
      <RouteGuard>
        <UserDetailsByEmail />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "hr",
    name: "HR",
    path: "/hr",
    element: (
      <RouteGuard>
        <HRHub />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "hr-departments",
    name: "Departments",
    path: "/hr/departments",
    element: (
      <RouteGuard>
        <DepartmentRegistry />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "hr-departments-new",
    name: "Department New",
    path: "/hr/departments/new",
    element: (
      <RouteGuard>
        <DepartmentForm />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "hr-departments-details",
    name: "Department Details",
    path: "/hr/departments/:departmentId",
    element: (
      <RouteGuard>
        <DepartmentDetails />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "hr-employee",
    name: "Employee",
    path: "/hr/employees",
    element: (
      <RouteGuard>
        <EmployeeRegistry />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "hr-employee-new",
    name: "Employee New",
    path: "/hr/employees/new",
    element: (
      <RouteGuard>
        <EmployeeEditor />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "hr-employee-details",
    name: "Employee Details",
    path: "/hr/employees/:naming_series",
    element: (
      <RouteGuard>
        <EmployeeEditor />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "hr-leave",
    name: "Leave",
    path: "/hr/leave",
    element: (
      <RouteGuard>
        <LeaveManagement />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "hr-attendance",
    name: "Attendance",
    path: "/hr/attendance",
    element: (
      <RouteGuard>
        <Attendance />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "hr-performance",
    name: "Performance",
    path: "/hr/performance",
    element: (
      <RouteGuard>
        <Performance />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "hr-payroll",
    name: "Payroll",
    path: "/hr/payroll",
    element: (
      <RouteGuard>
        <Payroll />
      </RouteGuard>
    ),
    visible: false,
  },
  {
    key: "not-found",
    name: "Not Found",
    path: "*",
    element: <NotFound />,
  },
];

export default routes;

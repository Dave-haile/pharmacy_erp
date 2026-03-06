export enum UserRole {
  ADMIN = "ADMIN",
  PHARMACIST = "PHARMACIST",
  QA_MANAGER = "QA_MANAGER",
  SALES = "SALES",
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface InventoryItem {
  id: number;
  name: string;
  generic_name: string;
  category: string;
  supplier: string;
  cost_price: string;
  selling_price: string;
  barcode: string;
  description: string;
  is_active: boolean;
  created_at: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  manufacturingDate: string;
  status: "In Stock" | "Low Stock" | "Expired" | "Reserved";
  storageCondition: string;
}
export type CreateMedicine = {
  name: string;
  generic_name: string;
  barcode: string;
  category_id: number | null;
  supplier_id: number | null;
  cost_price: string;
  selling_price: string;
  description: string;
  is_active: boolean;
  status?: string;
};
export interface QualityControlReport {
  id: number;
  batchCode: string;
  testDate: string;
  purity: number;
  stability: string;
  appearance: string;
  outcome: "Passed" | "Failed" | "Pending";
  remarks: string;
}
export interface MedicineItem {
  id: number;
  name: string;
  generic_name: string;
  category: string;
  category_id?: number | null;
  supplier_id?: number | null;
  supplier: string;
  cost_price: string;
  selling_price: string;
  barcode: string;
  description: string;
  naming_series: string;
  is_active: boolean;
  status: 'Draft' | 'Submitted';
  created_at: string;
}
export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}
export interface Supplier {
  id?: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
}

export interface Log {
  log_id: number;
  user: string;
  action: string;
  timestamp: string;
  details: string;
}
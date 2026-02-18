
export enum UserRole {
  ADMIN = 'ADMIN',
  PHARMACIST = 'PHARMACIST',
  QA_MANAGER = 'QA_MANAGER',
  SALES = 'SALES'
}

export interface User {
  id: string;
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
  id: string;
  name: string;
  sku: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  manufacturingDate: string;
  status: 'In Stock' | 'Low Stock' | 'Expired' | 'Reserved';
  storageCondition: string;
}

export interface ProductionBatch {
  id: string;
  productName: string;
  batchCode: string;
  stage: 'Raw Material' | 'Processing' | 'Filling' | 'Packaging' | 'QC Pending' | 'Released';
  progress: number;
  startDate: string;
  estimatedEndDate: string;
}

export interface QualityControlReport {
  id: string;
  batchCode: string;
  testDate: string;
  purity: number;
  stability: string;
  appearance: string;
  outcome: 'Passed' | 'Failed' | 'Pending';
  remarks: string;
}

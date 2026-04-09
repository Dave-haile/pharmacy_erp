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

export type ManagedUserRole = "admin" | "manager" | "pharmacist" | "cashier";

export interface ManagedUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: ManagedUserRole;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  updated_at: string;
}

export interface UserFilters {
  email?: string;
  name?: string;
  role?: string;
  is_active?: string;
}

export interface CreateManagedUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  role: ManagedUserRole;
  password: string;
  is_active: boolean;
}

export interface UpdateManagedUserPayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: ManagedUserRole;
  is_active?: boolean;
}

export interface ResetManagedUserPasswordPayload {
  current_password?: string;
  new_password: string;
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

export interface InventoryBatchItem {
  id: number;
  batch_id: number;
  batch_number: string;
  inventory_batch_number: string;
  medicine_id: number;
  medicine_name: string;
  generic_name: string;
  naming_series: string | null;
  barcode: string;
  category: string;
  supplier: string;
  supplier_id: number | null;
  quantity: number;
  medicine_total_quantity: number;
  unit_cost: string;
  selling_price: string;
  manufacturing_date: string;
  expiry_date: string;
  location: string;
  received_at: string;
  status: "In Stock" | "Low Stock" | "Expiring Soon" | "Expired";
  status_key: "in_stock" | "low_stock" | "expiring_soon" | "expired";
  days_to_expiry: number;
  is_expired: boolean;
  is_expiring_soon: boolean;
  is_low_stock: boolean;
  fifo_priority: number | null;
  sell_first: boolean;
}

export interface InventoryOverviewSummary {
  total_batches: number;
  total_medicines: number;
  total_quantity: number;
  expiring_soon_count: number;
  expired_count: number;
  fifo_candidate_count: number;
  expiry_soon_days: number;
  low_stock_threshold: number;
}

export interface InventoryOverviewResponse {
  summary: InventoryOverviewSummary;
  items: InventoryBatchItem[];
  fifo_candidates: InventoryBatchItem[];
  expiring_soon: InventoryBatchItem[];
  total_count: number;
}

export interface BatchMovement {
  stock_entry_id: number;
  posting_number: string;
  invoice_number: string;
  quantity: number;
  unit_price: string;
  status: string;
  created_at: string;
}

export interface BatchDetail extends InventoryBatchItem {
  recent_movements: BatchMovement[];
  related_batches: InventoryBatchItem[];
}

export interface StockOutItemInput {
  medicine_id: number | null;
  batch_id?: number | null;
  quantity: string;
  unit_price: string;
}

export interface CreateStockOut {
  customer_name: string;
  invoice_number: string;
  payment_method: string;
  notes: string;
  items: StockOutItemInput[];
}

export interface StockOutDetailItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  batch_id: number;
  inventory_batch_id?: number | null;
  batch_number: string;
  inventory_batch_number?: string;
  quantity: number;
  price_at_sale: string;
  subtotal: string;
  expiry_date: string;
}

export interface StockOutSummary {
  id: number;
  posting_number: string;
  customer_name: string;
  invoice_number: string;
  payment_method: string;
  payment_method_label: string;
  status: "Draft" | "Posted" | "Cancelled";
  status_key: "draft" | "posted" | "cancelled";
  total_amount: string;
  total_quantity: number;
  cashier_id: number;
  cashier: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface StockOutDetail extends StockOutSummary {
  items: StockOutDetailItem[];
}

export interface StockOutListResponse {
  count: number;
  num_pages: number;
  current_page: number;
  results: StockOutSummary[];
}

export interface StockOutBatchOption {
  batch_id: number;
  batch_number: string;
  medicine_id: number;
  medicine_name: string;
  quantity: number;
  expiry_date: string;
  received_at: string;
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
  status: "Draft" | "Submitted";
  created_at: string;
}
export interface Category {
  id: number;
  name: string;
  category_name?: string | null;
  naming_series?: string | null;
  description: string;
  parent_category_id?: number | null;
  parent_category_name?: string | null;
  medicine_count?: number;
  child_count?: number;
  created_at: string;
}

export interface CreateCategory {
  name: string;
  category_name: string;
  description: string;
  parent_category_id: number | null;
}
export interface Supplier {
  id?: number;
  naming_series?: string | null;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  status?: "Draft" | "Submitted" | "Cancelled";
  is_active?: boolean;
  medicine_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Log {
  log_id: number;
  action: string;
  timestamp: string;
  details: string;
  user_id: number;
  username?: string | null;
}

export interface StockLedgerEntry {
  transaction_id: number;
  transaction_type: "purchase" | "sale" | "return" | "adjustment" | "damage";
  medicine_id: number | null;
  medicine_name: string;
  batch_id: number | null;
  batch_number: string;
  quantity: number;
  unit_price: string;
  reference_document: string;
  notes: string;
  created_at: string;
}

export interface StockLedgerListResponse {
  results: StockLedgerEntry[];
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface StockAdjustmentItemInput {
  medicine_id: number | null;
  batch_id: number | null;
  quantity_change: string;
  unit_cost: string;
  notes: string;
}

export interface CreateStockAdjustment {
  reason: string;
  notes: string;
  items: StockAdjustmentItemInput[];
}

export interface StockAdjustmentDetailItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  batch_id: number;
  batch_number: string;
  quantity_change: number;
  unit_cost: string;
  notes: string;
}

export interface StockAdjustmentSummary {
  id: number;
  posting_number: string;
  reason: string;
  reason_label: string;
  status: "Draft" | "Posted" | "Cancelled";
  status_key: "draft" | "posted" | "cancelled";
  created_by: string;
  created_by_id: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface StockAdjustmentDetail extends StockAdjustmentSummary {
  items: StockAdjustmentDetailItem[];
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface SalesReturnItemInput {
  medicine_id: number | null;
  batch_id: number | null;
  quantity: string;
  unit_price: string;
  notes: string;
}

export interface CreateSalesReturn {
  reference_invoice: string;
  customer_name: string;
  notes: string;
  items: SalesReturnItemInput[];
}

export interface SalesReturnDetailItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  batch_id: number;
  batch_number: string;
  quantity: number;
  unit_price: string;
  notes: string;
}

export interface SalesReturnSummary {
  id: number;
  posting_number: string;
  reference_invoice: string;
  customer_name: string;
  status: "Draft" | "Posted" | "Cancelled";
  status_key: "draft" | "posted" | "cancelled";
  created_by: string;
  created_by_id: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SalesReturnDetail extends SalesReturnSummary {
  items: SalesReturnDetailItem[];
}

export interface SupplierReturnItemInput {
  medicine_id: number | null;
  batch_id: number | null;
  quantity: string;
  unit_price: string;
  notes: string;
}

export interface CreateSupplierReturn {
  supplier_id: number | null;
  reference_document: string;
  notes: string;
  items: SupplierReturnItemInput[];
}

export interface SupplierReturnDetailItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  batch_id: number;
  batch_number: string;
  quantity: number;
  unit_price: string;
  notes: string;
}

export interface SupplierReturnSummary {
  id: number;
  posting_number: string;
  supplier_id: number;
  supplier: string;
  reference_document: string;
  status: "Draft" | "Posted" | "Cancelled";
  status_key: "draft" | "posted" | "cancelled";
  created_by: string;
  created_by_id: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierReturnDetail extends SupplierReturnSummary {
  items: SupplierReturnDetailItem[];
}

export interface PurchaseItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  quantity: number;
  cost_price: string;
  batch_id: number | null;
  batch_number: string;
  expiry_date: string;
}

export interface PurchaseSummary {
  id: number;
  supplier_id: number;
  supplier: string;
  status: string;
  tax: string;
  total_cost: string;
  grand_total: string;
  notes: string;
  received_by_id: number;
  received_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseDetail extends PurchaseSummary {
  items: PurchaseItem[];
}

export interface GrnItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  batch_id: number | null;
  batch_number: string;
  expiry_date: string;
}

export interface GrnSummary {
  id: number;
  good_reciving_note_id: number;
  purchase_id: number | null;
  supplier_id: number | null;
  supplier: string;
  invoice_number: string;
  total_amount: string;
  received_by_id: number;
  received_by: string;
  received_at: string;
  notes: string;
}

export interface GrnDetail extends GrnSummary {
  items: GrnItem[];
}

export interface StockEntryItemInput {
  medicine_id: number | null;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity: string;
  unit_price: string;
  reference: string;
  notes: string;
}

export interface CreateStockEntry {
  supplier_id: number | null;
  invoice_number: string;
  tax: string;
  notes: string;
  items: StockEntryItemInput[];
}

export interface StockEntrySummary {
  id: number;
  posting_number: string;
  supplier_id: number;
  supplier: string;
  invoice_number: string;
  item_count: number;
  total_quantity: number;
  total_cost: string;
  tax: string;
  grand_total: string;
  status: "Draft" | "Posted" | "Cancelled";
  status_key: "draft" | "posted" | "cancelled";
  received_by: string;
  received_by_id: number;
  purchase_id: number | null;
  goods_receiving_note_id: number | null;
  notes: string;
  posted_at: string;
  updated_at: string;
}

export interface StockEntryDetailItem {
  id: number;
  medicine_id: number;
  medicine_name: string;
  batch_id: number | null;
  inventory_batch_id?: number | null;
  batch_number: string;
  inventory_batch_number?: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  manufacturing_date: string;
  expiry_date: string;
  reference: string;
  notes: string;
}

export interface StockEntryDetail extends StockEntrySummary {
  items: StockEntryDetailItem[];
}

export type PrintDocumentType =
  | "medicine"
  | "supplier"
  | "employee"
  | "department"
  | "category"
  | "stock_entry"
  | "stock_out"
  | "stock_adjustment"
  | "sales_return"
  | "supplier_return"
  | "purchase"
  | "grn";

export interface PrintFormat {
  id: number;
  document_type: PrintDocumentType;
  document_type_label: string;
  name: string;
  slug: string;
  template_key: string;
  template_label: string;
  description: string;
  html_template: string;
  css_template: string;
  js_template: string;
  has_custom_template: boolean;
  paper_size: string;
  orientation: "portrait" | "landscape";
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrintFormatListResponse {
  results: PrintFormat[];
}

export interface CreatePrintFormatPayload {
  document_type: PrintDocumentType;
  name: string;
  slug?: string;
  template_key: string;
  description: string;
  html_template: string;
  css_template: string;
  js_template: string;
  paper_size: string;
  orientation: "portrait" | "landscape";
  is_default?: boolean;
}

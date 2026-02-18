import axios from "axios";

// Use Vite dev-server proxy by default (same-origin), so HttpOnly cookies work reliably.
// If you deploy frontend separately, set VITE_API_BASE_URL to your backend origin.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const MOCK_DATA: Record<string, any> = {
  '/api/login': {
    refresh: "mock_refresh_" + Math.random().toString(36).substring(7),
    access: "mock_access_" + Math.random().toString(36).substring(7)
  },
  '/api/inventory': [
    { id: '1', name: 'Raw Aspirin Powder', sku: 'RAW-ASP-001', batch: 'BT-9921', qty: 500, unit: 'kg', expiry: '2026-12-31', mfgDate: '2023-12-01', storage: 'Store in cool, dry place (15-25°C)', status: 'In Stock', manufacturerId: 'm1' },
    { id: '2', name: 'Gelatin Capsules Size 0', sku: 'CAP-000-0', batch: 'BT-4420', qty: 5, unit: 'k-units', expiry: '2025-06-15', mfgDate: '2024-01-10', storage: 'Controlled humidity < 40%', status: 'Low Stock', manufacturerId: 'm2' },
    { id: '3', name: 'Packaging Foil (ALU)', sku: 'PCK-ALU-20', batch: 'BT-1022', qty: 2500, unit: 'meters', expiry: '2027-01-10', mfgDate: '2023-11-20', storage: 'Standard warehouse', status: 'In Stock', manufacturerId: 'm3' },
    { id: '4', name: 'Ethylene Glycol', sku: 'SOL-ETH-99', batch: 'BT-8877', qty: 120, unit: 'liters', expiry: '2024-03-20', mfgDate: '2022-03-20', storage: 'Flammable storage cabinet', status: 'Expired', manufacturerId: 'm1' },
    { id: '5', name: 'Metformin Hydrochloride', sku: 'RAW-MET-500', batch: 'BT-1122', qty: 8, unit: 'kg', expiry: '2026-08-14', mfgDate: '2024-02-14', storage: 'Protected from light', status: 'Low Stock', manufacturerId: 'm2' },
    { id: '6', name: 'Sodium Chloride (USP)', sku: 'RAW-SAL-100', batch: 'BT-3321', qty: 2, unit: 'kg', expiry: '2025-11-20', mfgDate: '2023-11-20', storage: 'Room temperature', status: 'Low Stock', manufacturerId: 'm3' }
  ],
  '/api/item-master': [
    { id: 'p1', name: 'Aspirin Active Pharmaceutical Ingredient', sku: 'RAW-ASP-001', group: 'Raw Materials', unit: 'kg', valuation: '$120.00' },
    { id: 'p2', name: 'Metformin Hydrochloride Pure', sku: 'RAW-MET-500', group: 'Raw Materials', unit: 'kg', valuation: '$450.00' },
    { id: 'p3', name: 'Pharma-Grade Gelatin Shells', sku: 'CAP-000-0', group: 'Packaging & Excipients', unit: 'k-units', valuation: '$85.00' },
    { id: 'p4', name: 'Industrial Ethanol 99%', sku: 'SOL-ETH-99', group: 'Solvents', unit: 'liters', valuation: '$12.50' },
    { id: 'p5', name: 'Saline Solution Buffer', sku: 'RAW-SAL-100', group: 'Raw Materials', unit: 'kg', valuation: '$5.20' }
  ],
  '/api/item-groups': [
    { id: 'g1', name: 'Raw Materials', count: 142, icon: 'factory', color: 'emerald' },
    { id: 'g2', name: 'Packaging & Excipients', count: 58, icon: 'box', color: 'blue' },
    { id: 'g3', name: 'Finished Goods', count: 89, icon: 'beaker', color: 'purple' },
    { id: 'g4', name: 'Solvents', count: 12, icon: 'droplet', color: 'amber' }
  ],
  '/api/manufacturer/m1': { id: 'm1', name: 'Global Pharma Chem', contact: '+1-555-0102', email: 'supply@globalpharma.com' },
  '/api/manufacturer/m2': { id: 'm2', name: 'CapsuleTech Solutions', contact: '+44-20-7946-0123', email: 'info@capsuletech.io' },
  '/api/manufacturer/m3': { id: 'm3', name: 'EcoPack Industries', contact: '+49-30-123456', email: 'logistics@ecopack.de' },
  '/api/dashboard/stats': {
    productionCount: '14 Batches',
    revenue: '$1.28M',
    inventoryCount: '458 SKU',
    compliance: '98.4%'
  }
};


export default api;

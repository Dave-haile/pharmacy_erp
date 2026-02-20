
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LinkItem {
  label: string;
  path: string;
  highlighted?: boolean;
  active?: boolean;
  icon?: React.ReactNode;
}

interface SectionProps {
  title: string;
  subtitle: string;
  accentColor: string;
  icon: React.ReactNode;
  links: LinkItem[];
}

const CategorySection: React.FC<SectionProps> = ({ title, subtitle, accentColor, icon, links }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${accentColor} text-white shadow-lg`}>
            {icon}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">{title}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 flex-1">
        {links.map((link, idx) => (
          <button
            key={idx}
            onClick={() => link.path !== '#' && navigate(link.path)}
            className={`group relative flex items-center justify-between p-3 rounded-xl transition-all duration-300 border ${link.active
                ? 'bg-slate-900 border-slate-800 shadow-xl'
                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5'
              }`}
          >
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className={`w-2 h-2 rounded-full shrink-0 transition-all duration-500 ${link.highlighted
                  ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-110 animate-pulse'
                  : 'bg-slate-200 group-hover:bg-slate-300'
                }`} />
              <span className={`text-xs font-bold truncate tracking-tight transition-colors ${link.active ? 'text-white' : 'text-slate-600 group-hover:text-slate-900'
                }`}>
                {link.label}
              </span>
            </div>

            <div className={`transition-all duration-300 transform ${link.active ? 'text-emerald-400' : 'text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1'
              }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {link.active && (
              <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl pointer-events-none" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const InventoryHub: React.FC = () => {
  const sections: SectionProps[] = [
    {
      title: 'Items & Pricing',
      subtitle: 'Catalog & Tariffs',
      accentColor: 'bg-amber-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      links: [
        { label: 'Inventory Control', path: '/inventory/control', highlighted: true },
        { label: 'Item Master', path: '/inventory/item-master', highlighted: true },
        { label: 'Item Grouping', path: '/inventory/item-grouping', highlighted: true },
        { label: 'Product Bundles', path: '#', highlighted: true },
        { label: 'Global Price List', path: '#' },
        { label: 'SKU Pricing', path: '#' },
        { label: 'Shipping Rules', path: '#' },
        { label: 'Item Alternatives', path: '#' },
        { label: 'Manufacturer Registry', path: '#' },
        { label: 'Customs Tariff Database', path: '#' },
      ]
    },
    {
      title: 'Stock Transactions',
      subtitle: 'Logistics & Movement',
      accentColor: 'bg-emerald-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      links: [
        { label: 'Material Requests', path: '#', highlighted: true },
        { label: 'Warehouse Stock Entry', path: '#', highlighted: true },
        { label: 'Delivery Notes', path: '#', highlighted: true },
        { label: 'Goods Receiving Voucher', path: '#', active: true },
        { label: 'Pick & Pack List', path: '#', highlighted: true },
        { label: 'Delivery Trip Planner', path: '#' },
        { label: 'Internal Requisitions', path: '#' },
        { label: 'Purchase Request', path: '#' },
        { label: 'Temporary Movement', path: '#' },
      ]
    },
    {
      title: 'Stock Reports',
      subtitle: 'Analytics & Audits',
      accentColor: 'bg-blue-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6-9a3 3 0 116 0 3 3 0 01-6 0zm-1 12a5 5 0 1110 0H4z" />
        </svg>
      ),
      links: [
        { label: 'Stock Ledger', path: '#', highlighted: true },
        { label: 'Balance Summary', path: '#', highlighted: true },
        { label: 'Projected Quantities', path: '#', highlighted: true },
        { label: 'Inventory Ageing', path: '#' },
        { label: 'Price vs Stock Audit', path: '#' },
        { label: 'Master Compliance Report', path: '#' },
        { label: 'Purchase Journey Map', path: '#' },
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <header className="relative py-5 md:py-8 flex flex-col items-center text-center overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/5 blur-[120px] rounded-full -z-10" />

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-4">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Enterprise Warehouse System v4.2</span>
        </div>

        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-800 tracking-tighter mb-3">
          Stock Management <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Hub</span>
        </h1>
        <p className="text-slate-500 max-w-xl text-sm font-medium">
          Orchestrate your global pharmaceutical supply chain from a single tactical directory.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-2">
        {sections.map((section, idx) => (
          <CategorySection key={idx} {...section} />
        ))}
      </div>

      {/* Quick Action Footer */}
      <footer className="mt-10 pt-10 border-t border-slate-200">
        <div className="bg-slate-900 rounded-2xl p-5 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />

          <div className="space-y-1.5 relative z-10 text-center md:text-left">
            <h3 className="text-lg font-black tracking-tight">Need a Custom Report?</h3>
            <p className="text-slate-400 text-xs max-w-xs">Use our AI Risk Analyzer to generate predictive audits based on current inventory trends.</p>
          </div>

          <button className="relative z-10 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-black px-6 py-3 rounded-xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
            Launch AI Intelligence
          </button>
        </div>
      </footer>
    </div>
  );
};

export default InventoryHub;

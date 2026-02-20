
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ItemMaster: React.FC = () => {
  const [items, setItems] = useState<any[]>([
    { id: 'p1', name: 'Aspirin Active Pharmaceutical Ingredient', sku: 'RAW-ASP-001', group: 'Raw Materials', unit: 'kg', valuation: '$120.00' },
    { id: 'p2', name: 'Metformin Hydrochloride Pure', sku: 'RAW-MET-500', group: 'Raw Materials', unit: 'kg', valuation: '$450.00' },
    { id: 'p3', name: 'Pharma-Grade Gelatin Shells', sku: 'CAP-000-0', group: 'Packaging & Excipients', unit: 'k-units', valuation: '$85.00' },
    { id: 'p4', name: 'Industrial Ethanol 99%', sku: 'SOL-ETH-99', group: 'Solvents', unit: 'liters', valuation: '$12.50' },
    { id: 'p5', name: 'Saline Solution Buffer', sku: 'RAW-SAL-100', group: 'Raw Materials', unit: 'kg', valuation: '$5.20' }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await api.get('/api/item-master');
        setItems(res.data);
      } catch (e) {
        console.error("Item Master fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Item Master</h1>
            <p className="text-slate-500 text-xs font-medium">Core Product Definition Registry</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2 w-full md:w-64">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search specifications..."
              className="bg-transparent outline-none text-xs w-full font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xl hover:bg-slate-800 transition-all whitespace-nowrap">
            + Create Item
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Accessing Master DB...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Product Specification</th>
                  <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Item Group</th>
                  <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">UOM</th>
                  <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Valuation</th>
                  <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                        <span className="text-[9px] font-mono text-emerald-600 font-black">{item.sku}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-tight">
                        {item.group}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-slate-600">{item.unit}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-black text-slate-900">{item.valuation}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="text-[9px] font-black uppercase text-slate-400 hover:text-emerald-600 transition-colors">
                        Edit Spec
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemMaster;

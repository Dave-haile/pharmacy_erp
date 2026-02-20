
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as ReactToPrint from 'react-to-print';
import api from '../services/api';

// Handle potential differences in how esm.sh bundles react-to-print
const useReactToPrint = (ReactToPrint as any).useReactToPrint || (ReactToPrint as any).default?.useReactToPrint || (ReactToPrint as any).default;

// Printable Label Component (Kept same structure for printing fidelity)
const PrintableLabel = React.forwardRef<HTMLDivElement, { item: any }>(({ item }, ref) => {
  return (
    <div ref={ref} className="p-8 bg-white text-black w-[400px] border-4 border-black font-sans m-4">
      <div className="border-b-4 border-black pb-4 mb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">PharmaFlow</h2>
          <p className="text-[10px] font-bold tracking-widest">CERTIFIED BATCH LABEL</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase">Printed: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase block">Product Name</label>
          <div className="text-xl font-bold border-b border-black pb-1">{item.name}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase block">Batch Number</label>
            <div className="text-lg font-mono font-bold tracking-tighter">{item.batch}</div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase block">SKU</label>
            <div className="text-lg font-mono font-bold tracking-tighter">{item.sku}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase block">MFG Date</label>
            <div className="font-bold">{new Date(item.mfgDate).toLocaleDateString()}</div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase block text-red-600">EXP Date</label>
            <div className="font-bold text-red-600 underline decoration-2">{new Date(item.expiry).toLocaleDateString()}</div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase block">Storage Conditions</label>
          <div className="text-sm font-medium border border-black p-2 mt-1 leading-tight italic">
            {item.storage}
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t-2 border-black border-dashed mt-4">
          <div className="space-y-1">
            <div className="h-6 w-32 bg-black flex items-center justify-center">
              <div className="flex space-x-0.5 px-1 bg-white h-4 w-[120px]">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className={`h-full bg-black`} style={{ width: `${Math.random() * 4 + 1}px` }}></div>
                ))}
              </div>
            </div>
            <p className="text-[8px] font-mono font-bold text-center uppercase tracking-[0.2em]">{item.batch}-{item.sku}</p>
          </div>
          <div className="w-12 h-12 border-2 border-black flex items-center justify-center p-1">
            <div className="grid grid-cols-4 grid-rows-4 gap-0.5 w-full h-full bg-slate-100">
              {[...Array(16)].map((_, i) => (
                <div key={i} className={`w-full h-full ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const BatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = typeof useReactToPrint === 'function' ? useReactToPrint({
    contentRef: labelRef,
  }) : () => alert("Printing failed to load.");

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await api.get('/api/inventory');
        const foundItem = response.data.find((i: any) => i.id === id);
        setItem(foundItem);
      } catch (err) {
        console.error("Batch Detail Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (isLoading) return <div className="p-12 text-center text-slate-400 text-sm">Loading Batch Details...</div>;
  if (!item) return <div className="p-12 text-center text-slate-400 text-sm">Batch not found.</div>;

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="hidden">
        <PrintableLabel ref={labelRef} item={item} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          onClick={() => navigate('/inventory')}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full transition-all text-slate-500 border border-slate-200 sm:border-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 break-words">{item.name}</h1>
          <p className="text-slate-500 text-xs">Batch Detailed Profile: <span className="font-mono text-emerald-600">{item.batch}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-4 md:px-6 py-3 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">General Info</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                {item.status}
              </span>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SKU Code</label>
                <p className="text-sm md:text-base font-semibold text-slate-800">{item.sku}</p>
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Stock</label>
                <p className="text-sm md:text-base font-semibold text-slate-800">{item.qty} {item.unit}</p>
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">MFG Date</label>
                <p className="text-sm md:text-base font-semibold text-slate-800">{new Date(item.mfgDate).toLocaleDateString()}</p>
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">EXP Date</label>
                <p className="text-sm md:text-base font-semibold text-red-600 font-bold underline decoration-red-200 underline-offset-4">{new Date(item.expiry).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span>Storage & Compliance</span>
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">{item.storage}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="bg-emerald-500 p-1.5 rounded-md text-white shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-[9px] font-bold text-emerald-800 truncate">GMP Compliant</p>
                  <p className="text-[8px] text-emerald-600 truncate">#8812-A</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="bg-blue-500 p-1.5 rounded-md text-white shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-[9px] font-bold text-blue-800 truncate">ISO 9001 Certified</p>
                  <p className="text-[8px] text-blue-600 truncate">Last Audit: Jan 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 text-white relative overflow-hidden">
            <h3 className="text-base md:text-lg font-bold mb-4 flex items-center space-x-2 relative z-10">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span>Batch Actions</span>
            </h3>
            <div className="space-y-2 relative z-10">
              <button
                onClick={() => navigate('/ai-insights', { state: { item } })}
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>AI Risk Analysis</span>
              </button>

              <button
                onClick={() => handlePrint()}
                className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-2 border border-slate-700"
              >
                <span>Print Physical Label</span>
              </button>

              <button
                className="w-full bg-slate-800/50 py-2.5 rounded-lg font-bold text-xs transition-all text-slate-400 border border-slate-800 opacity-50 cursor-not-allowed"
                disabled
              >
                <span className="text-center">Export QC Data (BETA)</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
            <h3 className="text-xs md:text-base font-bold text-slate-800 mb-4">Inventory Logs</h3>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <div className="flex flex-col items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <div className="w-[1px] h-full bg-slate-100"></div>
                </div>
                <div className="pb-3">
                  <p className="text-[10px] font-bold text-slate-800">Stock Verified</p>
                  <p className="text-[9px] text-slate-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="flex flex-col items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-800">Batch Released</p>
                  <p className="text-[9px] text-slate-500">Nov 20, 2023</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchDetails;


import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Simple in-memory cache for manufacturer data
const manufacturerCache: Record<string, any> = {};

const UnitConverterModal: React.FC<{ 
  isOpen: boolean, 
  onClose: () => void, 
  initialQty: number, 
  initialUnit: string 
}> = ({ isOpen, onClose, initialQty, initialUnit }) => {
  const [value, setValue] = useState(initialQty);
  const [fromUnit, setFromUnit] = useState(initialUnit);
  const [toUnit, setToUnit] = useState('');

  const units = ['kg', 'g', 'mg', 'mcg', 'liters', 'ml', 'meters', 'cm', 'units', 'k-units'];

  useEffect(() => {
    setValue(initialQty);
    setFromUnit(initialUnit);
    if (initialUnit === 'kg') setToUnit('g');
    else if (initialUnit === 'liters') setToUnit('ml');
    else if (initialUnit === 'k-units') setToUnit('units');
    else if (initialUnit === 'g') setToUnit('mg');
    else setToUnit(units.find(u => u !== initialUnit) || '');
  }, [initialQty, initialUnit]);

  const convertedValue = useMemo(() => {
    let base = value;
    if (fromUnit === 'kg') base = value * 1000;
    else if (fromUnit === 'k-units') base = value * 1000;
    else if (fromUnit === 'liters') base = value * 1000;
    else if (fromUnit === 'mg') base = value / 1000;
    else if (fromUnit === 'mcg') base = value / 1000000;

    if (toUnit === 'kg' || toUnit === 'k-units' || toUnit === 'liters') return base / 1000;
    if (toUnit === 'g' || toUnit === 'units' || toUnit === 'ml') return base;
    if (toUnit === 'mg') return base * 1000;
    if (toUnit === 'mcg') return base * 1000000;
    return base;
  }, [value, fromUnit, toUnit]);

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    setValue(convertedValue);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${convertedValue.toFixed(4)} ${toUnit}`);
    alert('Copied to clipboard');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-6 md:p-8 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Unit Converter</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-3xl">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Source Value</label>
              <div className="flex items-center space-x-4">
                <input 
                  type="number" 
                  value={value} 
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="flex-1 bg-transparent text-xl md:text-2xl font-bold text-slate-800 outline-none w-full"
                />
                <select 
                  value={fromUnit} 
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-600 shadow-sm"
                >
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-center relative z-10">
              <button onClick={swapUnits} className="bg-white border border-slate-200 p-2.5 rounded-full shadow-lg hover:shadow-xl hover:-rotate-180 transition-all duration-500 text-emerald-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
              </button>
            </div>
            <div className="p-4 md:p-6 bg-emerald-50 border border-emerald-100 rounded-3xl relative -mt-6 pt-10">
              <label className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-2 block">Resulting Quantity</label>
              <div className="flex items-center justify-between">
                <div className="text-2xl md:text-3xl font-black text-emerald-800 break-all pr-4">
                  {convertedValue.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </div>
                <select 
                  value={toUnit} 
                  onChange={(e) => setToUnit(e.target.value)}
                  className="bg-white border border-emerald-200 rounded-xl px-2 py-1.5 text-xs font-bold text-emerald-700 shadow-sm"
                >
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={copyToClipboard} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <span className="text-sm">Copy Result</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ManufacturerCell: React.FC<{ manufacturerId: string }> = ({ manufacturerId }) => {
  const [data, setData] = useState<any>(manufacturerCache[manufacturerId] || null);
  const [loading, setLoading] = useState(!manufacturerCache[manufacturerId]);

  useEffect(() => {
    const fetchMan = async () => {
      try {
        const res = await api.get(`/api/manufacturer/${manufacturerId}`);
        manufacturerCache[manufacturerId] = res.data;
        setData(res.data);
      } catch (e) {
        console.error("Failed to fetch manufacturer", e);
      } finally {
        setLoading(false);
      }
    };
    if (manufacturerId && !data) fetchMan();
  }, [manufacturerId, data]);

  if (loading) return <div className="animate-pulse space-y-1"><div className="h-4 bg-slate-100 rounded w-24"></div><div className="h-3 bg-slate-50 rounded w-16"></div></div>;
  if (!data) return <span className="text-slate-300">Unspecified</span>;

  return (
    <div className="max-w-[150px] md:max-w-[200px]">
      <div className="text-xs md:text-sm font-bold text-slate-800 truncate">{data.name}</div>
      <div className="hidden md:flex items-center space-x-2 text-[10px] text-slate-500">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        <span className="truncate">{data.email}</span>
      </div>
    </div>
  );
};

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [converterModal, setConverterModal] = useState({ isOpen: false, qty: 0, unit: '' });
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  const quickLinks = ['Item', 'Item Group', 'Product Bundle', 'Price List', 'Item Price'];

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await api.get('/api/inventory');
        setInventory(response.data);
      } catch (err) {
        console.error("Inventory Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const sortedItems = useMemo(() => {
    let items = [...inventory].filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      items.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [inventory, searchTerm, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleAIAnalyze = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/ai-insights', { state: { item } });
  };

  const handleViewDetails = (id: string) => {
    navigate(`/inventory/${id}`);
  };

  const handleSelectItem = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(new Set(sortedItems.map(i => i.id)));
    else setSelectedIds(new Set());
  };

  const openConverter = (qty: number, unit: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConverterModal({ isOpen: true, qty, unit });
  };

  const exportToFormat = (format: 'csv' | 'excel', itemsToExport: any[]) => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`${format.toUpperCase()} export initiated.`);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <UnitConverterModal 
        isOpen={converterModal.isOpen} 
        onClose={() => setConverterModal({ ...converterModal, isOpen: false })}
        initialQty={converterModal.qty}
        initialUnit={converterModal.unit}
      />

      {/* Quick Navigation Toolbar */}
      <div className="flex overflow-x-auto no-scrollbar space-x-3 pb-2 -mx-1 px-1">
        {quickLinks.map((link) => (
          <button 
            key={link}
            className="whitespace-nowrap px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center space-x-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
            <span>{link}</span>
          </button>
        ))}
        <button className="whitespace-nowrap px-4 py-2 bg-slate-900 rounded-xl text-xs font-bold text-white shadow-lg shadow-slate-900/10">
          + New Entry
        </button>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/inventory')}
            className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500"
            title="Back to Stock Management"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Inventory Control</h1>
            <p className="text-slate-500 font-medium text-sm">Batch lifecycle & shelf-life monitoring</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:max-w-3xl">
          <div className="flex items-center space-x-2 bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-3 flex-1 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search batches..." 
              className="flex-1 outline-none text-sm text-slate-700 bg-transparent font-medium min-w-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shrink-0">
            <button 
              onClick={() => exportToFormat('csv', sortedItems)}
              disabled={isExporting}
              className="flex-1 sm:flex-none px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 border-r border-slate-100 transition-colors flex items-center justify-center space-x-2"
            >
              <span>CSV</span>
            </button>
            <button 
              onClick={() => exportToFormat('excel', sortedItems)}
              disabled={isExporting}
              className="flex-1 sm:flex-none px-4 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Operations Bar */}
      <div className={`transition-all duration-300 overflow-hidden ${selectedIds.size > 0 ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
        <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center space-x-4 text-white">
            <div className="bg-emerald-500 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-lg">
              {selectedIds.size}
            </div>
            <div>
              <span className="font-bold text-sm block">Items Selected</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-500 transition-all">
              Archive
            </button>
            <button className="flex-1 md:flex-none px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all">
              Bulk Released
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-24 text-center">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4"></div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Repository...</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={selectedIds.size > 0 && selectedIds.size === sortedItems.length}
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('name')}>
                    <div className="flex items-center space-x-1">
                      <span>Item Name</span>
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Manufacturer</th>
                  <th className="px-6 py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('qty')}>
                    <div className="flex items-center space-x-1">
                      <span>Stock Level</span>
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('expiry')}>
                    <div className="flex items-center space-x-1">
                      <span>Expiry Date</span>
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedItems.map((item) => {
                  const isLowStock = item.qty < 10;
                  const isSelected = selectedIds.has(item.id);
                  const daysLeft = getDaysRemaining(item.expiry);
                  const isNearExpiry = daysLeft <= 90 && daysLeft > 0;
                  const isCriticalExpiry = daysLeft <= 30 && daysLeft > 0;
                  const isExpired = daysLeft <= 0;

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => handleViewDetails(item.id)}
                      className={`transition-all cursor-pointer group ${
                        isSelected ? 'bg-emerald-50/50' : 
                        isExpired || isCriticalExpiry ? 'bg-red-50/20 hover:bg-red-50/40' : 
                        isNearExpiry ? 'bg-amber-50/20 hover:bg-amber-50/40' :
                        isLowStock ? 'bg-amber-50/10 hover:bg-amber-50/30' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(item.id, e)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`font-bold text-sm md:text-base ${
                            isExpired || isCriticalExpiry ? 'text-red-900' : 'text-slate-800'
                          }`}>{item.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ManufacturerCell manufacturerId={item.manufacturerId} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col">
                            <span className={`text-base md:text-lg font-black ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>{item.qty}</span>
                            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase -mt-1">{item.unit}</span>
                          </div>
                          <button 
                            onClick={(e) => openConverter(item.qty, item.unit, e)}
                            className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-700 rounded-lg md:rounded-xl transition-all shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${isExpired || isCriticalExpiry ? 'text-red-600' : 'text-slate-600'}`}>
                            {new Date(item.expiry).toLocaleDateString()}
                          </span>
                          {!isExpired && (isNearExpiry || isCriticalExpiry) && (
                            <span className={`text-[10px] font-black uppercase ${isCriticalExpiry ? 'text-red-400' : 'text-amber-400'}`}>
                              {daysLeft} days left
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 ${
                          isExpired ? 'bg-red-100 text-red-800 border-red-200' :
                          isCriticalExpiry ? 'bg-red-50 text-red-700 border-red-100' :
                          item.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          'bg-slate-50 text-slate-700 border-slate-100'
                        }`}>
                          {isExpired ? 'Expired' : item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                            onClick={(e) => handleAIAnalyze(item, e)}
                            className="p-2 bg-emerald-600 text-white rounded-lg hover:scale-110 transition-all"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;

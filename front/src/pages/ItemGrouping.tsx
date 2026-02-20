
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ItemGrouping: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('/api/item-groups');
        setGroups(res.data);
      } catch (e) {
        console.error("Item groups fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'factory': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
      case 'box': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
      case 'beaker': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.675.337a4 4 0 01-2.574.345l-2.387-.477a2 2 0 00-1.022.547l-1.113 1.113a2 2 0 00.586 3.414l5.051.754a4 4 0 001.49-.035l5.051-.754a2 2 0 00.586-3.414l-1.113-1.113z" /></svg>;
      case 'droplet': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.675.337a4 4 0 01-2.574.345l-2.387-.477a2 2 0 00-1.022.547l-1.113 1.113a2 2 0 00.586 3.414l5.051.754a4 4 0 001.49-.035l5.051-.754a2 2 0 00.586-3.414l-1.113-1.113z" /></svg>;
      default: return null;
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-500 text-emerald-500';
      case 'blue': return 'bg-blue-500 text-blue-500';
      case 'purple': return 'bg-purple-500 text-purple-500';
      case 'amber': return 'bg-amber-500 text-amber-500';
      default: return 'bg-slate-500 text-slate-500';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Product Hierarchy</h1>
            <p className="text-slate-500 text-xs font-medium">Categorical Inventory Grouping</p>
          </div>
        </div>
        <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold text-xs shadow-sm hover:bg-slate-50 transition-all">
          Manage Structure
        </button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-slate-100"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {groups.map(group => (
            <div key={group.id} className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 shadow-lg ${getColorClass(group.color).split(' ')[0]} bg-opacity-10 ${getColorClass(group.color).split(' ')[1]}`}>
                {getIcon(group.icon)}
              </div>
              <h3 className="text-base font-black text-slate-800 tracking-tight mb-1.5 uppercase">{group.name}</h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Items Registry</p>
                  <p className="text-2xl font-black text-slate-900">{group.count}</p>
                </div>
                <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all cursor-pointer">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          ))}

          {/* New Group Placeholder */}
          <div className="group bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 border-dashed flex items-center justify-center text-slate-300 group-hover:border-emerald-400 group-hover:text-emerald-500 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600">New Category</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemGrouping;

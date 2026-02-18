
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
      case 'factory': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
      case 'box': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
      case 'beaker': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.675.337a4 4 0 01-2.574.345l-2.387-.477a2 2 0 00-1.022.547l-1.113 1.113a2 2 0 00.586 3.414l5.051.754a4 4 0 001.49-.035l5.051-.754a2 2 0 00.586-3.414l-1.113-1.113z" /></svg>;
      case 'droplet': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.675.337a4 4 0 01-2.574.345l-2.387-.477a2 2 0 00-1.022.547l-1.113 1.113a2 2 0 00.586 3.414l5.051.754a4 4 0 001.49-.035l5.051-.754a2 2 0 00.586-3.414l-1.113-1.113z" /></svg>;
      default: return null;
    }
  };

  const getColorClass = (color: string) => {
    switch(color) {
      case 'emerald': return 'bg-emerald-500 text-emerald-500';
      case 'blue': return 'bg-blue-500 text-blue-500';
      case 'purple': return 'bg-purple-500 text-purple-500';
      case 'amber': return 'bg-amber-500 text-amber-500';
      default: return 'bg-slate-500 text-slate-500';
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/inventory')}
            className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Product Hierarchy</h1>
            <p className="text-slate-500 font-medium">Categorical Inventory Grouping</p>
          </div>
        </div>
        <button className="bg-white border border-slate-200 px-6 py-2.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">
          Manage Structure
        </button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse border border-slate-100"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {groups.map(group => (
            <div key={group.id} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-8 shadow-lg ${getColorClass(group.color).split(' ')[0]} bg-opacity-10 ${getColorClass(group.color).split(' ')[1]}`}>
                {getIcon(group.icon)}
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2 uppercase">{group.name}</h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Items Registry</p>
                  <p className="text-3xl font-black text-slate-900">{group.count}</p>
                </div>
                <div className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          ))}

          {/* New Group Placeholder */}
          <div className="group bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-full border-2 border-slate-300 border-dashed flex items-center justify-center text-slate-300 group-hover:border-emerald-400 group-hover:text-emerald-500 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600">New Category</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemGrouping;

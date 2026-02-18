
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import api from '../services/api';

// Existing Monthly Production/Sales Data
const monthlyData = [
  { name: 'Jan', sales: 4000, production: 2400, income: 125000 },
  { name: 'Feb', sales: 3000, production: 1398, income: 98000 },
  { name: 'Mar', sales: 2000, production: 9800, income: 142000 },
  { name: 'Apr', sales: 2780, production: 3908, income: 110000 },
  { name: 'May', sales: 1890, production: 4800, income: 135000 },
  { name: 'Jun', sales: 2390, production: 3800, income: 158000 },
];

// New Weekly Income Data
const weeklyIncomeData = [
  { day: 'Mon', income: 12400 },
  { day: 'Tue', income: 15200 },
  { day: 'Wed', income: 9800 },
  { day: 'Thu', income: 18600 },
  { day: 'Fri', income: 21000 },
  { day: 'Sat', income: 4500 },
  { day: 'Sun', income: 3200 },
];

// New Revenue by Product Data
const productRevenueData = [
  { name: 'Aspirin Pro', value: 45000, color: '#10b981' },
  { name: 'Metformin XL', value: 32000, color: '#6366f1' },
  { name: 'Amoxicillin', value: 28000, color: '#3b82f6' },
  { name: 'Lisinopril', value: 18000, color: '#f59e0b' },
  { name: 'Others', value: 12000, color: '#94a3b8' },
];

// Mock System Activity Logs
const systemLogs = [
  { id: 1, time: '14:22', type: 'success', action: 'Batch BT-9921', message: 'QA Verification Passed', user: 'System' },
  { id: 2, time: '13:45', type: 'info', action: 'Inventory', message: 'Stock Re-order: Amoxicillin (200kg)', user: 'L. Miller' },
  { id: 3, time: '12:10', type: 'warning', action: 'Compliance', message: 'Storage Temp Deviation: Area-C (+1.2C)', user: 'Sensor-8' },
  { id: 4, time: '10:30', type: 'success', action: 'Production', message: 'New Run Initiated: Aspirin Pro', user: 'A. Thorne' },
  { id: 5, time: '09:15', type: 'info', action: 'System', message: 'User Dr. Aris Thorne Logged In', user: 'AuthSvc' },
  { id: 6, time: '08:45', type: 'success', action: 'Logistics', message: 'Order #SH-2201 Dispatched', user: 'Warehouse-1' },
  { id: 7, time: '07:20', type: 'info', action: 'Audit', message: 'Weekly Security Scan Completed', user: 'SecBot' },
];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, invRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/inventory')
        ]);
        setStats(statsRes.data);
        setInventory(invRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const lowStockItems = inventory.filter(item => item.qty < 10);

  if (isLoading) return (
    <div className="p-20 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aggregating Enterprise Data...</p>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">Executive Intelligence</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Global pharmaceutical operations & financial health</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none bg-white px-4 md:px-6 py-2.5 md:py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            Generate Audit
          </button>
          <button className="flex-1 sm:flex-none bg-slate-900 px-4 md:px-6 py-2.5 md:py-3 rounded-2xl text-sm font-bold text-white hover:bg-slate-800 shadow-xl transition-all">
            + Production
          </button>
        </div>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Daily Output" 
          value={stats?.productionCount || "14 Batches"} 
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          trend="+2 since 08:00 AM"
          trendColor="text-blue-600"
          colorClass="bg-blue-50"
        />
        <StatCard 
          title="Monthly Income" 
          value={stats?.revenue || "$1.28M"} 
          icon={<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          trend="+8.4% above target"
          trendColor="text-emerald-600"
          colorClass="bg-emerald-50"
        />
        <StatCard 
          title="Catalog Health" 
          value={stats?.inventoryCount || "458 SKU"} 
          icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          trend={`${lowStockItems.length} alerts`}
          trendColor={lowStockItems.length > 0 ? "text-red-500" : "text-slate-400"}
          colorClass="bg-purple-50"
        />
        <StatCard 
          title="Compliance" 
          value={stats?.compliance || "98.4%"} 
          icon={<svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
          trend="Validation #8812"
          trendColor="text-amber-600"
          colorClass="bg-amber-50"
        />
      </div>

      {/* Main Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        
        <div className="lg:col-span-3 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Weekly Income Stream */}
            <div className="bg-white p-6 md:p-8 rounded-4xl md:rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Weekly Revenue</h3>
                  <p className="text-xs md:text-sm text-slate-400 font-medium">Daily breakdown</p>
                </div>
                <div className="text-right">
                  <span className="text-lg md:text-xl font-black text-emerald-600">$94.9k</span>
                </div>
              </div>
              <div className="h-[180px] md:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyIncomeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" hide />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc', radius: 8 }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="income" radius={[6, 6, 6, 6]} fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Activity Log (Replaced Line Chart) */}
            <div className="bg-white p-6 md:p-8 rounded-4xl md:rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">System Pulse</h3>
                  <p className="text-xs md:text-sm text-slate-400 font-medium">Live activity log</p>
                </div>
                <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[180px] md:max-h-[200px] pr-2 custom-scrollbar">
                {systemLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 group">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                      log.type === 'success' ? 'bg-emerald-500' : 
                      log.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{log.action}</p>
                        <span className="text-[9px] font-bold text-slate-400">{log.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate group-hover:text-slate-900 transition-colors">
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Monthly Financial Growth */}
            <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-4xl md:rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2">Monthly Revenue</h3>
              <p className="text-xs md:text-sm text-slate-400 font-medium mb-6 md:mb-8">Fiscal performance (6 mo)</p>
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }} />
                    <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue by Product */}
            <div className="bg-white p-6 md:p-8 rounded-4xl md:rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
              <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2">Contribution</h3>
              <p className="text-xs md:text-sm text-slate-400 font-medium mb-6">Revenue by SKU</p>
              <div className="flex-1 min-h-[180px] md:min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productRevenueData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {productRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {productRevenueData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight truncate">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-800">${(item.value / 1000).toFixed(1)}k</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 p-6 md:p-8 rounded-4xl md:rounded-[2.5rem] shadow-xl text-white">
            <h3 className="text-sm md:text-lg font-black mb-6 uppercase tracking-wider text-slate-400 text-center lg:text-left">Efficiency</h3>
            <div className="h-[120px] md:h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData.slice(-4)}>
                  <Bar dataKey="production" fill="#3b82f6" radius={[4, 4, 4, 4]} barSize={12} />
                  <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 4, 4]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Output Ratio</span>
                <span className="font-black text-emerald-400">0.92</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[92%]"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-4xl md:rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col min-h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm md:text-lg font-black text-slate-800 uppercase tracking-tighter">System Alerts</h3>
              <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                lowStockItems.length > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {lowStockItems.length}
              </span>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {lowStockItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-2xl border border-red-50/50 bg-red-50/10 hover:bg-red-50/30 transition-all cursor-pointer group"
                    onClick={() => navigate('/inventory')}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight truncate pr-2">{item.name}</h4>
                      <div className="h-2 w-2 rounded-full bg-red-500 shrink-0"></div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{item.sku}</p>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-lg font-black text-red-600">{item.qty}</span>
                          <span className="text-[9px] text-red-400 font-black uppercase">{item.unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-800 text-xs font-black uppercase tracking-tight">Nominal State</p>
              </div>
            )}

            <button 
              onClick={() => navigate('/inventory')}
              className="mt-8 w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 border-2 border-slate-100 rounded-2xl transition-all"
            >
              Full Repository
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

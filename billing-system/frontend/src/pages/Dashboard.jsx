import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis,
  Tooltip,
  ResponsiveContainer, 
  Cell,
  CartesianGrid
} from 'recharts';
import { 
  RefreshCw, 
  CheckCircle,
  TrendingUp,
  Calendar,
  User as UserIcon,
  Package,
  Activity,
  ArrowUpRight,
  ChevronDown,
  Search,
  Check,
  Layout
} from 'lucide-react';

// --- Minimalist Multi-Select ---
const MultiSelect = ({ icon: Icon, value, options, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  const toggleOption = (opt) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  };

  const isAllSelected = value.length === 0 || value.includes('All');

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-emerald-300 transition-all cursor-pointer shadow-sm"
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-emerald-500" />}
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">
          {isAllSelected ? label : `${value.length} selected`}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-300 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500" />
            <input 
              type="text"
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border-none rounded-lg text-[11px] outline-none font-black"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar pb-1">
            {filteredOptions.length === 0 && <div className="text-[10px] text-slate-400 p-4 text-center font-bold">No results</div>}
            {filteredOptions.map((opt, idx) => (
              <div 
                key={`${opt}-${idx}`}
                onClick={() => toggleOption(opt)}
                className="flex items-center justify-between p-1.5 rounded-md cursor-pointer hover:bg-emerald-50 transition-colors"
              >
                <span className={`text-[11px] truncate pr-2 font-bold ${value.includes(opt) ? 'text-emerald-600' : 'text-slate-600'}`}>{opt}</span>
                {value.includes(opt) && <Check className="w-3 h-3 text-emerald-600" />}
              </div>
            ))}
          </div>
          <div className="flex border-t border-slate-100 mt-2 pt-2">
             <button onClick={() => onChange([])} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 tracking-widest uppercase">Select All</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  
  const [filters, setFilters] = useState({ products: [], customers: [], years: [], max_visits: 0 });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All');
  const [viewType, setViewType] = useState('monthly');
  const [minVisits, setMinVisits] = useState(0);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setChartLoading(true);
    
    try {
      const params = new URLSearchParams();
      selectedProducts.forEach(p => params.append('product', p));
      selectedCustomers.forEach(c => params.append('name', c));
      params.append('year', selectedYear);
      params.append('view_type', viewType);
      if (minVisits > 0) params.append('min_visits', minVisits);
      
      const [statsRes, historyRes, activityRes, coursesRes, customerRes, filtersRes] = await Promise.all([
        api.get('/dashboard/stats', { params }),
        api.get('/dashboard/history', { params }),
        api.get('/dashboard/activity'),
        api.get('/dashboard/top-courses', { params }),
        api.get('/dashboard/top-customers', { params }),
        api.get('/dashboard/filters')
      ]);
      
      setStats(statsRes.data);
      setHistory(historyRes.data);
      setActivities(activityRes.data);
      setTopCourses(coursesRes.data);
      setTopCustomers(customerRes.data);
      setFilters(filtersRes.data);
    } catch (_err) { console.error(_err); } finally { 
      setLoading(false); 
      setChartLoading(false);
    }
  }, [selectedProducts, selectedCustomers, selectedYear, viewType, minVisits]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    if (!loading) fetchData();
  }, [selectedProducts, selectedCustomers, selectedYear, viewType, minVisits, fetchData, loading]);

  const kpiCards = [
    { label: 'Revenue', value: `₹${stats?.total_revenue?.toLocaleString() || '0'}`, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Bills', value: stats?.verified_transactions || '0', icon: CheckCircle, color: 'text-slate-900' },
    { label: 'Pending', value: stats?.pending_sync || '0', icon: RefreshCw, color: 'text-amber-500' },
    { label: 'System', value: stats?.active_licenses || '0', icon: Activity, color: 'text-emerald-500' },
  ];

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center text-slate-300">
      <RefreshCw className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Optimizing Dashboard</span>
    </div>
  );

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-4">
      
      {/* SaaS Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Performance Intelligence</h1>
          <p className="text-[11px] font-bold text-slate-400">Comprehensive overview of revenue streams and sync signals.</p>
        </div>

        <div className="flex items-center gap-2">
          <MultiSelect icon={Package} label="All Products" options={filters.products} value={selectedProducts} onChange={setSelectedProducts} />
          <MultiSelect icon={UserIcon} label="All Customers" options={filters.customers} value={selectedCustomers} onChange={setSelectedCustomers} />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
             <Calendar className="w-3.5 h-3.5 text-emerald-500" />
             <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="text-[11px] font-bold text-slate-600 bg-transparent outline-none appearance-none pr-1 cursor-pointer">
               <option value="All">All Years</option>
               {filters.years.map(y => <option key={y} value={y}>{y}</option>)}
             </select>
          </div>
        </div>
      </div>

      {/* Unified KPI Box (One Long Horizontal Box) */}
      <div className="bg-white border border-slate-100 rounded-2xl mb-8 overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/5 transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {kpiCards.map((card, i) => (
            <div key={i} className="p-8 transition-all hover:bg-emerald-50/20 group">
               <div className="flex items-center gap-2 mb-4">
                  <card.icon className={`w-3.5 h-3.5 ${card.color} group-hover:scale-110 transition-transform`} strokeWidth={2.5}/>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
               </div>
               <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Horizontal Product Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-8 relative overflow-hidden shadow-sm ring-1 ring-slate-900/5">
          {chartLoading && (
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 animate-pulse z-10" />
          )}
          
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Product Performance</h3>
              <p className="text-[10px] text-slate-400 font-bold italic">Revenue breakdown by service for {viewType} period</p>
            </div>
            <div className="flex bg-slate-50 p-1 rounded-lg">
              {['daily', 'weekly', 'monthly', 'yearly'].map(t => (
                <button 
                  key={t}
                  onClick={() => setViewType(t)}
                  className={`px-3 py-1 text-[9px] font-black rounded-md transition-all uppercase tracking-widest ${viewType === t ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >{t}</button>
              ))}
            </div>
          </div>
          
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="99%" height={380}>
              <BarChart layout="vertical" data={history} margin={{ left: 10, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis 
                  dataKey="day" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={150}
                  tick={{fill: '#64748b', fontSize: 11, fontWeight: 900}} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f0fdf4', fontSize: '11px', fontWeight: 'bold' }} 
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  {history.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={index === 0 ? '#10b981' : '#f1f5f9'} 
                      className="hover:opacity-80 cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clean Ranking List */}
        <div className="bg-white border border-slate-100 rounded-xl p-8 shadow-sm ring-1 ring-slate-900/5">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-8">Top Origins</h3>
          <div className="space-y-6">
            {topCourses.map((course, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    {course.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-slate-700 tracking-tight leading-tight">{course.name}</span>
                    <span className="text-[10px] font-bold text-slate-400">{course.count} bills</span>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-900 italic">₹{course.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Details - Visit Frequency */}
        <div className="bg-white border border-slate-100 rounded-xl p-8 shadow-sm h-full ring-1 ring-slate-900/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Customer Frequency</h3>
            <select 
              value={minVisits} 
              onChange={(e) => setMinVisits(Number(e.target.value))}
              className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded outline-none border-none cursor-pointer hover:bg-emerald-100 transition-colors"
            >
              <option value="0">ALL VISITS</option>
              {Array.from({ length: filters.max_visits || 0 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'VISIT' : 'VISITS'}</option>
              ))}
            </select>
          </div>
          <div className="space-y-6">
            {topCustomers.map((customer, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    {customer.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-slate-700 tracking-tight leading-tight">{customer.name}</span>
                    <span className="text-[10px] font-bold text-slate-400">{customer.phone}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tighter">{customer.count} VISITS</span>
                  <span className="text-[9px] font-bold text-slate-300 italic font-mono">₹{customer.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streaming Logs */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm h-full ring-1 ring-slate-900/5">
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Live Billing Stream</h3>
            <div className="px-3 py-1 bg-emerald-50 rounded-lg flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Processing Data</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing Event</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validation</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ref_ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activities.map((act, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                    <td className="px-8 py-4 text-[11px] font-black text-slate-400 leading-none">{act.timestamp}</td>
                    <td className="px-6 py-4 text-[12px] font-black text-slate-900 leading-tight">{act.event}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border border-emerald-100 bg-emerald-50 text-emerald-600`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-black font-mono text-slate-300 text-right group-hover:text-emerald-600 uppercase transition-colors">{act.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

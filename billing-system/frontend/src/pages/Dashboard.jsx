import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  CreditCard, 
  RefreshCw, 
  Key, 
  CheckCircle,
  MoreVertical,
  ArrowUpRight
} from 'lucide-react';

export default function Dashboard() {
  const { searchQuery } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/history'),
      api.get('/dashboard/activity'),
      api.get('/dashboard/top-courses')
    ]).then(([statsRes, historyRes, activityRes, coursesRes]) => {
      setStats(statsRes.data);
      setHistory(historyRes.data);
      setActivities(activityRes.data);
      setTopCourses(coursesRes.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4448D4]"></div>
    </div>
  );

  // Filter activities and top clients based on search query
  const filteredActivities = activities.filter(act => 
    act.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCourses = topCourses.filter(course => 
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const kpiCards = [
    { name: 'TOTAL INVOICED', value: `₹${stats?.total_revenue?.toLocaleString()}`, change: '+12.4% vs last month', icon: CreditCard, iconColor: 'text-[#4448D4]' },
    { name: 'PENDING SYNC', value: stats?.pending_sync || '0', change: '8 items requiring attention', icon: RefreshCw, iconColor: 'text-gray-400' },
    { name: 'ACTIVE LICENSES', value: '1,058', change: '94% utilization rate', icon: Key, iconColor: 'text-[#4448D4]' },
    { name: 'SYSTEM HEALTH', value: '99.9%', change: 'Maintenance in 4h', icon: CheckCircle, iconColor: 'text-red-500', iconFull: true },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-10">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-[13px] font-bold text-[#74777F] tracking-widest uppercase mb-1">
            <span>BILLINGSYNC</span>
            <span>/</span>
            <span className="text-[#1A1C1E]">OVERVIEW</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[#1A1C1E] mb-1">Organization Dashboard</h1>
        <p className="text-[#44474E] text-base">Reviewing financial metrics and sync status for Q3 operations.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, i) => (
          <div key={i} className="bg-white border border-[#E0E2E5] rounded-xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-bold text-[#74777F] tracking-widest uppercase">{card.name}</span>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} fill={card.iconFull ? 'currentColor' : 'none'} />
            </div>
            <div className="space-y-1">
                <p className="text-3xl font-bold text-[#1A1C1E]">{card.value}</p>
                <p className={`text-[12px] font-medium flex items-center gap-1 ${card.name === 'SYSTEM HEALTH' ? 'text-red-600' : 'text-[#74777F]'}`}>
                    {card.change}
                </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Chart */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-[#E0E2E5] rounded-xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-sm font-bold text-[#1A1C1E] uppercase tracking-wider">BILLING PERFORMANCE</h3>
                        <p className="text-[12px] text-[#74777F]">Volume tracking by channel</p>
                    </div>
                    <div className="flex border border-[#E0E2E5] rounded overflow-hidden">
                        <button className="px-3 py-1 text-[11px] font-bold border-r border-[#E0E2E5] bg-[#F1F3F9] text-[#1A1C1E]">DAILY</button>
                        <button className="px-3 py-1 text-[11px] font-bold text-[#74777F]">WEEKLY</button>
                    </div>
                </div>
                
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={history}>
                            <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#74777F', fontSize: 11, fontWeight: 600}} 
                                dy={10}
                            />
                            <Bar 
                                dataKey="value" 
                                radius={[4, 4, 0, 0]}
                                barSize={60}
                            >
                                {history.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={index === 3 ? '#4448D4' : '#E0E2E5'} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Activity Table */}
            <div className="bg-white border border-[#E0E2E5] rounded-xl overflow-hidden">
                <div className="p-8 pb-4 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#1A1C1E] uppercase tracking-wider">RECENT SYSTEM ACTIVITY</h3>
                    <button className="text-[12px] font-bold text-[#4448D4] hover:underline">View Audit Log</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#F8F9FA] border-y border-[#E0E2E5]">
                                <th className="px-8 py-3 text-[11px] font-bold text-[#74777F] uppercase tracking-wider">TIMESTAMP</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-[#74777F] uppercase tracking-wider">EVENT</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-[#74777F] uppercase tracking-wider">STATUS</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-[#74777F] uppercase tracking-wider">USER</th>
                                <th className="px-8 py-3 text-[11px] font-bold text-[#74777F] uppercase tracking-wider text-right">REFERENCE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E0E2E5]">
                            {filteredActivities.map((act, i) => (
                                <tr key={i} className="hover:bg-[#F8F9FA] transition-colors">
                                    <td className="px-8 py-5 text-[12px] font-medium text-[#74777F] whitespace-nowrap">{act.timestamp}</td>
                                    <td className="px-4 py-5 text-[13px] font-semibold text-[#1A1C1E]">{act.event}</td>
                                    <td className="px-4 py-5">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-tighter ${
                                            act.status === 'COMPLETED' ? 'bg-[#E1E0FF] text-[#4448D4]' :
                                            act.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                                            act.status === 'RESOLVED' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {act.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-[13px] text-[#44474E]">{act.user}</td>
                                    <td className="px-8 py-5 text-[12px] font-bold text-[#74777F] text-right">{act.reference}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredActivities.length === 0 && (
                        <div className="p-12 text-center text-[#74777F] font-medium">
                            No matching activities found for "{searchQuery}"
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-8">
            {/* Top Courses */}
            <div className="bg-white border border-[#E0E2E5] rounded-xl p-8">
                <h3 className="text-sm font-bold text-[#1A1C1E] uppercase tracking-wider mb-6">TOP COURSES</h3>
                <div className="space-y-6">
                    {filteredCourses.map((course, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded flex items-center justify-center text-[11px] font-bold text-white ${
                                    i === 0 ? 'bg-[#4448D4]' : i === 1 ? 'bg-[#1A1110]' : 'bg-[#74777F]'
                                }`}>
                                    {course.initials}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[#1A1C1E]">{course.name}</span>
                                    <span className="text-[12px] font-medium text-[#74777F]">{course.count} sales</span>
                                </div>
                            </div>
                            <span className="text-sm font-medium text-[#74777F]">₹{course.revenue.toLocaleString()}</span>
                        </div>
                    ))}
                    {filteredCourses.length === 0 && (
                        <div className="text-[12px] text-[#74777F] italic">No courses found.</div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

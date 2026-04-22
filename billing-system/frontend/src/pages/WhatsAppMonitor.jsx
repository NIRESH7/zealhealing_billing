import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Search,
  RefreshCw,
  Layers
} from 'lucide-react';

export default function WhatsAppMonitor() {
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/transactions/batch-status');
      if (res.data && res.data.items) {
        setBatch(res.data);
      }
    } catch (err) {
      console.error('Status fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading && !batch) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Linking Stream...</span>
      </div>
    );
  }

  const items = batch?.items || [];
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: items.length,
    sent: items.filter(i => i.status === 'sent').length,
    pending: items.filter(i => i.status === 'queued' || i.status === 'sending').length,
    failed: items.filter(i => i.status === 'error').length
  };

  return (
    <div className="max-w-[1240px] mx-auto px-8 py-6 font-sans">
      
      {/* SaaS Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">WhatsApp Dispatch Ledger</h1>
            {stats.pending === 0 && stats.total > 0 && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black tracking-widest rounded border border-emerald-100 uppercase">Completed</span>
            )}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Serial Communication Stream</p>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Remaining</p>
            <p className="text-xl font-black text-slate-900">{batch?.eta || 'Completed'}</p>
          </div>
          <div className="text-right border-l border-slate-100 pl-12 font-bold">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Progress</p>
            <p className="text-xl font-black text-emerald-600">{stats.sent} / {stats.total}</p>
          </div>
        </div>
      </div>

      {/* Excel Sheet Table Format */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 w-24">Pos</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200">Identity</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200">Signal Axis</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 text-center">Stream Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Log Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {currentItems.length === 0 ? (
                <tr>
                    <td colSpan="5" className="px-6 py-20 text-center font-black text-slate-300 uppercase tracking-widest text-[11px]">
                        Waiting for Batch Initiation...
                    </td>
                </tr>
            ) : (
                currentItems.map((item, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                    <tr key={idx} className="hover:bg-emerald-50/20 transition-colors group">
                    <td className="px-6 py-3.5 text-[11px] font-black text-slate-300 border-r border-slate-200 font-mono tracking-tighter uppercase whitespace-nowrap">
                        #{globalIdx.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-3.5 border-r border-slate-200">
                        <span className="text-[13px] font-black text-slate-900 leading-none">{item.name}</span>
                    </td>
                    <td className="px-6 py-3.5 text-[12px] font-black text-slate-500 border-r border-slate-200 font-mono">
                        {item.phone}
                    </td>
                    <td className="px-6 py-3.5 border-r border-slate-200">
                        <div className="flex items-center justify-center gap-2">
                        {item.status === 'sent' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />}
                        {item.status === 'sending' && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
                        {item.status === 'queued' && <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                        {item.status === 'error' && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                            item.status === 'sent' ? 'text-emerald-600' : 
                            item.status === 'error' ? 'text-rose-500' : 
                            item.status === 'sending' ? 'text-emerald-500' : 'text-slate-400'
                        }`}>
                            {item.status}
                        </span>
                        </div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-[11px] font-black text-slate-400 group-hover:text-slate-900 transition-colors">
                        {item.timestamp || '--:--:--'}
                    </td>
                    </tr>
                );
                })
            )}
          </tbody>
        </table>

        {/* Minimalist Pagination Grid Area */}
        <div className="px-8 py-5 flex items-center justify-between bg-slate-50 border-t border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
          <div>Showing {currentItems.length} of {stats.total} Records</div>
          <div className="flex items-center gap-3">
            <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 hover:border-emerald-400 text-slate-400 hover:text-emerald-600 transition-all disabled:opacity-30"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-900 font-black">
                {currentPage}
            </div>
            <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 hover:border-emerald-400 text-slate-400 hover:text-emerald-600 transition-all disabled:opacity-30"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}

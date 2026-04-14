import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Database, RefreshCw, HardDrive, Server } from 'lucide-react';

export default function DB() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // Fetch the underlying transactions records (which is what the upload page inserts)
      const res = await api.get('/transactions', { params: { limit: 100 } });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col font-sans">
      {/* Header */}
      <div className="mb-8 pl-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-[10px] font-bold tracking-widest text-[#4264AB] uppercase mb-4">
              <Database className="w-3.5 h-3.5 mr-2" />
              <span>SYSTEM DATABASE</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#1a1c23] tracking-tight mb-2">
              Raw Ledger Records
            </h1>
            <p className="text-[#596375] text-sm max-w-2xl leading-relaxed">
              This is a direct view into the active database collections. The files you upload are parsed and permanently inserted into these tables as distinct records.
            </p>
          </div>
          <button 
            onClick={fetchRecords} 
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 text-xs font-semibold rounded-sm hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Query
          </button>
        </div>
      </div>

      {/* Database Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">transactions_collection</p>
            <p className="text-2xl font-black text-[#1a1c23] mt-1">{data.total}</p>
          </div>
          <div className="bg-[#EEF1F5] p-3 rounded-full">
            <Server className="w-5 h-5 text-[#4264AB]" />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Connection</p>
            <p className="text-xs font-mono font-bold text-emerald-600 mt-2">Connected: localhost:27017</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-full">
            <Database className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Size</p>
            <p className="text-xs font-mono font-bold text-slate-700 mt-2">~{(data.total * 0.42).toFixed(2)} KB (Est)</p>
          </div>
          <div className="bg-[#EEF1F5] p-3 rounded-full">
            <HardDrive className="w-5 h-5 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Raw Table */}
      <div className="bg-white border border-slate-200 rounded-sm flex-1 flex flex-col overflow-hidden">
        <div className="bg-[#F8F9FA] px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-700">db.transactions.find().limit(100)</span>
            <span className="text-[10px] font-bold bg-[#4264AB] text-white px-2 py-0.5 rounded-sm uppercase tracking-widest">{data.items.length} records shown</span>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 whitespace-nowrap">_id</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">Name</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">Phone</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">Transaction_ID</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">Amount</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">Product</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {loading ? (
                <tr>
                   <td colSpan="8" className="px-4 py-8 text-center text-slate-400">Querying database...</td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                   <td colSpan="8" className="px-4 py-8 text-center text-slate-400">Collection is empty.</td>
                </tr>
              ) : (
                data.items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{row.id}</td>
                    <td className="px-4 py-3 text-slate-800 font-semibold">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{row.transaction_id}</td>
                    <td className="px-4 py-3 text-[#4264AB] font-bold">₹{row.amount}</td>
                    <td className="px-4 py-3 text-slate-600">{row.product}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider font-bold ${
                        row.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 
                        row.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

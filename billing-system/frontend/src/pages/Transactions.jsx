import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { Search, Eye, Download, X, Loader2, CheckSquare, Square, ChevronLeft, ChevronRight, MessageCircle, AlertTriangle, Edit3, Trash2, Filter, Layers, Eraser, MoreVertical, Plus, ChevronDown } from 'lucide-react';

// --- Simplified Edit Modal (SaaS Style) ---
function EditModal({ tx, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...tx });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/transactions/${tx.id}`, formData);
      onSave();
    } catch (err) { alert('Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-[4px]">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-none">Modify Entry</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref ID: {tx.transaction_id || tx.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-xl text-slate-400 transition-all"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="text-[11px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Customer Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} className="w-full px-4 py-2.5 text-[13px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Contact Identity</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone:e.target.value})} className="w-full px-4 py-2.5 text-[13px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Revenue Status</label>
              <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount:e.target.value})} className="w-full px-4 py-2.5 text-[13px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Product / Memo</label>
              <textarea value={formData.product} onChange={e => setFormData({...formData, product:e.target.value})} className="w-full px-4 py-2.5 text-[13px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none" rows="2" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-[11px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Discard</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 text-[11px] font-black bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest disabled:opacity-50">
              {loading ? 'Processing...' : 'Sync Updates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { user } = useOutletContext();
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [selected, setSelected] = useState([]);
  const [selectAllAll, setSelectAllAll] = useState(false);
  const [latestBatchOnly, setLatestBatchOnly] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [singleBill, setSingleBill] = useState(null);
  const [activeTx, setActiveTx] = useState(null); // Track active tx for regeneration
  const [generatingId, setGeneratingId] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/', {
        params: { skip: page * pageSize, limit: pageSize, search, status, latest_batch_only: latestBatchOnly }
      });
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(); }, [page, status, latestBatchOnly]);

  const handleSearch = (e) => { e.preventDefault(); setPage(0); fetchTransactions(); };
  const toggleSelect = (id) => { setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  const toggleSelectAll = () => {
    if (selected.length === data.items.length) { setSelected([]); setSelectAllAll(false); }
    else { setSelected(data.items.map(i => i.id)); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectAllAll ? data.total : selected.length} entries?`)) return;
    try {
      await api.post('/transactions/bulk-delete', { ids: selectAllAll ? [] : selected, deleteAll: selectAllAll, status, search, latest_batch_only: latestBatchOnly });
      setSelected([]); setSelectAllAll(false); fetchTransactions();
    } catch (err) { alert('Operation failed'); }
  };

  const handleWipeAll = async () => {
    if (!window.confirm("CRITICAL: Wipe entire database?")) return;
    try {
      await api.post('/transactions/bulk-delete', { ids: [], deleteAll: true });
      setSelected([]); setSelectAllAll(false); fetchTransactions();
    } catch (err) { alert('Wipe failed'); }
  };

  const generateInvoice = async (tx) => {
    setGeneratingId(tx.id);
    try {
      const res = await api.post(`/transactions/${tx.id}/generate-invoice`);
      setSingleBill({ url: `http://localhost:8000${res.data.url}`, name: tx.name });
      setActiveTx(tx);
      fetchTransactions();
    } catch (err) { alert('Failed to generate'); }
    finally { setGeneratingId(null); }
  };

  const allSelected = data.items.length > 0 && selected.length === data.items.length;

  return (
    <>
      {editingTx && <EditModal tx={editingTx} onClose={() => setEditingTx(null)} onSave={() => { setEditingTx(null); fetchTransactions(); }} />}
      
      {singleBill && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[6px] flex items-center justify-center p-6 lg:p-12">
          <div className="bg-white w-full max-w-6xl h-full rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100"><Download className="w-5 h-5 text-indigo-600" /></div>
                <div>
                  <span className="text-sm font-black tracking-tight text-slate-900 block">{singleBill.name}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Transaction Ledger Release</span>
                </div>
              </div>
              <button onClick={() => setSingleBill(null)} className="p-3 hover:bg-slate-200/50 rounded-2xl text-slate-400 transition-all"><X className="w-6 h-6" /></button>
            </div>
            <iframe src={singleBill.url} className="w-full flex-1 border-none bg-slate-100/30" title="Preview" />
            <div className="p-6 border-t border-slate-100 flex justify-center gap-4 bg-slate-50/50">
              <button 
                onClick={() => generateInvoice(activeTx)} 
                disabled={generatingId === activeTx?.id}
                className="px-8 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm"
              >
                {generatingId === activeTx?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4 text-emerald-500" />}
                Sync & Regenerate
              </button>
              <a href={singleBill.url} download className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-3">
                <Download className="w-4 h-4" />
                Download Permanent Record
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-8 pb-32">
        
        {/* Modern Minimal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 pb-8 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900">Performance Ledger</h1>
            <div className="flex items-center gap-2 mt-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">Database Online & Syncing</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLatestBatchOnly(!latestBatchOnly)}
              className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl border transition-all ${latestBatchOnly ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-100' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-900 shadow-sm'}`}
            >
              LATEST SIGNAL
            </button>
            <button className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-500 rounded-xl hover:border-indigo-200 hover:text-indigo-600 shadow-sm transition-all">Export XLSX</button>
            <button onClick={handleWipeAll} className="px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-50 rounded-xl transition-all">Wipe Logs</button>
          </div>
        </div>

        {/* High-Performance Minimalist Selection Toolbar */}
        {selected.length > 0 && (
          <div className="bg-indigo-50/40 backdrop-blur-sm border-t border-b border-indigo-100/50 px-8 py-4 flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">
                  {selectAllAll ? `All ${data.total} records secured` : `${selected.length} entries selected`}
                </span>
              </div>
              {!selectAllAll && data.total > data.items.length && (
                <button onClick={() => setSelectAllAll(true)} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 underline underline-offset-4 decoration-indigo-200 decoration-2 transition-all">
                  Commit all {data.total} to scope
                </button>
              )}
            </div>
            <button 
              onClick={handleBulkDelete} 
              className="px-6 py-2.5 bg-white text-rose-500 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm"
            >
              Destroy Logs
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
          <form onSubmit={handleSearch} className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" placeholder="Filter by name, phone or product..." 
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-[13px] font-bold text-slate-700 bg-white border border-slate-200 rounded-2xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all placeholder:text-slate-300 shadow-sm"
            />
          </form>
          <div className="relative w-full md:w-44">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-5 py-3 text-[11px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-2xl outline-none cursor-pointer hover:border-indigo-400 transition-all shadow-sm appearance-none text-slate-500">
              <option value="All">All Category</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
          </div>
        </div>

        {/* Minimalist SaaS Table */}
        <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm shadow-slate-200/50 relative">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-40 text-slate-200">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Optimizing Ledger</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#fcfdff] border-b-2 border-slate-200">
                    <tr>
                      <th className="px-6 py-5 w-12 text-center border-r border-slate-200">
                        <button onClick={toggleSelectAll} className="p-1 rounded bg-white border border-slate-300 shadow-sm text-slate-300 hover:text-indigo-600 active:scale-95 transition-all">
                          {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-indigo-600" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                      </th>
                      <th className="px-5 py-5 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest border-r border-slate-200">Signal Date</th>
                      <th className="px-6 py-5 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest border-r border-slate-200">Customer Entity</th>
                      <th className="px-6 py-5 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest border-r border-slate-200">Phone Identity</th>
                      <th className="px-6 py-5 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest border-r border-slate-200">Reference_ID</th>
                      <th className="px-6 py-5 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest border-r border-slate-200">Revenue Unit</th>
                      <th className="px-6 py-5 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest border-r border-slate-200">Memo Details</th>
                      <th className="px-8 py-5 text-right text-[11px] font-black text-slate-900 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.items.map((tx) => {
                      const isSelected = selected.includes(tx.id);
                      return (
                        <tr key={tx.id} className={`group border-b border-slate-100 transition-all duration-200 ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/30'}`}>
                          <td className="px-6 py-4 text-center border-r border-slate-50">
                            <button onClick={() => toggleSelect(tx.id)} className={`p-1 rounded transition-all ${isSelected ? 'text-indigo-600' : 'text-slate-200 group-hover:text-slate-600'}`}>
                              {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td className="px-5 py-4 text-[11px] font-semibold text-slate-900 whitespace-nowrap border-r border-slate-100">{tx.date || '--'}</td>
                          <td className="px-6 py-4 border-r border-slate-200">
                            <span className="text-[12px] font-semibold text-slate-900 tracking-tight">{tx.name}</span>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-100">
                            <span className="text-[11px] text-slate-900 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{tx.phone}</span>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-100">
                             <div className="font-mono text-[10px] font-bold text-slate-400 tracking-wider uppercase group-hover:text-slate-900 transition-colors truncate max-w-[120px]">{tx.transaction_id}</div>
                          </td>
                          <td className="px-6 py-4 text-[11px] font-black text-slate-900 border-r border-slate-200">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 border-r border-slate-100">
                            <p className="text-[11px] font-semibold text-slate-900 line-clamp-1 max-w-[200px]" title={tx.product}>{tx.product || '-'}</p>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 transition-all duration-300">
                              {generatingId === tx.id ? (
                                <div className="p-2 text-indigo-400"><Loader2 className="w-4 h-4 animate-spin" /></div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setActiveTx(tx);
                                    tx.invoice_url ? setSingleBill({ url: `http://localhost:8000${tx.invoice_url}`, name: tx.name }) : generateInvoice(tx);
                                  }} 
                                  className={`p-2 transition-all rounded-xl ${tx.invoice_url ? 'text-indigo-500 hover:bg-indigo-50' : 'text-slate-300 hover:text-indigo-400 hover:bg-slate-50'}`}
                                  title={tx.invoice_url ? "View Invoice" : "Generate Record"}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              <div className="w-[1px] h-4 bg-slate-50 mx-1" />
                              <button onClick={() => setEditingTx(tx)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all" title="Edit"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={async () => { if(window.confirm('Wipe permanent log?')) { await api.delete(`/transactions/${tx.id}`); fetchTransactions(); } }} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Minimalist Pagination */}
              <div className="px-10 py-8 flex items-center justify-between bg-slate-50/30 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{data.total} Signals Logged</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl bg-white hover:border-indigo-400 disabled:opacity-30 transition-all shadow-sm"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                  <div className="px-5 h-10 flex items-center justify-center text-[12px] font-black text-slate-900 bg-white border border-slate-200 rounded-xl select-none shadow-sm">{page + 1}</div>
                  <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * pageSize >= data.total} className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl bg-white hover:border-indigo-400 disabled:opacity-30 transition-all shadow-sm"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

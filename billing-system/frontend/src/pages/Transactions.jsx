import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Search, Eye, Download, X, Loader2, CheckSquare, Square, ChevronLeft, ChevronRight, MessageCircle, AlertTriangle, Edit3, Trash2, Filter, Layers, Eraser, MoreVertical, Plus, ChevronDown, FileText } from 'lucide-react';

// --- Simplified Edit Modal (SaaS Style) ---
// --- SaaS Multi-Product Search & Bill Creator ---
function CreateModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '', phone: '', transaction_id: '', amount: 0, product: '', 
    region: 'India', date: new Date().toLocaleDateString('en-GB'),
    gst_rate: 0, cgst: 0, sgst: 0, total_amount: 0, hsn_code: ''
  });
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length > 1) {
      api.get('/products', { params: { search } }).then(res => setProducts(res.data));
    }
  }, [search]);

  const selectProduct = (p) => {
    const price = formData.region === 'India' ? p.price_india : p.price_abroad;
    const gstRate = formData.region === 'India' ? p.gst_rate : 0;
    const gstAmt = price * (gstRate / 100);
    
    setFormData({
      ...formData,
      product: p.name,
      amount: price,
      gst_rate: gstRate,
      cgst: gstAmt / 2,
      sgst: gstAmt / 2,
      total_amount: price + gstAmt,
      hsn_code: p.hsn_code || ''
    });
    setSearch(p.name);
    setShowSuggestions(false);
  };

  const calculate = (region) => {
    // If we have a product selected, re-calc based on region
    const p = products.find(prod => prod.name === formData.product);
    if (p) {
      const price = region === 'India' ? p.price_india : p.price_abroad;
      const gstRate = region === 'India' ? p.gst_rate : 0;
      const gstAmt = price * (gstRate / 100);
      setFormData(prev => ({
        ...prev,
        region,
        amount: price,
        gst_rate: gstRate,
        cgst: gstAmt / 2,
        sgst: gstAmt / 2,
        total_amount: price + gstAmt
      }));
    } else {
      setFormData(prev => ({ ...prev, region }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/transactions/manual', formData);
      onSave();
    } catch (err) { alert('Creation failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Generate Smart Bill</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Manual Ledger Entry Process</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"><X className="w-6 h-6" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="col-span-2">
               <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit font-bold">
                  {['India', 'Abroad'].map(r => (
                    <button 
                      key={r} type="button"
                      onClick={() => calculate(r)}
                      className={`px-8 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.region === r ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {r}
                    </button>
                  ))}
               </div>
            </div>

            <div className="col-span-2 relative">
              <label className="text-[11px] font-black text-slate-400 mb-3 block uppercase tracking-widest">Search Product / Service</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="text" value={search} onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-11 pr-4 py-4 text-[14px] font-bold text-slate-900 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-600/10 outline-none transition-all"
                  placeholder="Type product name (Tarot, Crystal...)"
                />
              </div>
              {showSuggestions && products.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-[110] max-h-60 overflow-y-auto">
                   {products.map(p => (
                     <div key={p.id} onClick={() => selectProduct(p)} className="p-3 hover:bg-emerald-50 rounded-xl cursor-pointer flex justify-between items-center group transition-all">
                        <span className="text-[13px] font-black text-slate-700 group-hover:text-emerald-600">{p.name}</span>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{p.category}</span>
                           <span className="text-[11px] font-black text-emerald-600">₹{formData.region === 'India' ? p.price_india : p.price_abroad}</span>
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
               <div>
                  <label className="text-[11px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Customer Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})} className="w-full px-5 py-3.5 text-[13px] font-black text-slate-900 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-600/10 outline-none" placeholder="Enter name" />
               </div>
               <div>
                  <label className="text-[11px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Contact Identity</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone:e.target.value})} className="w-full px-5 py-3.5 text-[13px] font-black text-slate-900 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-600/10 outline-none" placeholder="WhatsApp Number" />
               </div>
            </div>

            <div className="space-y-6">
               <div>
                  <label className="text-[11px] font-black text-slate-400 mb-2 block uppercase tracking-widest">GPay/Ref ID</label>
                  <input required type="text" value={formData.transaction_id} onChange={e => setFormData({...formData, transaction_id:e.target.value})} className="w-full px-5 py-3.5 text-[13px] font-black text-slate-900 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-600/10 outline-none placeholder:uppercase" placeholder="TXN123456" />
               </div>
               <div className="bg-emerald-600/5 p-6 rounded-[24px] border border-emerald-100/50 text-emerald-600">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Total</span>
                     <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded italic">GST {formData.gst_rate}%</span>
                  </div>
                  <div className="text-3xl font-black tracking-tighter">₹{formData.total_amount.toLocaleString()}</div>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 italic">Base: ₹{formData.amount} | Tax: ₹{formData.cgst + formData.sgst}</p>
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-8 py-3.5 text-[11px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Abort</button>
            <button type="submit" disabled={loading} className="px-12 py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 shadow-2xl shadow-emerald-100 transition-all disabled:opacity-50">
              {loading ? 'Processing...' : 'Verify & Generate Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
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
  const [activeTx, setActiveTx] = useState(null); 
  const [generatingId, setGeneratingId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

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

  const handleBulkExport = async () => {
    if (selected.length === 0) {
      alert('Please select entries first');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/transactions/bulk-export', 
        { ids: selected }, 
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Zeal_Invoices_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed. Please ensure the backend is running and you have selected valid entries.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkWhatsApp = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Send WhatsApp bills to ${selected.length} users with safety delays?`)) return;
    
    setSendingWhatsApp(true);
    try {
      const res = await api.post('/transactions/bulk-whatsapp', { ids: selected });
      setSelected([]);
      navigate('/whatsapp-monitor'); // Redirect to monitor
    } catch (err) {
      alert('Bulk send failed. Ensure WhatsApp service is online.');
    } finally {
      setSendingWhatsApp(false);
    }
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
      {isCreateModalOpen && <CreateModal onClose={() => setIsCreateModalOpen(false)} onSave={() => { setIsCreateModalOpen(false); fetchTransactions(); }} />}
      
      {singleBill && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded flex items-center justify-center border border-emerald-100"><FileText className="w-4 h-4 text-emerald-600" /></div>
                <div>
                  <span className="text-sm font-black tracking-tight text-slate-900 block">{singleBill.name}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Bill Statement</span>
                </div>
              </div>
              <button onClick={() => setSingleBill(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"><X className="w-5 h-5" /></button>
            </div>
            <iframe src={singleBill.url} className="w-full flex-1 border-none bg-slate-50/50" title="Preview" />
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => generateInvoice(activeTx)} 
                disabled={generatingId === activeTx?.id}
                className="px-5 py-2 text-emerald-600 border border-emerald-100 rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                {generatingId === activeTx?.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                Sync
              </button>
              <a href={singleBill.url} download className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-all flex items-center gap-2">
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-8 pb-32">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 pb-8 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Performance Ledger</h1>
            <div className="flex items-center gap-2 mt-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-none">Database Online & Syncing</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLatestBatchOnly(!latestBatchOnly)}
              className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg border transition-all ${latestBatchOnly ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'}`}
            >
              Latest Upload
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2 text-[11px] font-black uppercase tracking-wider bg-emerald-600 text-white rounded-lg hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
            >
              <Plus className="w-3.5 h-3.5" />
              New Entry
            </button>
            <button 
              onClick={handleBulkExport}
              disabled={loading || selected.length === 0}
              className="px-4 py-2 text-[11px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-500 rounded-lg hover:border-emerald-400 hover:text-emerald-600 transition-all disabled:opacity-50"
            >
              Export
            </button>
            <button onClick={handleWipeAll} className="px-4 py-2 text-[11px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-50 rounded-lg transition-all">Clear All</button>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="bg-emerald-50/40 backdrop-blur-sm border-t border-b border-emerald-100/50 px-8 py-4 flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
                <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">
                  {selectAllAll ? `All ${data.total} records secured` : `${selected.length} entries selected`}
                </span>
              </div>
              {!selectAllAll && data.total > data.items.length && (
                <button onClick={() => setSelectAllAll(true)} className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 underline underline-offset-4 decoration-emerald-200 decoration-2 transition-all">
                  Commit all {data.total} to scope
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBulkWhatsApp}
                disabled={sendingWhatsApp}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 disabled:opacity-50"
              >
                {sendingWhatsApp ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3 h-3" />}
                Send Bills
              </button>
              <button 
                onClick={handleBulkDelete} 
                className="px-6 py-2.5 bg-white text-rose-500 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm"
              >
                Destroy Logs
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 items-center mb-6">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            <input 
              type="text" placeholder="Search by name, phone, transaction ID..." 
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-[13px] font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400"
            />
          </form>
          <div className="relative w-full md:w-48">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 text-[12px] font-black bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer hover:border-emerald-400 transition-all appearance-none text-slate-700">
              <option value="All">All Transactions</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-40 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
              <span className="text-[11px] font-black tracking-widest uppercase">Loading Ledger...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 w-10 text-center border-r border-slate-200">
                        <button onClick={toggleSelectAll} className="p-1 text-emerald-600 hover:text-emerald-800 transition-all">
                          {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Date</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Customer</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Phone</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Transaction ID</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Amount</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Items</th>
                      <th className="px-4 py-3 text-center text-[11px] font-black text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((tx) => {
                      const isSelected = selected.includes(tx.id);
                      return (
                        <tr key={tx.id} className={`transition-colors ${isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                          <td className="px-4 py-2.5 text-center border-r border-slate-100">
                            <button onClick={() => toggleSelect(tx.id)} className={`p-1 transition-all ${isSelected ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-600'}`}>
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-[12px] font-black text-slate-600 border-r border-slate-100">{tx.date || '--'}</td>
                          <td className="px-4 py-2.5 border-r border-slate-100">
                            <span className="text-[13px] font-black text-slate-900">{tx.name}</span>
                          </td>
                          <td className="px-4 py-2.5 border-r border-slate-100">
                            <span className="text-[12px] font-black text-slate-600">{tx.phone}</span>
                          </td>
                          <td className="px-4 py-2.5 border-r border-slate-100">
                             <div className="font-mono text-[11px] font-black text-slate-400 truncate max-w-[160px]">{tx.transaction_id}</div>
                          </td>
                          <td className="px-4 py-2.5 text-[12px] font-black text-slate-900 border-r border-slate-100">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2.5 border-r border-slate-100">
                            <p className="text-[12px] font-black text-slate-600 truncate max-w-[200px]" title={tx.product}>{tx.product || '-'}</p>
                          </td>
                          <td className="px-4 py-2.5 border-l border-slate-100">
                            <div className="flex items-center justify-center gap-3">
                              {generatingId === tx.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                              ) : (
                                <button 
                                  onClick={() => {
                                    setActiveTx(tx);
                                    tx.invoice_url ? setSingleBill({ url: `http://localhost:8000${tx.invoice_url}`, name: tx.name }) : generateInvoice(tx);
                                  }} 
                                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded transition-all ${tx.invoice_url ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                                  title={tx.invoice_url ? "View Bill" : "Generate Bill"}
                                >
                                  View
                                </button>
                              )}
                              <button onClick={() => setEditingTx(tx)} className="text-slate-300 hover:text-emerald-600 transition-all"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={async () => { if(window.confirm('Delete entry?')) { await api.delete(`/transactions/${tx.id}`); fetchTransactions(); } }} className="text-slate-300 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-10 py-8 flex items-center justify-between bg-slate-50/30 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{data.total} Signals Logged</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl bg-white hover:border-emerald-400 disabled:opacity-30 transition-all shadow-sm"><ChevronLeft className="w-5 h-5 text-emerald-600" /></button>
                  <div className="px-5 h-10 flex items-center justify-center text-[12px] font-black text-slate-900 bg-white border border-slate-200 rounded-xl select-none shadow-sm">{page + 1}</div>
                  <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * pageSize >= data.total} className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl bg-white hover:border-emerald-400 disabled:opacity-30 transition-all shadow-sm"><ChevronRight className="w-5 h-5 text-emerald-600" /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

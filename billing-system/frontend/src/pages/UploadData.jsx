import React, { useState, useRef, useContext, useEffect } from 'react';
import api from '../services/api';
import { downloadTransactionTemplate } from '../utils/sample_generator';
import { UploadCloud, FileSpreadsheet, CheckCircle2, Download, Shield, RefreshCw, History, X, FileText, File, Plus, Check, AlertCircle, MessageSquare, Smartphone, Loader2 } from 'lucide-react';
import { UploadContext } from '../context/UploadContext';
import WhatsAppLinkModal from '../components/WhatsAppLinkModal';

export default function UploadData() {
  const { files, setFiles } = useContext(UploadContext);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isWaConnected, setIsWaConnected] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [autoDispatch, setAutoDispatch] = useState(true);
  const fileInputRef = useRef(null);

  // Poll WhatsApp status
  useEffect(() => {
    const checkWa = async () => {
      try {
        const res = await api.get('http://localhost:3001/api/whatsapp/status');
        setIsWaConnected(res.data.status === 'CONNECTED');
      } catch (e) {
        setIsWaConnected(false);
      }
    };
    checkWa();
    const interval = setInterval(checkWa, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    const newFiles = selected.map(f => ({
      raw: f,
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
      status: 'READY'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSync = async () => {
    if (files.length === 0) return;

    // Check WhatsApp if auto-dispatch is enabled
    if (autoDispatch && !isWaConnected) {
      setIsWaModalOpen(true);
      setError('Please link WhatsApp before synchronizing to enable automated delivery.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    setFiles(prev => prev.map(f => ({ ...f, status: 'PROCESSING...' })));

    try {
      const formData = new FormData();
      formData.append('file', files[0].raw);

      // Upload and generate bills
      const { data } = await api.post('/transactions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      let statusMsg = `${data.message} — Ledger synchronized successfully!`;

      // Auto-dispatch if requested
      if (autoDispatch && data.batch_id) {
        setFiles(prev => prev.map(f => ({ ...f, status: 'DISPATCHING...' })));
        try {
          // Fetch the transactions for this batch and send them
          const txRes = await api.get('/transactions', { params: { latest_batch_only: true } });
          const batchItems = txRes.data.items;
          
          let sentOk = 0;
          for (const tx of batchItems) {
            if (tx.invoice_url) {
              await api.post(`/transactions/${tx.id}/send-whatsapp`);
              sentOk++;
            }
          }
          statusMsg += ` AND ${sentOk} bills dispatched via WhatsApp automatically!`;
        } catch (waErr) {
          console.error('Auto-dispatch failed:', waErr);
          statusMsg += " (WhatsApp auto-dispatch encountered an error, please check manually)";
        }
      }

      setSuccess(statusMsg);
      setFiles(prev => prev.map(f => ({ ...f, status: 'DONE' })));
      setTimeout(() => setFiles([]), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to sync ledger. Please check the file formats.');
      setFiles(prev => prev.map(f => ({ ...f, status: 'ERROR' })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isWaModalOpen && <WhatsAppLinkModal onClose={() => setIsWaModalOpen(false)} />}
      <div className="min-h-full bg-white p-8 md:p-12 xl:p-16 max-w-7xl mx-auto font-sans">
      <div className="mb-8 pl-1">
        <div className="flex items-center text-[10px] font-black tracking-widest text-[#94a3b8] uppercase mb-4">
          <span>Zeal Healing</span>
          <span className="mx-2 text-emerald-500">›</span>
          <span className="text-emerald-500">Ledger Upload</span>
        </div>
        <h1 className="text-3xl font-black text-[#1a1c23] tracking-tighter mb-3 uppercase">
          Upload Ledger
        </h1>
        <p className="text-[#64748b] text-[13px] max-w-3xl font-bold leading-relaxed">
          Import your financial statements. Supported formats: .CSV, .XLSX, and .PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Main Upload Area) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Dropzone Container - Minimalist Rectangle */}
          <div className="border border-slate-100 p-6 rounded-lg bg-white shadow-xl shadow-slate-100/30">
            <div className="border-2 border-dashed border-emerald-50 bg-white flex flex-col items-center justify-center py-20 px-8 text-center cursor-pointer hover:bg-emerald-50/10 transition-all relative rounded-lg group">
               <input 
                  type="file" 
                  ref={fileInputRef}
                  multiple
                  accept=".xlsx, .xls, .csv, .pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  onChange={handleFileSelect} 
                />
              <div className="mb-6 p-5 bg-emerald-50/50 rounded-lg group-hover:scale-105 transition-transform duration-500">
                <UploadCloud className="w-10 h-10 text-emerald-500/70" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-black text-[#1a1c23] mb-2 uppercase tracking-tighter">
                Drag and drop ledger files here
              </h3>
              <p className="text-[#94a3b8] text-[11px] mb-8 font-black uppercase tracking-widest">
                Maximum 50MB. Financial Documents.
              </p>
              
              <button 
                type="button" 
                className="pointer-events-none bg-emerald-500/90 hover:bg-emerald-600 text-white px-8 py-3 font-black text-[11px] rounded-lg shadow-md shadow-emerald-50 uppercase tracking-[0.1em]"
              >
                <Plus className="w-3.5 h-3.5 inline-block mr-2" strokeWidth={4} />
                Browse Files
              </button>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-50 py-5 px-6 flex items-center gap-4 rounded-lg shadow-sm">
              <Shield className="w-5 h-5 text-emerald-500/60" />
              <div>
                <h4 className="text-[9px] font-black text-slate-800 tracking-wider uppercase">Security</h4>
                <p className="text-[10px] text-[#94a3b8] font-black leading-tight uppercase">Active</p>
              </div>
            </div>
            <div className="bg-white border border-slate-50 py-5 px-6 flex items-center gap-4 rounded-lg shadow-sm">
              <RefreshCw className="w-5 h-5 text-emerald-500/60" />
              <div>
                <h4 className="text-[9px] font-black text-slate-800 tracking-wider uppercase">Sync</h4>
                <p className="text-[10px] text-[#94a3b8] font-black leading-tight uppercase">Direct</p>
              </div>
            </div>
            <div className="bg-white border border-slate-50 py-5 px-6 flex items-center gap-4 rounded-lg shadow-sm">
              <History className="w-5 h-5 text-emerald-500/60" />
              <div>
                <h4 className="text-[9px] font-black text-slate-800 tracking-wider uppercase">History</h4>
                <p className="text-[10px] text-[#94a3b8] font-black leading-tight uppercase">Tracked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Sync Box - Minimalist Softer Green */}
          <div className="bg-white border border-slate-50 rounded-lg shadow-xl shadow-slate-100/30 overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-[9px] font-black text-[#94a3b8] tracking-widest uppercase">Signals</h3>
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-0.5 rounded">{files.length} Files</span>
            </div>
            
            <div className="p-5 space-y-3 min-h-[120px] max-h-[250px] overflow-y-auto">
              {files.length === 0 ? (
                <div className="text-center py-6 text-[10px] font-black text-slate-200 uppercase tracking-widest leading-none">Queue Empty</div>
              ) : (
                files.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg group border border-transparent hover:border-emerald-100 transition-all">
                    <div className="overflow-hidden flex-1">
                        <p className="text-[11px] font-black text-[#1a1c23] truncate">{file.name}</p>
                        <p className="text-[9px] text-emerald-400 font-black tracking-widest mt-0.5 uppercase">{file.status}</p>
                    </div>
                    <button onClick={() => removeFile(idx)} className="text-slate-300 hover:text-rose-400 ml-3">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 pt-0">
               {error && <div className="mb-3 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-500 text-[10px] font-black uppercase text-center">{error}</div>}
               {success && <div className="mb-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-500 text-[10px] font-black uppercase text-center">{success}</div>}
               <button 
                 onClick={handleSync}
                 className="w-full bg-emerald-500/90 hover:bg-emerald-600 text-white py-4 font-black text-[11px] tracking-[0.1em] uppercase rounded-lg shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                 SYNC TO LEDGER
               </button>
            </div>
          </div>

          {/* WhatsApp Direct */}
          <div className="bg-emerald-50/30 border border-emerald-50 rounded-lg p-5 flex flex-col gap-5 shadow-sm">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-500/80 text-white rounded-lg shadow-sm">
                     <MessageSquare className="w-3.5 h-3.5" />
                   </div>
                   <div>
                     <h3 className="text-[9px] font-black tracking-widest uppercase text-slate-700 leading-none">WhatsApp Flow</h3>
                     <p className="text-[9px] text-emerald-500/70 font-black uppercase mt-1">{isWaConnected ? 'Linked' : 'Offline'}</p>
                   </div>
                </div>
                {!isWaConnected && <button onClick={() => setIsWaModalOpen(true)} className="text-[9px] font-black text-emerald-500 underline uppercase">Link</button>}
             </div>
             
             <div className="flex items-center justify-between bg-white/80 p-3 rounded-lg border border-emerald-50">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Auto-Dispatch</span>
               <div 
                 onClick={() => setAutoDispatch(!autoDispatch)}
                 className={`w-9 h-4.5 rounded-full relative cursor-pointer transition-all ${autoDispatch ? 'bg-emerald-500/80' : 'bg-slate-200'}`}
               >
                 <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${autoDispatch ? 'left-5' : 'left-0.5'}`} />
               </div>
             </div>
          </div>

          {/* Execution Rules - Minimalist White */}
          <div className="bg-white border border-slate-50 rounded-lg p-7 shadow-xl shadow-slate-100/20">
             <h3 className="text-[9px] font-black text-slate-300 tracking-[0.15em] uppercase mb-6 border-b border-slate-50 pb-3">Ledger Rules</h3>
             <ul className="space-y-5">
               <li className="flex gap-3">
                 <div className="flex-shrink-0 w-4 h-4 bg-emerald-500/60 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={5} />
                 </div>
                 <span className="text-[10px] font-black text-slate-500 uppercase leading-snug tracking-tighter text-left">Columns: Date, Entity, Amount.</span>
               </li>
               <li className="flex gap-3">
                 <div className="flex-shrink-0 w-4 h-4 bg-emerald-500/60 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={5} />
                 </div>
                 <span className="text-[10px] font-black text-slate-500 uppercase leading-snug tracking-tighter text-left">Format: YYYY-MM-DD only.</span>
               </li>
             </ul>
          </div>
          
        </div>
      </div>
    </div>
  </>
);
}

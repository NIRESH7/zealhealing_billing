import React, { useState, useRef, useContext } from 'react';
import api from '../services/api';
import { downloadTransactionTemplate } from '../utils/sample_generator';
import { UploadCloud, FileSpreadsheet, CheckCircle2, Download, Shield, RefreshCw, History, X, FileText, File, Plus, Check, AlertCircle, MessageSquare, Smartphone } from 'lucide-react';
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
  React.useEffect(() => {
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
        <div className="flex items-center text-[10px] font-black tracking-widest text-slate-500 uppercase mb-5">
          <span>BILLINGSYNC</span>
          <span className="mx-2">›</span>
          <span>UPLOAD LEDGER</span>
        </div>
        <h1 className="text-4xl font-black text-[#1a1c23] tracking-tight mb-4 uppercase">
          Upload Ledger
        </h1>
        <p className="text-[#596375] text-base max-w-3xl leading-relaxed font-bold">
          Import your financial statements and ledger entries. Supported formats: .CSV, .XLSX, and .PDF. Data will be synchronized across your active projects.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Main Upload Area) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Dropzone Container */}
          <div className="border border-slate-200 p-6 rounded-3xl bg-white shadow-sm overflow-hidden">
            <div className="border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center py-24 px-8 text-center cursor-pointer hover:bg-emerald-50/20 transition-all relative rounded-2xl group">
               <input 
                  type="file" 
                  ref={fileInputRef}
                  multiple
                  accept=".xlsx, .xls, .csv, .pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  onChange={handleFileSelect} 
                />
              <div className="mb-6 flex items-center justify-center">
                <UploadCloud className="w-16 h-16 text-emerald-500/50 group-hover:scale-110 group-hover:text-emerald-500 transition-all duration-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-[#1a1c23] mb-3 uppercase">
                Drag and drop ledger files here
              </h3>
              <p className="text-[#596375] text-sm mb-10 font-bold">
                Strictly limited to financial document types. Maximum file size: 50MB.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 relative z-20 pointer-events-none">
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="pointer-events-auto bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3.5 font-black text-[12px] transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-emerald-100 uppercase tracking-widest"
                >
                  <Plus className="w-4 h-4" strokeWidth={3} />
                  Browse Files
                </button>
              </div>
            </div>
          </div>

          {/* Feature Cards below Dropzone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-2">
            <div className="bg-white border border-slate-100 py-6 px-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 rounded-2xl shadow-sm">
              <div className="shrink-0 mt-0.5">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-800 tracking-wider">SECURITY</h4>
                <p className="text-xs text-slate-600 mt-1 leading-snug font-bold">AES-256<br/>Encrypted</p>
              </div>
            </div>
            
            <div className="bg-white border border-slate-100 py-6 px-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 rounded-2xl shadow-sm">
               <div className="shrink-0 mt-0.5">
                <RefreshCw className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-800 tracking-wider">AUTOMATION</h4>
                <p className="text-xs text-slate-600 mt-1 leading-snug font-bold">Auto-<br/>Categorization</p>
              </div>
            </div>
            
            <div className="bg-white border border-slate-100 py-6 px-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 rounded-2xl shadow-sm">
               <div className="shrink-0 mt-0.5">
                <History className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-800 tracking-wider">ARCHIVAL</h4>
                <p className="text-xs text-slate-600 mt-1 leading-snug font-bold">7 Year<br/>Retention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Queued Uploads Card */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-[10px] font-black text-slate-600 tracking-widest uppercase">Queued Uploads</h3>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">{files.length} Files</span>
            </div>
            
            <div className="p-6 space-y-3 min-h-[220px] max-h-[350px] overflow-y-auto custom-scrollbar">
              {files.length === 0 ? (
                 <div className="text-center py-10 text-slate-300 text-[11px] font-bold uppercase tracking-widest">
                   No signals in queue
                 </div>
              ) : (
                files.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-start bg-slate-50 p-4 rounded-xl group relative border border-slate-100 transition-all hover:border-emerald-200">
                    <div className="flex gap-4 w-full">
                      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0 border border-slate-200">
                         {file.name.endsWith('.pdf') ? (
                            <FileText className="w-4 h-4 text-emerald-600" />
                         ) : file.name.endsWith('.csv') || file.name.endsWith('.xlsx') ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                         ) : (
                            <File className="w-4 h-4 text-emerald-600" />
                         )}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="text-[12px] font-black text-[#1a1c23] truncate w-11/12">{file.name}</p>
                        <p className="text-[10px] text-[#596375] uppercase tracking-wider font-black mt-1">
                          {file.size} • <span className={file.status === 'PROCESSING...' ? 'text-amber-600' : file.status === 'DONE' ? 'text-emerald-600' : file.status === 'ERROR' ? 'text-rose-600' : ''}>{file.status}</span>
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(idx)}
                      className="text-slate-300 hover:text-rose-500 transition-colors absolute top-4 right-4 p-1 rounded-md hover:bg-rose-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 pt-0 bg-white">
               {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5" />
                  <p className="text-[11px] text-rose-600 font-black uppercase leading-tight">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <p className="text-[11px] text-emerald-600 font-black uppercase leading-tight">{success}</p>
                </div>
              )}
              <button 
                onClick={handleSync}
                disabled={files.length === 0 || loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 font-black text-[11px] tracking-widest uppercase transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {autoDispatch && isWaConnected ? 'SYNC & DISPATCH' : 'SYNC TO LEDGER'}
              </button>
            </div>
          </div>

          {/* WhatsApp Automation Card */}
          <div className={`rounded-3xl border p-6 transition-all shadow-sm ${isWaConnected ? 'bg-emerald-50/40 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-5">
               <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isWaConnected ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-500'}`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black tracking-widest uppercase">WhatsApp Direct</h3>
                    <p className={`text-[10px] font-black uppercase mt-0.5 ${isWaConnected ? 'text-emerald-600' : 'text-slate-400'}`}>Status: {isWaConnected ? 'Ready' : 'Not Linked'}</p>
                  </div>
               </div>
               {!isWaConnected && (
                 <button 
                   onClick={() => setIsWaModalOpen(true)}
                   className="text-[10px] font-black text-emerald-600 underline underline-offset-4 tracking-widest uppercase hover:text-emerald-800 transition-all"
                 >
                   LINK NOW
                 </button>
               )}
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer group">
               <div 
                 onClick={() => setAutoDispatch(!autoDispatch)}
                 className={`w-10 h-5 rounded-full relative transition-colors ${autoDispatch ? 'bg-emerald-600 shadow-md shadow-emerald-100' : 'bg-slate-300'}`}
               >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoDispatch ? 'left-6' : 'left-1'}`} />
               </div>
               <span className="text-[11px] font-black text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-tight">
                 Auto-dispatch bills via WhatsApp
               </span>
            </label>
          </div>

          {/* Formatting Rules */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8">
             <h3 className="text-[10px] font-black text-slate-800 tracking-widest uppercase mb-6">Execution Rules</h3>
             <ul className="space-y-4">
               <li className="flex gap-4 text-[12px] text-[#596375] font-bold">
                 <div className="mt-0.5 bg-emerald-600 rounded-full p-1.5 flex items-center justify-center flex-shrink-0 h-5 w-5">
                    <Check className="w-3 h-3 text-white" strokeWidth={4} />
                 </div>
                 <span className="leading-snug uppercase">Columns: Date, Entity, and Amount.</span>
               </li>
               <li className="flex gap-4 text-[12px] text-[#596375] font-bold">
                 <div className="mt-0.5 bg-emerald-600 rounded-full p-1.5 flex items-center justify-center flex-shrink-0 h-5 w-5">
                    <Check className="w-3 h-3 text-white" strokeWidth={4} />
                 </div>
                 <span className="leading-snug uppercase">ISO Date: YYYY-MM-DD.</span>
               </li>
               <li className="flex gap-4 text-[12px] text-[#596375] font-bold">
                 <div className="mt-0.5 bg-emerald-600 rounded-full p-1.5 flex items-center justify-center flex-shrink-0 h-5 w-5">
                    <Check className="w-3 h-3 text-white" strokeWidth={4} />
                 </div>
                 <span className="leading-snug uppercase">UTF-8 Encoded CSV required.</span>
               </li>
             </ul>
          </div>
          
        </div>
      </div>
    </div>
  </>
);
}

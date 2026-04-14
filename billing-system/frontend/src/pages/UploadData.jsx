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
        <div className="flex items-center text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-5">
          <span>BILLINGSYNC</span>
          <span className="mx-2">›</span>
          <span>UPLOAD LEDGER</span>
        </div>
        <h1 className="text-4xl font-extrabold text-[#1a1c23] tracking-tight mb-4">
          Upload Ledger
        </h1>
        <p className="text-[#596375] text-base max-w-3xl leading-relaxed">
          Import your financial statements and ledger entries. Supported formats: .CSV, .XLSX, and .PDF. Data will be synchronized across your active projects.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Main Upload Area) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Dropzone Container */}
          <div className="border border-slate-200 p-6 rounded-sm bg-white">
            <div className="border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center py-24 px-8 text-center cursor-pointer hover:bg-slate-50 transition-colors relative">
               <input 
                  type="file" 
                  ref={fileInputRef}
                  multiple
                  accept=".xlsx, .xls, .csv, .pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  onChange={handleFileSelect} 
                />
              <div className="mb-6 flex items-center justify-center">
                {/* Just the plain icon mimicking the image */}
                <UploadCloud className="w-16 h-16 text-[#9CA6B8] group-hover:scale-105 transition-transform" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-semibold text-[#1a1c23] mb-3">
                Drag and drop ledger files here
              </h3>
              <p className="text-[#596375] text-sm mb-10">
                Strictly limited to financial document types. Maximum file size: 50MB.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 relative z-20 pointer-events-none">
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="pointer-events-auto bg-[#4264AB] hover:bg-[#345291] text-white px-8 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 rounded-sm shadow-sm"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Browse Files
                </button>
              </div>
            </div>
          </div>

          {/* Feature Cards below Dropzone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-2">
            <div className="bg-white border border-slate-200 py-5 px-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 rounded-sm">
              <div className="shrink-0 mt-0.5">
                <Shield className="w-6 h-6 text-[#4264AB]" fill="#4264AB" color="white" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-800 tracking-wider">SECURITY</h4>
                <p className="text-xs text-slate-600 mt-1 leading-snug">AES-256<br/>Encrypted</p>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 py-5 px-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 rounded-sm">
               <div className="shrink-0 mt-0.5">
                <RefreshCw className="w-6 h-6 text-[#4264AB]" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-800 tracking-wider">AUTOMATION</h4>
                <p className="text-xs text-slate-600 mt-1 leading-snug">Auto-<br/>Categorization</p>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 py-5 px-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 rounded-sm">
               <div className="shrink-0 mt-0.5">
                <History className="w-6 h-6 text-[#4264AB]" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-800 tracking-wider">ARCHIVAL</h4>
                <p className="text-xs text-slate-600 mt-1 leading-snug">7 Year<br/>Retention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Queued Uploads Card */}
          <div className="bg-white border border-slate-200 rounded-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">QUEUED UPLOADS</h3>
              <span className="text-[10px] font-bold text-[#4264AB] uppercase tracking-widest">{files.length} FILES</span>
            </div>
            
            <div className="p-6 space-y-3 min-h-[220px] max-h-[350px] overflow-y-auto">
              {files.length === 0 ? (
                 <div className="text-center py-6 text-slate-400 text-sm">
                   No files queued for upload.
                 </div>
              ) : (
                files.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-start bg-[#F4F5F7] p-4 rounded-sm group relative">
                    <div className="flex gap-4 w-full">
                      <div className="w-9 h-9 bg-[#E3E6EB] rounded-sm flex items-center justify-center shrink-0">
                         {file.name.endsWith('.pdf') ? (
                            <FileText className="w-4 h-4 text-[#596375]" />
                         ) : file.name.endsWith('.csv') || file.name.endsWith('.xlsx') ? (
                            <FileSpreadsheet className="w-4 h-4 text-[#596375]" />
                         ) : (
                            <File className="w-4 h-4 text-[#596375]" />
                         )}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="text-sm font-semibold text-[#1a1c23] truncate w-11/12">{file.name}</p>
                        <p className="text-[10px] text-[#596375] uppercase tracking-wider font-semibold mt-1">
                          {file.size} • <span className={file.status === 'PROCESSING...' ? 'text-amber-600' : file.status === 'DONE' ? 'text-green-600' : file.status === 'ERROR' ? 'text-red-600' : ''}>{file.status}</span>
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-[#D94E4E] transition-colors absolute top-4 right-4"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 pt-0 bg-white">
               {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <p className="text-xs text-emerald-600 font-medium">{success}</p>
                </div>
              )}
              <button 
                onClick={handleSync}
                disabled={files.length === 0 || loading}
                className="w-full bg-[#4264AB] hover:bg-[#345291] text-white py-4 font-bold text-[11px] tracking-widest uppercase transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                {autoDispatch && isWaConnected ? 'SYNC & DISPATCH' : 'SYNC TO LEDGER'}
              </button>
            </div>
          </div>

          {/* WhatsApp Automation Card */}
          <div className={`rounded-sm border p-6 transition-all ${isWaConnected ? 'bg-green-50/50 border-green-100' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isWaConnected ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold tracking-widest uppercase">WhatsApp Automation</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Status: {isWaConnected ? 'CONNECTED' : 'NOT LINKED'}</p>
                  </div>
               </div>
               {!isWaConnected && (
                 <button 
                   onClick={() => setIsWaModalOpen(true)}
                   className="text-[10px] font-bold text-[#4264AB] underline tracking-widest uppercase"
                 >
                   LINK NOW
                 </button>
               )}
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer group">
               <div 
                 onClick={() => setAutoDispatch(!autoDispatch)}
                 className={`w-10 h-5 rounded-full relative transition-colors ${autoDispatch ? 'bg-green-500' : 'bg-slate-300'}`}
               >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoDispatch ? 'left-6' : 'left-1'}`} />
               </div>
               <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                 Auto-dispatch bills via WhatsApp after sync
               </span>
            </label>
          </div>

          {/* Formatting Rules */}
          <div className="bg-[#EEF1F5] rounded-sm p-7">
             <h3 className="text-[10px] font-bold text-slate-800 tracking-widest uppercase mb-5">FORMATTING RULES</h3>
             <ul className="space-y-4">
               <li className="flex gap-3 text-sm text-[#596375]">
                 <div className="mt-0.5 bg-[#4264AB] rounded-full p-[3px] flex items-center justify-center flex-shrink-0 h-4 w-4">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                 </div>
                 <span className="leading-snug">Columns must include Date, Entity, and Amount.</span>
               </li>
               <li className="flex gap-3 text-sm text-[#596375]">
                 <div className="mt-0.5 bg-[#4264AB] rounded-full p-[3px] flex items-center justify-center flex-shrink-0 h-4 w-4">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                 </div>
                 <span className="leading-snug">Date format: YYYY-MM-DD.</span>
               </li>
               <li className="flex gap-3 text-sm text-[#596375]">
                 <div className="mt-0.5 bg-[#4264AB] rounded-full p-[3px] flex items-center justify-center flex-shrink-0 h-4 w-4">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                 </div>
                 <span className="leading-snug">UTF-8 Encoding required for CSV.</span>
               </li>
             </ul>
          </div>
          
        </div>
      </div>
    </div>
  </>
);
}

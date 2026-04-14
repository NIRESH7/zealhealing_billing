import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { Search, FileText, Eye, Download, X, Loader2, CheckSquare, Square, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';

// --- View ALL Bills Carousel Modal ---
function ViewAllModal({ bills, onClose }) {
  const [index, setIndex] = useState(0);
  if (!bills || bills.length === 0) return null;

  const current = bills[index];
  const url = `http://localhost:8000${current.invoice_url}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{current.name}</p>
              <p className="text-xs text-gray-500">
                Bill {index + 1} of {bills.length} &nbsp;·&nbsp; ₹{Number(current.amount).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Prev */}
            <button
              disabled={index === 0}
              onClick={() => setIndex(i => i - 1)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* Counter pills */}
            <div className="flex gap-1 px-2">
              {bills.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-primary w-4' : 'bg-gray-300'}`}
                />
              ))}
            </div>
            {/* Next */}
            <button
              disabled={index === bills.length - 1}
              onClick={() => setIndex(i => i + 1)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {/* Download current */}
            <a
              href={url}
              download
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* PDF viewer */}
        <div className="flex-1 bg-gray-100">
          <iframe key={url} src={url} className="w-full h-full border-0" title="Invoice Preview" />
        </div>
      </div>
    </div>
  );
}

// --- Single Invoice Modal ---
function InvoiceModal({ url, name, onClose }) {
  if (!url) return null;
  const fullUrl = url.startsWith('http') ? url : `http://localhost:8000${url}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{name || 'Invoice'}</p>
              <p className="text-xs text-gray-500">PDF Document</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={fullUrl} download className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
              <Download className="w-4 h-4" />Download
            </a>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100">
          <iframe src={fullUrl} className="w-full h-full border-0" title="Invoice Preview" />
        </div>
      </div>
    </div>
  );
}

// --- Status Badge ---
const StatusBadge = ({ status }) => {
  const styles = {
    Pending:  'bg-yellow-100 text-yellow-800 border-yellow-200',
    Verified: 'bg-green-100 text-green-800 border-green-200',
    Rejected: 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

export default function Transactions() {
  const { searchQuery } = useOutletContext();
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Sync global search with local search
  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearch(searchQuery);
    }
  }, [searchQuery]);

  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState([]);
  const [singleBill, setSingleBill] = useState(null); // { url, name }
  const [viewAllBills, setViewAllBills] = useState(null); // array of tx
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkWaLoading, setBulkWaLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => { fetchTransactions(); }, [search, statusFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/transactions', { params: { search, status: statusFilter, latest_batch_only: true } });
      setData(res);
      setSelected([]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Checkbox logic
  const allIds = data.items.map(t => t.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.includes(id));
  const toggleSelectAll = () => setSelected(allSelected ? [] : allIds);
  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Generate invoice for single row
  const generateInvoice = async (tx) => {
    setGeneratingId(tx.id);
    try {
      const res = await api.post(`/transactions/${tx.id}/generate-invoice`);
      await fetchTransactions();
      if (res.data?.url) setSingleBill({ url: `http://localhost:8000${res.data.url}`, name: tx.name });
    } catch (err) { alert(err.response?.data?.detail || 'Error generating invoice'); }
    finally { setGeneratingId(null); }
  };

  // "View All Bills" for selected rows
  const handleViewAll = async () => {
    const selectedTxs = data.items.filter(t => selected.includes(t.id));
    setBulkLoading(true);

    // Generate any that don't have invoices yet
    const updated = [...selectedTxs];
    for (let i = 0; i < updated.length; i++) {
      const tx = updated[i];
      if (!tx.invoice_url) {
        try {
          const res = await api.post(`/transactions/${tx.id}/generate-invoice`);
          if (res.data?.url) updated[i] = { ...tx, invoice_url: res.data.url };
        } catch (err) { console.error('Failed for', tx.name); }
      }
    }

    setBulkLoading(false);
    // Show carousel with all bills that have invoices
    const withInvoices = updated.filter(t => t.invoice_url);
    if (withInvoices.length > 0) setViewAllBills(withInvoices);
    await fetchTransactions();
  };

  const handleBulkWhatsAppSend = async () => {
    const selectedTxs = data.items.filter(t => selected.includes(t.id));
    if (!selectedTxs.length) return;
    
    setBulkWaLoading(true);
    let sentCount = 0;
    
    for (let i = 0; i < selectedTxs.length; i++) {
       const tx = selectedTxs[i];
       if (tx.invoice_url && !tx.whatsapp_sent) {
           try {
               await api.post(`/transactions/${tx.id}/send-whatsapp`);
               sentCount++;
           } catch(e) { console.error('WhatsApp dispatch failed for', tx.name) }
       }
    }
    
    setBulkWaLoading(false);
    alert(`Successfully dispatched ${sentCount} invoices via WhatsApp!`);
    await fetchTransactions(); // refresh
  };

  const selectedTxs = data.items.filter(t => selected.includes(t.id));

  return (
    <>
      {/* Modals */}
      {viewAllBills && (
        <ViewAllModal bills={viewAllBills} onClose={() => setViewAllBills(null)} />
      )}
      {singleBill && !viewAllBills && (
        <InvoiceModal url={singleBill.url} name={singleBill.name} onClose={() => setSingleBill(null)} />
      )}

      <div className="space-y-5">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              placeholder="Search name, phone, tx ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="pl-4 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Pending</option>
            <option>Verified</option>
            <option>Rejected</option>
          </select>

          {/* VIEW ALL BILLS button — shown when items selected */}
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl">
              <span className="text-xs font-bold text-primary">{selected.length} selected</span>
              
              <button
                onClick={handleViewAll}
                disabled={bulkLoading || bulkWaLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-60 shadow-sm"
              >
                {bulkLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing...</>
                  : <><Eye className="w-4 h-4" /> View All Bills</>
                }
              </button>

              <button
                onClick={handleBulkWhatsAppSend}
                disabled={bulkLoading || bulkWaLoading}
                className="flex items-center gap-2 px-5 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-all disabled:opacity-60 shadow-sm"
              >
                {bulkWaLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending WhatsApp...</>
                  : <><MessageCircle className="w-4 h-4" /> Send WhatsApp</>
                }
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="pl-5 pr-2 py-3 w-10">
                      <button onClick={toggleSelectAll} className="text-gray-400 hover:text-primary transition-colors">
                        {allSelected
                          ? <CheckSquare className="w-5 h-5 text-primary" />
                          : <Square className="w-5 h-5" />
                        }
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider">Tx ID</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold text-gray-900 uppercase tracking-wider">Bill</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.items.map((tx) => {
                    const isSelected = selected.includes(tx.id);
                    return (
                      <tr key={tx.id} className={`transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50/80'}`}>
                        <td className="pl-5 pr-2 py-4 w-10">
                          <button onClick={() => toggleSelect(tx.id)} className="text-gray-300 hover:text-primary transition-colors">
                            {isSelected
                              ? <CheckSquare className="w-5 h-5 text-primary" />
                              : <Square className="w-5 h-5" />
                            }
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold text-gray-900">{tx.name}</div>
                          {tx.email && <div className="text-xs text-gray-400">{tx.email}</div>}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-700">{tx.phone}</td>
                        <td className="px-4 py-4 text-sm font-mono text-gray-500">{tx.transaction_id}</td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-900">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {tx.product || 'General'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {tx.whatsapp_sent && (
                               <span className="flex items-center text-green-500 mr-2" title="Sent on WhatsApp">
                                  <CheckSquare className="w-4 h-4" />
                               </span>
                            )}
                            {tx.invoice_url ? (
                              <>
                                <button
                                  onClick={() => setSingleBill({ url: `http://localhost:8000${tx.invoice_url}`, name: tx.name })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-all border border-blue-100"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Bill
                                </button>
                                <button
                                  onClick={async () => {
                                      try {
                                          await api.post(`/transactions/${tx.id}/send-whatsapp`);
                                          alert('Sent successfully!');
                                          fetchTransactions();
                                      } catch(e) { alert('Failed sending.'); }
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-all border border-green-100"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Send
                                </button>
                              </>
                            ) : (
                            <button
                              onClick={() => generateInvoice(tx)}
                              disabled={generatingId === tx.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
                            >
                              {generatingId === tx.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <FileText className="w-3.5 h-3.5" />
                              }
                              Generate
                            </button>
                          )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {data.items.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center text-gray-400 text-sm">
                        No transactions found. Upload a file to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {data.total > 0 && (
          <p className="text-xs text-gray-400 text-right">
            Showing {data.items.length} of {data.total} transactions
          </p>
        )}
      </div>
    </>
  );
}

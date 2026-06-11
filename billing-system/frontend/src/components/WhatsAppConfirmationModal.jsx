import React from 'react';
import { X, MessageCircle, AlertCircle } from 'lucide-react';

export default function WhatsAppConfirmationModal({ isOpen, onClose, onConfirm, transactions = [] }) {
  if (!isOpen) return null;

  const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.total_amount || 0), 0);

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Confirm WhatsApp Dispatch</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Review Recipients before Sending</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-8 py-3 bg-amber-50/60 border-b border-amber-100/50 flex items-center gap-2.5 text-amber-800 text-[11px] font-bold">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Please ensure the WhatsApp service is connected. Messages will be sent with automated safety delays.</span>
        </div>

        {/* Content - Recipient List */}
        <div className="p-8 overflow-y-auto flex-1 space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Recipients</span>
              <span className="text-xl font-black text-slate-800">{transactions.length} Customers</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Total Bill Amount</span>
              <span className="text-xl font-black text-emerald-600">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="border border-slate-150 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[40vh]">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">WhatsApp No</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Bill No</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {transactions.map((tx, idx) => (
                    <tr key={tx.id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-black text-slate-800 block">{tx.name || '--'}</span>
                        {tx.product && <span className="text-[9px] text-slate-400 font-bold block max-w-[150px] truncate">{tx.product}</span>}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-bold text-slate-600">{tx.phone || '--'}</td>
                      <td className="px-4 py-3 text-[12px] font-mono font-bold text-slate-500">{tx.invoice_number || tx.transaction_id || '--'}</td>
                      <td className="px-4 py-3 text-right text-[12px] font-black text-slate-800">
                        ₹{Number(tx.total_amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 text-[11px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-8 py-2.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-100/50 transition-all flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Confirm & Send WhatsApp
          </button>
        </div>

      </div>
    </div>
  );
}

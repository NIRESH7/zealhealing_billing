import React, { useState, useEffect } from 'react';
import { QrCode, Smartphone, X, CheckCircle2, Loader2, Info } from 'lucide-react';
import axios from 'axios';

export default function WhatsAppLinkModal({ onClose }) {
  const [status, setStatus] = useState('LOADING');
  const [qrCode, setQrCode] = useState(null);

  // Poll Node.js service for status & QR
  useEffect(() => {
    let interval;
    const checkStatus = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/whatsapp/qr');
        setStatus(res.data.status || 'DISCONNECTED');
        if (res.data.qr) {
          setQrCode(res.data.qr);
        }
      } catch (error) {
        setStatus('OFFLINE');
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 3000); // Check every 3s

    return () => clearInterval(interval);
  }, []);

  // Auto-close on success
  useEffect(() => {
    if (status === 'CONNECTED') {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900">Link WhatsApp</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center text-center">
          {status === 'LOADING' && (
            <div className="py-12 flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-green-500 mb-4" />
              <p className="text-gray-500 font-medium">Initializing Background Engine...</p>
            </div>
          )}

          {status === 'OFFLINE' && (
             <div className="py-10 flex flex-col items-center gap-2">
                 <div className="p-4 bg-red-100 rounded-full mb-2">
                    <X className="w-8 h-8 text-red-500" />
                 </div>
                 <h4 className="font-bold text-gray-900">Service Offline</h4>
                 <p className="text-sm text-gray-500">The WhatsApp microservice is not running. Please start the Node.js server.</p>
             </div>
          )}

          {status === 'CONNECTED' && (
            <div className="py-10 flex flex-col items-center gap-2">
              <div className="p-4 bg-green-100 rounded-full mb-2">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h4 className="font-bold text-gray-900 text-lg">WhatsApp Connected!</h4>
              <p className="text-sm text-gray-500 max-w-[250px]">
                Your device is linked. You can now automatically dispatch invoices directly to customers.
              </p>
            </div>
          )}

          {(status === 'DISCONNECTED' || status === 'QR_READY') && (
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-3xl border-2 border-dashed border-green-200 mb-6 relative">
                {qrCode ? (
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-56 h-56 rounded-xl block" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-gray-50 rounded-xl">
                     <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                )}
                {/* Scanner decorative overlay */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
              </div>

              <h4 className="font-bold text-gray-900 mb-2">Scan to Link System</h4>
              
              <ul className="text-left text-sm text-gray-500 space-y-3 w-full max-w-[280px]">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                  <span>Open WhatsApp on your mobile phone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                  <span>Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                  <span>Point your phone to this screen to capture the code.</span>
                </li>
              </ul>
            </div>
          )}

        </div>

        <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-100 flex items-start gap-3">
           <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
           <p className="text-xs text-yellow-800 font-medium leading-relaxed">
             WhatsApp requires your phone to stay connected to the internet. Do not log out from the Linked Devices screen on your phone.
           </p>
        </div>
      </div>
    </div>
  );
}

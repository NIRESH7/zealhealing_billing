import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Database, Plus, Search, Edit2, Trash2, X, Check, Package, MoreVertical } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sub_category: '',
    price_india: '',
    price_abroad: '',
    gst_rate: '',
    hsn_code: '',
    is_service: false
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: { search } });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        sub_category: product.sub_category || '',
        price_india: product.price_india,
        price_abroad: product.price_abroad,
        gst_rate: product.gst_rate,
        hsn_code: product.hsn_code || '',
        is_service: product.is_service || false
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        sub_category: '',
        price_india: '',
        price_abroad: '',
        gst_rate: '',
        hsn_code: '',
        is_service: false
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        price_india: parseFloat(formData.price_india),
        price_abroad: parseFloat(formData.price_abroad),
        gst_rate: parseFloat(formData.gst_rate)
      };
      
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, dataToSubmit);
      } else {
        await api.post('/products/', dataToSubmit);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert('Failed to save product');
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col font-sans">
      {/* Header */}
      <div className="mb-8 pl-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-[10px] font-bold tracking-widest text-indigo-600 uppercase mb-4">
              <Package className="w-3.5 h-3.5 mr-2" />
              <span>MASTER INVENTORY</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Products & Services
            </h1>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed font-medium">
              Manage your predefined Tarot services, Crystals, and Medicines. Changes made here will reflect instantly in the Billing Dashboard.
            </p>
          </div>
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            Add New Item
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 relative group max-w-xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
        <input 
          type="text" 
          placeholder="Search products, categories or HSN..."
          className="w-full bg-white border border-slate-200/60 rounded-[20px] py-4 pl-14 pr-6 text-[13px] font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/60 rounded-[32px] flex-1 flex flex-col overflow-hidden shadow-xl shadow-slate-200/20">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-100/60">
                <th className="px-10 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Inventory Identity</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 text-center">Category</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 text-right">India (₹)</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 text-right">Abroad (₹)</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 text-center">GST %</th>
                <th className="px-10 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-medium italic">Synchronizing inventory data...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-medium">No items found matching your search.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{p.name}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest border border-slate-100 px-1.5 py-0.5 rounded-md">HSN: {p.hsn_code || '---'}</span>
                           {p.is_service && <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded-md">Service</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-900 text-[13px] text-right tabular-nums">₹{p.price_india.toLocaleString()}</td>
                    <td className="px-8 py-5 font-black text-slate-900 text-[13px] text-right tabular-nums">₹{p.price_abroad.toLocaleString()}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${p.gst_rate > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                        {p.gst_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(p)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {editingProduct ? 'Update Item' : 'New Inventory Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                <input 
                  required
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Black Tourmaline Bracelet"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <select 
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    <option value="Tarot">Tarot</option>
                    <option value="Crystals">Crystals</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Classes">Classes</option>
                    <option value="Healing">Healing</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">HSN Code</label>
                  <input 
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none"
                    value={formData.hsn_code}
                    onChange={(e) => setFormData({...formData, hsn_code: e.target.value})}
                    placeholder="8-digit code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">India Price (₹)</label>
                  <input 
                    type="number" required
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none"
                    value={formData.price_india}
                    onChange={(e) => setFormData({...formData, price_india: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Abroad Price (₹)</label>
                  <input 
                    type="number" required
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none"
                    value={formData.price_abroad}
                    onChange={(e) => setFormData({...formData, price_abroad: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GST Rate (%)</label>
                  <input 
                    type="number" required step="0.01"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none"
                    value={formData.gst_rate}
                    onChange={(e) => setFormData({...formData, gst_rate: e.target.value})}
                  />
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={formData.is_service}
                        onChange={(e) => setFormData({...formData, is_service: e.target.checked})}
                      />
                      <div className={`w-10 h-6 rounded-full transition-colors ${formData.is_service ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_service ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">Mark as Service</span>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-black tracking-tight hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100"
                >
                  {editingProduct ? 'Commit Changes' : 'Create Inventory Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

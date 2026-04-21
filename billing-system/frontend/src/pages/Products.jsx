import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Edit3, Trash2, X, ChevronLeft, ChevronRight, Filter, Database, Package, Loader2 } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      setCurrentPage(1); // Reset to first page on search
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
    if (window.confirm('Delete this product?')) {
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

  // Filtering Logic
  const filteredProducts = products.filter(p => {
    if (categoryFilter === 'All') return true;
    return p.category === categoryFilter;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  return (
    <div className="flex flex-col h-full font-sans text-slate-700">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-400" />
            Inventory Catalog
          </h1>
          <p className="text-[12px] text-slate-400 font-medium">Manage product pricing and tax details</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-slate-900 text-white px-4 py-2 text-[12px] font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search items..."
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-[13px] outline-none focus:border-slate-400 transition-all placeholder-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select 
            className="bg-transparent border-none text-[12px] font-bold text-slate-600 outline-none cursor-pointer"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Total: {filteredProducts.length} Items
        </div>
      </div>

      {/* Excel-style Table Container */}
      <div className="bg-white border border-slate-200 rounded-lg flex-1 flex flex-col overflow-hidden shadow-sm">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">Product Name</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">Category</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 text-right">Price (IND)</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 text-right">Price (INT)</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 text-center">Tax %</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">HSN</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-300" /></td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-400 text-sm italic">No products found</td></tr>
              ) : (
                currentItems.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                    <td className="px-4 py-2.5 border-r border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-slate-900">{p.name}</span>
                        {p.is_service && <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-tighter">service unit</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded uppercase">{p.category}</span>
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-right text-[12px] font-semibold tabular-nums">₹{p.price_india.toLocaleString()}</td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-right text-[12px] font-semibold tabular-nums">₹{p.price_abroad.toLocaleString()}</td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-center">
                      <span className={`text-[11px] font-bold ${p.gst_rate > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{p.gst_rate}%</span>
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100">
                      <span className="text-[11px] font-mono text-slate-400">{p.hsn_code || '---'}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleOpenModal(p)} className="text-slate-400 hover:text-slate-900 transition-all"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length}
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-1.5 rounded border border-slate-100 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all text-[11px] font-bold text-slate-500 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <div className="text-[11px] font-bold text-slate-400 px-2">
              {currentPage} / {totalPages || 1}
            </div>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1.5 rounded border border-slate-100 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all text-[11px] font-bold text-slate-500 flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Simplified Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center border border-slate-100"><Database className="w-4 h-4 text-slate-500" /></div>
                <div>
                  <span className="text-sm font-bold tracking-tight text-slate-900 block">{editingProduct ? 'Edit Product' : 'New Product'}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Inventory Master Entry</span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
                <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-medium outline-none focus:border-slate-400 transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Reiki Level One" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-medium outline-none focus:border-slate-400 transition-all" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="Tarot">Tarot</option>
                    <option value="Crystals">Crystals</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Classes">Classes</option>
                    <option value="Healing">Healing</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HSN Code</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-medium outline-none focus:border-slate-400 transition-all" value={formData.hsn_code} onChange={(e) => setFormData({...formData, hsn_code: e.target.value})} placeholder="8-digits" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">India Price</label>
                  <input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold outline-none focus:border-slate-400 transition-all" value={formData.price_india} onChange={(e) => setFormData({...formData, price_india: e.target.value})} placeholder="₹" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Abroad Price</label>
                  <input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold outline-none focus:border-slate-400 transition-all" value={formData.price_abroad} onChange={(e) => setFormData({...formData, price_abroad: e.target.value})} placeholder="₹" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_service" className="w-4 h-4 rounded border-slate-200 text-slate-900 focus:ring-0" checked={formData.is_service} onChange={(e) => setFormData({...formData, is_service: e.target.checked})} />
                  <label htmlFor="is_service" className="text-[11px] font-bold text-slate-500 uppercase tracking-tight cursor-pointer">Mark as Service</label>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">GST %</label>
                  <input type="number" step="0.01" className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-black text-center outline-none focus:border-slate-400" value={formData.gst_rate} onChange={(e) => setFormData({...formData, gst_rate: e.target.value})} />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-slate-900 text-white rounded-lg py-3 text-[13px] font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]">
                  {editingProduct ? 'Commit Updates' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

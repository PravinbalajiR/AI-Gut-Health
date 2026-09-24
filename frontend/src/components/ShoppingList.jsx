import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, CheckCircle2, Circle, Sparkles, Plus, Loader2, RefreshCw, X } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + '/api/v1';
const token = () => localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

export default function ShoppingList() {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [adding, setAdding] = useState('');
  const [clearingDone, setClearingDone] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/shopping/list`, { headers: authHeaders() });
      setList(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuggestions = async () => {
    setSugLoading(true);
    try {
      const res = await axios.get(`${API}/shopping/suggestions`, { headers: authHeaders() });
      setSuggestions(res.data.suggestions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSugLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    fetchSuggestions();
    
    const handleRefresh = () => { fetchList(); fetchSuggestions(); };
    window.addEventListener('refreshShoppingList', handleRefresh);
    return () => window.removeEventListener('refreshShoppingList', handleRefresh);
  }, [fetchList]);

  const toggleItem = async (itemId) => {
    try {
      await axios.patch(`${API}/shopping/items/${itemId}/toggle`, {}, { headers: authHeaders() });
      setList(prev => {
        if(!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(i => i.item_id === itemId ? { ...i, is_purchased: !i.is_purchased } : i)
        };
      });
    } catch (e) { console.error(e); }
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`${API}/shopping/items/${itemId}`, { headers: authHeaders() });
      setList(prev => prev ? { ...prev, items: prev.items.filter(i => i.item_id !== itemId) } : prev);
    } catch (e) { console.error(e); }
  };

  const addItemByName = async (name) => {
    if (!name.trim()) return;
    setAdding(name);
    try {
      await axios.post(`${API}/shopping/items/by-name`, { name: name.trim() }, { headers: authHeaders() });
      await fetchList();
      if(name === addInput) setAddInput('');
      setSuggestions(prev => prev.filter(s => s.name !== name));
    } catch (e) {
      console.error(e);
    } finally {
      setAdding('');
    }
  };

  const clearPurchased = async () => {
    if(!list) return;
    setClearingDone(true);
    try {
      const doneItems = list.items.filter(i => i.is_purchased);
      await Promise.all(doneItems.map(i => axios.delete(`${API}/shopping/items/${i.item_id}`, { headers: authHeaders() })));
      setList(prev => prev ? { ...prev, items: prev.items.filter(i => !i.is_purchased) } : prev);
    } catch (e) {
      console.error(e);
    } finally {
      setClearingDone(false);
    }
  };

  if (loading && !list) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-white border border-gray-100 rounded-3xl">
        <Loader2 className="animate-spin text-sarab-primary w-8 h-8" />
      </div>
    );
  }

  const items = list?.items || [];
  const activeItems = items.filter(i => !i.is_purchased).reverse();
  const doneItems = items.filter(i => i.is_purchased).reverse();

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6 relative z-10">
      
      {/* Input */}
      <div className="mb-8">
        <form 
          onSubmit={(e) => { e.preventDefault(); addItemByName(addInput); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={addInput}
            onChange={e => setAddInput(e.target.value)}
            placeholder="Add a new item..."
            className="w-full pl-5 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sarab-primary focus:bg-white transition-all text-sm font-medium placeholder-gray-400"
          />
          <button 
            type="submit"
            disabled={!addInput.trim() || !!adding}
            className="absolute right-2 w-8 h-8 bg-sarab-dark text-white rounded-lg flex items-center justify-center hover:bg-black transition-colors disabled:opacity-50"
          >
            {adding === addInput ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
          </button>
        </form>
      </div>

      <div className="flex-1 space-y-8">
        
        {/* Active Items */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
            To Buy <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{activeItems.length}</span>
          </h4>
          
          <div className="space-y-2">
            <AnimatePresence>
              {activeItems.length === 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-400 italic">Your list is empty.</motion.p>
              )}
              {activeItems.map((item, i) => (
                <motion.div
                  key={item.item_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="group flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all"
                >
                  <button onClick={() => toggleItem(item.item_id)} className="text-gray-300 hover:text-sarab-primary transition-colors focus:outline-none">
                    <Circle size={22} strokeWidth={2} />
                  </button>
                  <span className="flex-1 font-medium text-sarab-dark">{item.product?.product_name || 'Unknown'}</span>
                  <button onClick={() => removeItem(item.item_id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-sarab-red transition-colors">
                    <X size={18} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Chef's Recommendations */}
        {suggestions.length > 0 && (
          <div className="bg-sarab-cream rounded-2xl p-5 border border-sarab-cream2">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-dancing text-sarab-secondary text-xl">Chef's Recommendations</h4>
              <button onClick={fetchSuggestions} disabled={sugLoading} className="text-sarab-secondary hover:text-sarab-dark transition-colors disabled:opacity-50">
                <RefreshCw size={14} className={sugLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div className="space-y-3">
              {suggestions.map((sug, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-3 rounded-xl border border-gray-100 flex gap-3 items-start group shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-sarab-secondary" />
                      <p className="font-bold text-sm text-sarab-dark">{sug.name}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">{sug.reason}</p>
                  </div>
                  <button
                    onClick={() => addItemByName(sug.name)}
                    disabled={adding === sug.name}
                    className="shrink-0 bg-sarab-light text-sarab-primary font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-sarab-primary hover:text-white transition-colors border border-gray-100 group-hover:border-sarab-primary disabled:opacity-50 flex items-center gap-1"
                  >
                    {adding === sug.name ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Items */}
        {doneItems.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Purchased <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{doneItems.length}</span>
              </h4>
              <button 
                onClick={clearPurchased}
                disabled={clearingDone}
                className="text-xs font-semibold text-sarab-red hover:text-red-700 transition-colors disabled:opacity-50"
              >
                {clearingDone ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
            
            <div className="space-y-2 opacity-60">
              <AnimatePresence>
                {doneItems.map((item) => (
                  <motion.div
                    key={item.item_id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden', padding: 0, margin: 0, border: 0 }}
                    className="group flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <button onClick={() => toggleItem(item.item_id)} className="text-sarab-primary hover:text-sarab-secondary transition-colors focus:outline-none">
                      <CheckCircle2 size={22} />
                    </button>
                    <span className="flex-1 font-medium text-gray-500 line-through">{item.product?.product_name || 'Unknown'}</span>
                    <button onClick={() => removeItem(item.item_id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-sarab-red transition-colors">
                      <X size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}


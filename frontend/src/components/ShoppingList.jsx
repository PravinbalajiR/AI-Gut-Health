import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ShoppingCart, Trash2, CheckCircle2, Circle, Sparkles,
  Plus, X, Loader2, RefreshCw, PackageCheck
} from 'lucide-react';

const API = 'http://127.0.0.1:8000/api/v1';
const token = () => localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

/* ── Single item row ────────────────────────────────────────────────────────── */
function ListItem({ item, onToggle, onRemove }) {
  const done = !!item.is_purchased;
  return (
    <li className={`flex items-center gap-3 py-2.5 px-1 border-b last:border-0 transition-opacity ${done ? 'opacity-50' : ''}`}>
      <button onClick={() => onToggle(item.item_id)} className="flex-shrink-0 text-gray-400 hover:text-emerald-500 transition-colors">
        {done
          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          : <Circle className="h-5 w-5" />}
      </button>
      <span className={`flex-1 text-sm font-medium text-gray-800 ${done ? 'line-through text-gray-400' : ''}`}>
        {item.product?.product_name || 'Unknown'}
      </span>
      <button onClick={() => onRemove(item.item_id)} className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1 rounded">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

/* ── Suggestion chip ────────────────────────────────────────────────────────── */
function SuggestionCard({ item, onAdd, adding }) {
  return (
    <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-lg p-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{item.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.reason}</p>
      </div>
      <button
        onClick={() => onAdd(item.name)}
        disabled={adding === item.name}
        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {adding === item.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
        Add
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════════════════════ */
export default function ShoppingList() {
  const [list, setList]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading]   = useState(false);
  const [addInput, setAddInput]       = useState('');
  const [adding, setAdding]           = useState('');     // name of item being added
  const [clearingDone, setClearingDone] = useState(false);
  const [tab, setTab]                 = useState('list'); // 'list' | 'suggestions'

  /* ── Fetch list ─────────────────────────────────────────────────────────── */
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

  /* ── Fetch AI suggestions ──────────────────────────────────────────────── */
  const fetchSuggestions = useCallback(async () => {
    setSugLoading(true);
    try {
      const res = await axios.get(`${API}/shopping/suggestions`, { headers: authHeaders() });
      setSuggestions(res.data.suggestions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSugLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
    fetchSuggestions();
    const handleRefresh = () => { fetchList(); fetchSuggestions(); };
    window.addEventListener('refreshShoppingList', handleRefresh);
    const interval = setInterval(fetchList, 30000);
    return () => {
      window.removeEventListener('refreshShoppingList', handleRefresh);
      clearInterval(interval);
    };
  }, [fetchList, fetchSuggestions]);

  /* ── Add by name ─────────────────────────────────────────────────────────── */
  const addByName = async (name) => {
    if (!name.trim()) return;
    setAdding(name);
    try {
      await axios.post(`${API}/shopping/items/by-name`, { name }, { headers: authHeaders() });
      await fetchList();
      if (name === addInput) setAddInput('');
      // Remove from suggestions if it was suggested
      setSuggestions(prev => prev.filter(s => s.name !== name));
    } catch (e) {
      console.error(e);
    } finally {
      setAdding('');
    }
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (addInput.trim()) addByName(addInput.trim());
  };

  /* ── Toggle purchased ───────────────────────────────────────────────────── */
  const toggleItem = async (itemId) => {
    try {
      await axios.patch(`${API}/shopping/items/${itemId}/toggle`, {}, { headers: authHeaders() });
      setList(prev => ({
        ...prev,
        items: prev.items.map(i => i.item_id === itemId ? { ...i, is_purchased: i.is_purchased ? 0 : 1 } : i)
      }));
    } catch (e) { console.error(e); }
  };

  /* ── Remove item ────────────────────────────────────────────────────────── */
  const removeItem = async (itemId) => {
    try {
      await axios.delete(`${API}/shopping/items/${itemId}`, { headers: authHeaders() });
      setList(prev => ({ ...prev, items: prev.items.filter(i => i.item_id !== itemId) }));
    } catch (e) { console.error(e); }
  };

  /* ── Clear purchased ────────────────────────────────────────────────────── */
  const clearPurchased = async () => {
    setClearingDone(true);
    try {
      await axios.delete(`${API}/shopping/items/purchased/clear`, { headers: authHeaders() });
      await fetchList();
    } catch (e) { console.error(e); }
    finally { setClearingDone(false); }
  };

  /* ── Derived state ──────────────────────────────────────────────────────── */
  const items     = list?.items || [];
  const pending   = items.filter(i => !i.is_purchased);
  const done      = items.filter(i => !!i.is_purchased);
  const hasDone   = done.length > 0;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border overflow-hidden">
        <div className="p-4 bg-orange-500 text-white flex items-center gap-3">
          <ShoppingCart className="h-6 w-6" />
          <h2 className="text-xl font-bold">Smart Shopping List</h2>
        </div>
        <div className="p-6 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden">

      {/* ── Header ── */}
      <div className="p-4 bg-orange-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6" />
          <div>
            <h2 className="text-xl font-bold">Smart Shopping List</h2>
            <p className="text-orange-100 text-xs">{pending.length} item{pending.length !== 1 ? 's' : ''} to buy</p>
          </div>
        </div>
        {hasDone && (
          <button
            onClick={clearPurchased}
            disabled={clearingDone}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors"
          >
            <PackageCheck className="h-3.5 w-3.5" />
            Clear Done
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b bg-gray-50">
        <button
          onClick={() => setTab('list')}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors ${tab === 'list' ? 'text-orange-600 border-b-2 border-orange-500 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          My List {items.length > 0 && <span className="ml-1 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">{items.length}</span>}
        </button>
        <button
          onClick={() => setTab('suggestions')}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${tab === 'suggestions' ? 'text-indigo-600 border-b-2 border-indigo-500 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Suggestions
        </button>
      </div>

      {/* ── Content ── */}
      <div className="p-4">

        {tab === 'list' && (
          <>
            {/* Manual add input */}
            <form onSubmit={handleManualAdd} className="flex gap-2 mb-4">
              <input
                type="text"
                value={addInput}
                onChange={e => setAddInput(e.target.value)}
                placeholder="Type an item to add…"
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
              <button
                type="submit"
                disabled={!addInput.trim() || adding === addInput.trim()}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 transition-colors"
              >
                {adding === addInput.trim() ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </form>

            {/* Items */}
            {items.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium">Your list is empty</p>
                <p className="text-xs mt-1">Add items above or check AI Suggestions →</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {pending.map(item => (
                  <ListItem key={item.item_id} item={item} onToggle={toggleItem} onRemove={removeItem} />
                ))}
                {done.map(item => (
                  <ListItem key={item.item_id} item={item} onToggle={toggleItem} onRemove={removeItem} />
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'suggestions' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">AI-picked gut-health items missing from your diet</p>
              <button
                onClick={fetchSuggestions}
                disabled={sugLoading}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <RefreshCw className={`h-3 w-3 ${sugLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {sugLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No suggestions available</p>
            ) : (
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <SuggestionCard key={i} item={s} onAdd={addByName} adding={adding} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

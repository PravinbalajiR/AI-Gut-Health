import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, CheckCircle, Trash2, Loader2 } from 'lucide-react';

const ShoppingList = () => {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/v1/shopping/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setList(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    
    const handleRefresh = () => fetchList();
    window.addEventListener('refreshShoppingList', handleRefresh);
    return () => window.removeEventListener('refreshShoppingList', handleRefresh);
  }, []);

  const removeItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:8000/api/v1/shopping/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchList();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="animate-pulse bg-gray-200 h-32 rounded-xl mb-8 max-w-4xl mx-auto"></div>;

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden">
      <div className="p-4 bg-orange-500 text-white flex items-center gap-3">
        <ShoppingCart className="h-6 w-6" />
        <h2 className="text-xl font-bold">Smart Shopping List</h2>
      </div>
      
      <div className="p-6">
        {!list || !list.items || list.items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Your shopping list is empty. Add healthy alternatives from the dashboard!</p>
        ) : (
          <ul className="divide-y">
            {list.items.map(item => (
              <li key={item.item_id} className="py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800">{item.product.product_name}</h4>
                  {item.product.brand && <p className="text-sm text-gray-500">{item.product.brand}</p>}
                </div>
                <button 
                  onClick={() => removeItem(item.item_id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;

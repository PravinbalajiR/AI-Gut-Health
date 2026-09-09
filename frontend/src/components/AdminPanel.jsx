import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Users, Receipt, Trash2, ShieldAlert } from 'lucide-react';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, productsRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/v1/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://127.0.0.1:8000/api/v1/admin/products', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product from the master taxonomy?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:8000/api/v1/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to delete product.");
    }
  };

  if (loading) return <div className="text-center py-10">Loading admin data...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 mb-12">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b">
        <ShieldAlert className="h-8 w-8 text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-800">Admin Control Panel</h1>
      </div>

      {/* System Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Users" value={stats.total_users} icon={<Users size={24} />} color="bg-blue-100 text-blue-700" />
          <StatCard title="Products Indexed" value={stats.total_products} icon={<Database size={24} />} color="bg-purple-100 text-purple-700" />
          <StatCard title="Receipts Processed" value={stats.total_receipts} icon={<Receipt size={24} />} color="bg-green-100 text-green-700" />
          <StatCard title="Avg Gut Score" value={stats.average_system_gut_score} icon={<ShieldAlert size={24} />} color="bg-orange-100 text-orange-700" />
        </div>
      )}

      {/* Product Taxonomy Management */}
      <div className="bg-white rounded-xl shadow-md border overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Product Taxonomy Database</h2>
          <span className="text-sm text-gray-500">Showing latest {products.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                <th className="p-4">ID</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Processing (NOVA)</th>
                <th className="p-4">Source</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {products.map(p => (
                <tr key={p.product_id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono text-gray-500">#{p.product_id}</td>
                  <td className="p-4 font-medium text-gray-800">{p.product_name}</td>
                  <td className="p-4 text-gray-600">{p.brand || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      p.processing_level === '4' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {p.processing_level || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{p.source}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => deleteProduct(p.product_id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded"
                      title="Delete Product"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-8 text-center text-gray-500">No products found in the database.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center gap-4">
    <div className={`p-4 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <div className="text-sm font-semibold text-gray-500 uppercase">{title}</div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
    </div>
  </div>
);

export default AdminPanel;

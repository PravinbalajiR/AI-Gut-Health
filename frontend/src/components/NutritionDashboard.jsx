import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';

const NutritionDashboard = () => {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch token from localStorage for now
  const fetchProduct = async () => {
    setLoading(true);
    setError('');
    setProduct(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:8000/api/v1/products/barcode/${barcode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProduct(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch product data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Nutrition Dashboard</h1>
      
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Enter product barcode (e.g. 737628064502)"
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={fetchProduct}
          disabled={loading || !barcode}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
          Scan Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {product && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-800">{product.product_name}</h2>
            {product.brand && <p className="text-gray-500">{product.brand}</p>}
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Nutrition Facts (per 100g/ml)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <NutritionCard label="Calories" value={product.calories} unit="kcal" color="bg-blue-100 text-blue-800" />
              <NutritionCard label="Protein" value={product.protein} unit="g" color="bg-green-100 text-green-800" />
              <NutritionCard label="Fat" value={product.fat} unit="g" color="bg-yellow-100 text-yellow-800" />
              <NutritionCard label="Carbs" value={product.carbohydrates} unit="g" color="bg-purple-100 text-purple-800" />
              <NutritionCard label="Fiber" value={product.fiber} unit="g" color="bg-teal-100 text-teal-800" />
              <NutritionCard label="Sugar" value={product.sugar} unit="g" color="bg-red-100 text-red-800" />
              <NutritionCard label="Sodium" value={product.sodium} unit="g" color="bg-gray-100 text-gray-800" />
            </div>

            <div className="mt-8 pt-6 border-t flex justify-between items-center text-sm text-gray-500">
              <span>Data Source: <span className="font-semibold">{product.source}</span></span>
              <span>Processing Level: <span className="font-semibold uppercase">{product.processing_level}</span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NutritionCard = ({ label, value, unit, color }) => (
  <div className={`p-4 rounded-lg ${color}`}>
    <div className="text-sm font-medium mb-1">{label}</div>
    <div className="text-2xl font-bold">
      {value !== null && value !== undefined ? `${value}${unit}` : 'N/A'}
    </div>
  </div>
);

export default NutritionDashboard;

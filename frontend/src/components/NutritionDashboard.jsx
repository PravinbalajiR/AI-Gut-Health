import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';

const NutritionDashboard = () => {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [gutScore, setGutScore] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingToList, setAddingToList] = useState(false);

  const addToShoppingList = async (productId) => {
    setAddingToList(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/v1/shopping/items', 
        { product_id: productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Dispatch event to update the shopping list component
      window.dispatchEvent(new Event('refreshShoppingList'));
      alert("Added to shopping list!");
    } catch (err) {
      console.error(err);
      alert("Failed to add to shopping list.");
    } finally {
      setAddingToList(false);
    }
  };

  // Fetch token from localStorage for now
  const fetchProduct = async () => {
    setLoading(true);
    setError('');
    setProduct(null);
    setGutScore(null);
    try {
      const token = localStorage.getItem('token');
      
      let response;
      let fetchedProduct;
      if (/^\d+$/.test(barcode)) {
        // It's a barcode
        response = await axios.get(`http://127.0.0.1:8000/api/v1/products/barcode/${barcode}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchedProduct = response.data;
      } else {
        // It's a text search
        response = await axios.get(`http://127.0.0.1:8000/api/v1/products/search?query=${barcode}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.length > 0) {
          fetchedProduct = response.data[0];
        } else {
          throw new Error('No products found for this search');
        }
      }
      
      setProduct(fetchedProduct);

      // Fetch the Gut Score
      let scoreVal = null;
      try {
        const scoreRes = await axios.get(`http://127.0.0.1:8000/api/v1/scores/product/${fetchedProduct.product_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGutScore(scoreRes.data);
        scoreVal = scoreRes.data.final_gut_score;
      } catch (scoreErr) {
        console.error("Failed to load gut score", scoreErr);
      }

      // Fetch Recommendations if score is poor (e.g. < 70)
      if (scoreVal !== null && scoreVal < 70) {
        try {
          const recRes = await axios.post(`http://127.0.0.1:8000/api/v1/shopping/recommendations`, 
            { product_id: fetchedProduct.product_id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setRecommendations(recRes.data);
        } catch (recErr) {
          console.error("Failed to load recommendations", recErr);
        }
      } else {
        setRecommendations([]);
      }
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch product data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Nutrition Explorer</h1>
      
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          id="barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Enter barcode or product name (e.g. Organic Milk)..."
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

      {product ? (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-800">{product.product_name}</h2>
            {product.brand && <p className="text-gray-500">{product.brand}</p>}
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Nutrition Facts (per 100g/ml)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              <NutritionCard label="Calories" value={product.calories} unit="kcal" color="bg-blue-100 text-blue-800" />
              <NutritionCard label="Protein" value={product.protein} unit="g" color="bg-green-100 text-green-800" />
              <NutritionCard label="Fat" value={product.fat} unit="g" color="bg-yellow-100 text-yellow-800" />
              <NutritionCard label="Carbs" value={product.carbohydrates} unit="g" color="bg-purple-100 text-purple-800" />
              <NutritionCard label="Fiber" value={product.fiber} unit="g" color="bg-teal-100 text-teal-800" />
              <NutritionCard label="Sugar" value={product.sugar} unit="g" color="bg-red-100 text-red-800" />
              <NutritionCard label="Sodium" value={product.sodium} unit="g" color="bg-gray-100 text-gray-800" />
            </div>

            {/* Gut Health Score */}
            {gutScore && (
              <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-green-900">AI Gut Health Score</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-green-600">{gutScore.final_gut_score}</span>
                    <span className="text-green-800 font-medium">/ 100</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500 uppercase font-semibold">Fiber Bonus</div>
                    <div className="text-lg font-bold text-gray-800">{gutScore.fiber_score}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500 uppercase font-semibold">Processing Penalty</div>
                    <div className="text-lg font-bold text-gray-800">{gutScore.processing_score}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500 uppercase font-semibold">Sugar Penalty</div>
                    <div className="text-lg font-bold text-gray-800">{gutScore.sugar_score}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500 uppercase font-semibold">Additives/Emulsifiers</div>
                    <div className="text-lg font-bold text-gray-800">{gutScore.additive_score}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">✨</span> Healthier Alternatives
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="border border-green-200 bg-green-50 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-green-900">{rec.product.product_name}</h4>
                          <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">{rec.gut_score}</span>
                        </div>
                        {rec.product.brand && <p className="text-sm text-green-700 mb-2">{rec.product.brand}</p>}
                        <p className="text-xs text-green-800 italic mb-4">"{rec.reason}"</p>
                      </div>
                      <button 
                        onClick={() => addToShoppingList(rec.product.product_id)}
                        disabled={addingToList}
                        className="w-full py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors"
                      >
                        Add to Shopping List
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients and Regions */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.ingredients && product.ingredients.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-2">Ingredients</h4>
                  <p className="text-sm text-gray-600">
                    {product.ingredients.join(', ')}
                  </p>
                </div>
              )}
              {product.regions && product.regions.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-2">Regional Availability</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.regions.map(r => (
                      <span key={r} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t flex justify-between items-center text-sm text-gray-500">
              <span>Data Source: <span className="font-semibold">{product.source}</span></span>
              <span>Processing Level: <span className="font-semibold uppercase">{product.processing_level}</span></span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
          Enter a product name or barcode to see its nutritional information
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

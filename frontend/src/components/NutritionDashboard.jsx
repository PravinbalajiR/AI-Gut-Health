import React, { useState } from 'react';
import axios from 'axios';
import { Search, Info, Activity, Leaf } from 'lucide-react';

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
      window.dispatchEvent(new Event('refreshShoppingList'));
      alert("Added to shopping list!");
    } catch (err) {
      console.error(err);
      alert("Failed to add to shopping list.");
    } finally {
      setAddingToList(false);
    }
  };

  const fetchProduct = async () => {
    if (!barcode) return;
    setLoading(true);
    setError('');
    setProduct(null);
    setGutScore(null);
    setRecommendations([]);

    try {
      const token = localStorage.getItem('token');
      
      const searchRes = await axios.get(`http://127.0.0.1:8000/api/v1/products/search?query=${barcode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!searchRes.data || searchRes.data.length === 0) {
        setError('Product not found in database or Open Food Facts.');
        setLoading(false);
        return;
      }
      
      const fetchedProduct = searchRes.data[0];
      setProduct(fetchedProduct);

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
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Enter product name or barcode..."
          className="flex-1 px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchProduct}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center gap-2 font-semibold disabled:opacity-50"
        >
          <Search size={20} />
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-6 flex items-center gap-3 border border-red-200">
          <Info size={20} />
          {error}
        </div>
      )}

      {product ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 bg-white border-b flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{product.product_name}</h2>
              <p className="text-gray-500">{product.brand || 'Unknown Brand'}</p>
            </div>
            {product.category && (
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {product.category.split(',')[0]}
              </span>
            )}
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Nutritional Information (per 100g)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NutritionCard label="Calories" value={product.calories} unit="kcal" color="bg-orange-100 text-orange-900" />
              <NutritionCard label="Protein" value={product.protein} unit="g" color="bg-blue-100 text-blue-900" />
              <NutritionCard label="Carbs" value={product.carbohydrates} unit="g" color="bg-yellow-100 text-yellow-900" />
              <NutritionCard label="Fat" value={product.fat} unit="g" color="bg-red-100 text-red-900" />
              <NutritionCard label="Fiber" value={product.fiber} unit="g" color="bg-green-100 text-green-900" />
              <NutritionCard label="Sugar" value={product.sugar} unit="g" color="bg-purple-100 text-purple-900" />
              <NutritionCard label="Sodium" value={product.sodium} unit="mg" color="bg-gray-200 text-gray-900" />
            </div>

            {/* Gut Score */}
            {gutScore && (
              <div className="mt-8 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="text-indigo-600" />
                    Gut Suitability Prediction
                  </h3>
                  {gutScore.is_ml_prediction ? (
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded font-bold border border-indigo-200">
                      ML Powered (Conf: {(gutScore.confidence * 100).toFixed(0)}%)
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-bold border border-gray-200">
                      Rule-Based Fallback
                    </span>
                  )}
                </div>

                <div className="bg-indigo-50 p-6 rounded-xl flex items-center justify-between border border-indigo-100">
                  <div>
                    <p className="text-indigo-900 font-bold mb-1">Final Suitability Score</p>
                    <p className="text-sm text-indigo-700 max-w-sm">
                      {gutScore.is_ml_prediction ? 'Predicted by our ML model based on nutritional profile and processing levels.' : 'Calculated based on standard nutrition rules.'}
                    </p>
                  </div>
                  <div className="text-5xl font-black text-indigo-600 bg-white p-4 rounded-full shadow-sm border border-indigo-100">
                    {gutScore.final_gut_score}
                  </div>
                </div>

                {/* Explanations (Why this score?) */}
                {gutScore.explanations && gutScore.explanations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Why this score?</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {gutScore.explanations.map((exp, idx) => (
                        <div key={idx} className={`p-3 rounded border flex items-start gap-3 ${exp.impact === 'positive' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className={`mt-1 ${exp.impact === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                            {exp.impact === 'positive' ? '↗' : '↘'}
                          </div>
                          <div>
                            <p className={`font-bold text-sm ${exp.impact === 'positive' ? 'text-green-800' : 'text-red-800'}`}>{exp.factor}</p>
                            <p className={`text-xs ${exp.impact === 'positive' ? 'text-green-600' : 'text-red-600'}`}>{exp.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

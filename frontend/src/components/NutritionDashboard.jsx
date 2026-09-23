import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Info, Activity, Leaf, ShoppingCart, Sparkles, ChevronRight } from 'lucide-react';

const NutritionDashboard = () => {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [gutScore, setGutScore] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingToList, setAddingToList] = useState(false);

  const addToShoppingList = async (productId, isAlternative = false) => {
    setAddingToList(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/v1/shopping/items', 
        { product_id: productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.dispatchEvent(new Event('refreshShoppingList'));
      if(!isAlternative) alert("Added to shopping list!");
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
        setError('Product not found. Our AI could not generate a generic profile for this.');
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
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch product data');
    } finally {
      setLoading(false);
    }
  };

  const ScoreBar = ({ label, score, colorClass }) => (
    <div className="mb-4">
      <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
        <span>{label}</span>
        <span>{score}/100</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search Header */}
      <div className="p-8 border-b border-gray-100 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-sarab-primary opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-sarab-primary transition-all">
            <div className="pl-5 flex items-center justify-center text-gray-400">
              <Search size={22} />
            </div>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProduct()}
              placeholder="Search for any food, ingredient, or barcode..."
              className="flex-1 px-4 py-5 focus:outline-none text-lg text-sarab-dark font-medium placeholder-gray-300"
            />
            <button
              onClick={fetchProduct}
              disabled={loading}
              className="bg-sarab-dark hover:bg-black text-white px-8 font-bold transition-colors flex items-center justify-center min-w-[120px]"
            >
              {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Activity size={20}/></motion.div> : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="m-8 bg-red-50 text-sarab-red p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
          <Info size={20} />
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
        <AnimatePresence mode="wait">
          {!product && !loading && !error && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center opacity-60"
            >
              <div className="w-24 h-24 mb-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-300 border border-gray-100">
                <Leaf size={40} />
              </div>
              <h3 className="text-xl font-playfair font-bold text-gray-400">Discover What's Inside</h3>
              <p className="text-sm font-poppins text-gray-400 max-w-sm mt-2">Search for ingredients to see their ML-predicted microbiome impact.</p>
            </motion.div>
          )}

          {product && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              {/* Product Header Card */}
              <div className="bg-white rounded-[30px] p-8 shadow-sarab border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sarab-cream rounded-bl-[100px] -z-10"></div>
                
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-xs font-bold text-sarab-secondary tracking-widest uppercase mb-1 block">
                      {product.brand || 'Generic Ingredient'}
                    </span>
                    <h2 className="text-4xl font-playfair font-bold text-sarab-dark leading-tight">{product.product_name}</h2>
                  </div>
                  
                  {gutScore && (
                    <div className="text-right flex flex-col items-end">
                      <div className={`text-5xl font-playfair font-bold ${gutScore.final_gut_score >= 70 ? 'text-sarab-primary' : gutScore.final_gut_score >= 40 ? 'text-sarab-secondary' : 'text-sarab-red'}`}>
                        {gutScore.final_gut_score}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gut Score</span>
                    </div>
                  )}
                </div>

                {/* Macros Grid */}
                <div className="grid grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded-2xl">
                  <div className="text-center">
                    <span className="block text-xl font-bold text-sarab-dark">{product.calories}<span className="text-xs text-gray-400">kcal</span></span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Calories</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-bold text-sarab-dark">{product.protein}<span className="text-xs text-gray-400">g</span></span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Protein</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-bold text-sarab-dark">{product.carbohydrates}<span className="text-xs text-gray-400">g</span></span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Carbs</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-bold text-sarab-dark">{product.fiber}<span className="text-xs text-gray-400">g</span></span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fiber</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => addToShoppingList(product.product_id)}
                    disabled={addingToList}
                    className="flex-1 bg-sarab-primary text-white py-3 rounded-xl font-bold hover:bg-[#22503a] transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={18} /> {addingToList ? 'Adding...' : 'Add to List'}
                  </button>
                </div>
              </div>

              {/* Gut Analysis Detail */}
              {gutScore && (
                <div className="bg-white rounded-[30px] p-8 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-4">
                    <Sparkles className="text-sarab-secondary" size={24}/>
                    <h3 className="text-2xl font-playfair font-bold text-sarab-dark">Microbiome Impact</h3>
                    {gutScore.is_ml_prediction && (
                      <span className="ml-auto bg-sarab-cream text-sarab-secondary text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        AI Predicted ({(gutScore.confidence * 100).toFixed(0)}%)
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <ScoreBar label="Fiber Content" score={gutScore.fiber_score} colorClass="bg-sarab-primary" />
                    <ScoreBar label="Sugar Impact" score={gutScore.sugar_score} colorClass={gutScore.sugar_score > 50 ? 'bg-sarab-primary' : 'bg-sarab-red'} />
                    <ScoreBar label="Processing Level" score={gutScore.processing_score} colorClass={gutScore.processing_score > 50 ? 'bg-sarab-primary' : 'bg-sarab-secondary'} />
                  </div>
                  
                  {gutScore.explanations && gutScore.explanations.length > 0 && (
                    <div className="mt-8 bg-sarab-light p-6 rounded-2xl">
                      <h4 className="font-dancing text-sarab-secondary text-xl mb-3">AI Note</h4>
                      <ul className="space-y-3">
                        {gutScore.explanations.map((exp, idx) => (
                          <li key={idx} className="flex gap-3 text-sm text-gray-600 font-medium">
                            <span className="text-sarab-primary mt-0.5">•</span> {exp.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Alternatives */}
              {recommendations && recommendations.length > 0 && (
                <div className="bg-sarab-dark rounded-[30px] p-8 text-white shadow-sarab-lg relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-sarab-primary opacity-20 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <h3 className="text-2xl font-playfair font-bold mb-6">Gut-Friendly Alternatives</h3>
                  <div className="space-y-4 relative z-10">
                    {recommendations.map(alt => (
                      <div key={alt.product_id} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex justify-between items-center group hover:bg-white/20 transition-all">
                        <div>
                          <h4 className="font-bold text-lg">{alt.product_name}</h4>
                          <div className="flex gap-4 mt-1 text-xs text-gray-300 font-medium">
                            <span>{alt.calories} kcal</span>
                            <span>{alt.fiber}g fiber</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => addToShoppingList(alt.product_id, true)}
                          className="w-10 h-10 rounded-full bg-white text-sarab-dark flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 shadow-md"
                        >
                          <ShoppingCart size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NutritionDashboard;

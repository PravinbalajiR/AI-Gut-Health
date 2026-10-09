import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + '/api/v1';

const Recommendations = () => {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchRecs(false);
  }, []);

  const fetchRecs = async (force) => {
    if (force) setGenerating(true);
    else setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/recommendations${force ? '?force_refresh=true' : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  if (loading) return <div className="bg-white p-6 rounded-2xl shadow-sm border animate-pulse h-48"></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-playfair text-gray-800">Clinical Recommendations</h3>
            <p className="text-sm text-gray-500">AI-generated based on your complete medical & dietary profile</p>
          </div>
        </div>
        <button 
          onClick={() => fetchRecs(true)} 
          disabled={generating}
          className="text-gray-500 hover:text-purple-600 p-2 rounded-full hover:bg-purple-50 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw size={16} className={generating ? 'animate-spin' : ''} /> {generating ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {recs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No recommendations generated yet. Try filling out your profile and logging some symptoms!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recs.map(rec => (
            <div key={rec.rec_id} className={`p-5 rounded-xl border ${rec.is_urgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'} flex flex-col h-full`}>
              <div className="flex items-start gap-3 mb-3">
                {rec.is_urgent ? (
                  <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={20} />
                ) : (
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                )}
                <h4 className={`font-semibold ${rec.is_urgent ? 'text-red-800' : 'text-gray-800'}`}>
                  {rec.recommendation_text}
                </h4>
              </div>
              <div className="pl-8 flex-1 text-sm text-gray-600 space-y-2">
                {rec.reasoning && (
                  <p><strong className="text-gray-700 font-medium">Why:</strong> {rec.reasoning}</p>
                )}
                {rec.evidence_references && (
                  <p className="text-xs text-gray-400 mt-2 italic flex items-center gap-1">
                    Source: {rec.evidence_references}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Recommendations;

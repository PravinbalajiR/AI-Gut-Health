import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Leaf, TrendingUp, AlertCircle, Heart, RefreshCw, Trash2 } from 'lucide-react';

const DiversityScore = () => {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchScore = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get((import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + '/api/v1/scores/diversity/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScoreData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
    const handleRefresh = () => fetchScore();
    window.addEventListener('refreshDiversity', handleRefresh);
    const interval = setInterval(fetchScore, 30000);
    return () => {
      window.removeEventListener('refreshDiversity', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse bg-sarab-cream rounded-[40px] h-64 w-full flex items-center justify-center">
        <div className="text-sarab-primary font-dancing text-xl">Preparing your insights...</div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-sarab-cream rounded-[40px] p-10 text-center shadow-sarab border border-sarab-cream2"
      >
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-400">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-2xl font-playfair font-bold text-sarab-dark mb-2">Nothing on your plate yet.</h3>
        <p className="text-gray-500 font-poppins">Upload your first meal receipt to unlock your microbiome diversity score.</p>
      </motion.div>
    );
  }

  const score = scoreData.score || 0;
  let statusText = "Needs Focus";
  let statusColor = "text-sarab-red";
  let Icon = AlertCircle;
  
  if (score >= 80) {
    statusText = "Thriving";
    statusColor = "text-sarab-primary";
    Icon = Heart;
  } else if (score >= 50) {
    statusText = "Doing Well";
    statusColor = "text-sarab-secondary";
    Icon = TrendingUp;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="bg-white rounded-[40px] shadow-sarab-lg p-8 md:p-12 border border-gray-50 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-sarab-cream rounded-bl-[100px] -z-10 transition-transform duration-700 group-hover:scale-110"></div>
      
      
        {/* Actions */}
        <div className="absolute top-6 right-6 flex gap-2 z-20">
          <button 
            onClick={fetchScore}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-sarab-primary hover:shadow-md transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={async () => {
              if (window.confirm("Are you sure you want to delete all scanned receipts? This will reset your diversity score and weekly report.")) {
                try {
                  const token = localStorage.getItem("token");
                  await axios.delete((import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + "/api/v1/receipts/all", { headers: { Authorization: `Bearer ${token}` } });
                  window.dispatchEvent(new Event("refreshDiversity"));
                  window.dispatchEvent(new Event("refreshWeeklyReport"));
                } catch (e) { console.error(e); }
              }
            }}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-sarab-red hover:shadow-md transition-all"
            title="Reset All Data"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gray-50 shadow-sm ${statusColor}`}>
              <Icon size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Status</p>
              <h3 className={`text-xl font-bold ${statusColor}`}>{statusText}</h3>
            </div>
          </div>
          
          <h2 className="text-5xl font-playfair font-bold text-sarab-dark leading-tight mb-4">
            Your Gut<br/>
            Microbiome
          </h2>
          <p className="text-gray-500 leading-relaxed max-w-sm mb-4">
            Based on unique plants scanned this week. Aim for 30+ to optimize diversity and digestion.
          </p>
          <div className="inline-flex items-center gap-2 bg-sarab-light px-4 py-2 rounded-full border border-gray-100">
            <span className="font-bold text-sarab-dark">{scoreData.unique_plants_count}</span>
            <span className="text-sm text-gray-500">diverse ingredients found</span>
          </div>
        </div>
        
        <div className="flex justify-center md:justify-end relative">
          <motion.div 
            initial={{ rotate: -90, opacity: 0 }}
            whileInView={{ rotate: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, type: "spring" }}
            className="w-48 h-48 md:w-64 md:h-64 rounded-full border-[12px] border-sarab-cream flex flex-col items-center justify-center relative bg-white shadow-sarab z-10"
          >
            <span className="text-6xl md:text-7xl font-playfair font-bold text-sarab-dark tracking-tighter">
              {score}
            </span>
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Score</span>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute top-0 right-10 text-sarab-primary opacity-20 z-0"
          >
            <Leaf size={80} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DiversityScore;



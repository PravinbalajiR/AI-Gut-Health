import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Calendar, Plus, Activity, AlertCircle, RefreshCw, MessageSquare, Coffee, Sun, Moon } from 'lucide-react';

const FoodDiary = () => {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [diaryData, setDiaryData] = useState({ entries: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [nlText, setNlText] = useState('');
  const [parsing, setParsing] = useState(false);
  
  const [insights, setInsights] = useState(null);
  const [fetchingInsights, setFetchingInsights] = useState(false);

  const fetchDiary = async (date) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const res = await axios.get(`${apiUrl}/api/v1/food-diary?target_date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiaryData(res.data || { entries: [], summary: {} });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch food diary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiary(targetDate);
  }, [targetDate]);

  const handleNLLog = async (e) => {
    e.preventDefault();
    if (!nlText.trim()) return;
    setParsing(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      await axios.post(`${apiUrl}/api/v1/food-diary/parse`, 
        { text: nlText, date: targetDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNlText('');
      fetchDiary(targetDate);
    } catch (err) {
      console.error(err);
      setError('Failed to log food.');
    } finally {
      setParsing(false);
    }
  };

  const fetchInsights = async () => {
    setFetchingInsights(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const res = await axios.get(`${apiUrl}/api/v1/food-diary/insights?force_refresh=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsights(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch insights.');
    } finally {
      setFetchingInsights(false);
    }
  };

  const entries = diaryData.entries || [];
  const meals = {
    Breakfast: entries.filter(e => e.meal_category?.toLowerCase() === 'breakfast'),
    Lunch: entries.filter(e => e.meal_category?.toLowerCase() === 'lunch'),
    Snacks: entries.filter(e => ['snacks', 'snack'].includes(e.meal_category?.toLowerCase())),
    Dinner: entries.filter(e => e.meal_category?.toLowerCase() === 'dinner')
  };
  
  const summary = diaryData.summary || {};

  const getMealIcon = (meal) => {
    switch(meal) {
      case 'Breakfast': return <Coffee className="text-sarab-secondary" size={20} />;
      case 'Lunch': return <Sun className="text-sarab-primary" size={20} />;
      case 'Snacks': return <Activity className="text-orange-400" size={20} />;
      case 'Dinner': return <Moon className="text-indigo-400" size={20} />;
      default: return <Activity size={20} />;
    }
  };

  return (
    <div className="bg-white rounded-[30px] p-8 shadow-sarab-lg border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-playfair font-bold text-sarab-dark">Food Diary</h2>
          <p className="text-gray-500 font-medium mt-1">Track your meals and discover medical correlations.</p>
        </div>
        
        <div className="flex items-center bg-gray-50 p-2 rounded-xl border border-gray-200">
          <Calendar className="text-gray-400 ml-2 mr-3" size={20} />
          <input 
            type="date" 
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sarab-dark font-medium"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-sarab-red p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* NL Logging */}
      <div className="bg-sarab-cream2/30 p-6 rounded-2xl mb-8 border border-sarab-cream">
        <h3 className="text-lg font-bold text-sarab-dark flex items-center gap-2 mb-3">
          <MessageSquare size={18} className="text-sarab-primary"/> Natural Language Logging
        </h3>
        <form onSubmit={handleNLLog} className="flex gap-3">
          <input
            type="text"
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            placeholder="e.g., I ate 2 dosas and a bowl of sambar for breakfast..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sarab-primary focus:outline-none"
          />
          <button 
            type="submit" 
            disabled={parsing}
            className="bg-sarab-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#22503a] transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {parsing ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
            Log
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(meals).map(([mealName, mealEntries]) => (
            <div key={mealName} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
                {getMealIcon(mealName)}
                <h3 className="text-xl font-playfair font-bold text-sarab-dark">{mealName}</h3>
              </div>
              
              {mealEntries.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No entries for {mealName.toLowerCase()} yet.</p>
              ) : (
                <div className="space-y-3">
                  {mealEntries.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <div className="font-medium text-gray-800">
                        {entry.food_name || entry.food} 
                        <span className="text-sm text-gray-500 font-normal ml-2">({entry.quantity_consumed || 1} {entry.serving_unit || 'serving'})</span>
                      </div>
                      <div className="text-sm font-bold text-sarab-primary">{entry.calories != null ? `${entry.calories} kcal` : 'N/A'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-sarab-dark text-white p-6 rounded-2xl shadow-sarab">
            <h3 className="text-xl font-playfair font-bold mb-4 border-b border-gray-700 pb-2">Daily Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-400">Calories</span><span className="font-bold">{summary.total_calories || 0} kcal</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Protein</span><span className="font-bold">{summary.total_protein || 0}g</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Carbs</span><span className="font-bold">{summary.total_carbs || 0}g</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Fiber</span><span className="font-bold">{summary.total_fiber || 0}g</span></div>
            </div>
          </div>

          <div className="bg-white border border-sarab-secondary/30 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-sarab-dark mb-2">Symptom Correlations</h3>
            <p className="text-xs text-gray-500 mb-4">Analyze how your food impacts your medical symptoms.</p>
            <button 
              onClick={fetchInsights}
              disabled={fetchingInsights}
              className="w-full bg-sarab-secondary text-white py-3 rounded-xl font-semibold hover:bg-opacity-90 transition-colors flex justify-center items-center gap-2"
            >
              {fetchingInsights ? <RefreshCw className="animate-spin" size={18} /> : <Activity size={18} />}
              Generate Insights
            </button>

            {insights && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
                {Array.isArray(insights) && insights.length > 0 ? (
                  <>
                    <div className="bg-orange-50 text-orange-900 p-4 rounded-lg text-sm border border-orange-200 leading-relaxed">
                      <div className="font-semibold mb-2 flex items-center gap-2">AI Medical Analysis</div>
                      <span className="whitespace-pre-wrap">{insights[0].ai_interpretation}</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2">Flagged Associations</div>
                    <div className="flex flex-wrap gap-2">
                      {insights.map((insight, idx) => (
                        <div key={idx} className="bg-white text-orange-800 px-3 py-1.5 rounded-full text-xs font-medium border border-orange-200 shadow-sm flex items-center gap-1">
                          <strong>{insight.food_name_or_ingredient}</strong> &rarr; {insight.associated_symptom}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic mt-4">
                    No significant correlations found yet.
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDiary;


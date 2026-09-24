import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, ChevronDown, ChevronUp, AlertCircle, 
  Lightbulb, Activity, CheckCircle2, ArrowRight, Trash2
} from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + '/api/v1';
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

function NutritionBar({ label, value, unit, max, colorClass, warning }) {
  const pct = Math.min(100, (value / max) * 100);
  const overLimit = value > max;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        <span>{label}</span>
        <span className={overLimit ? 'text-sarab-red' : 'text-gray-400'}>
          {value}{unit} / {max}{unit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(pct, 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${overLimit ? 'bg-sarab-red' : colorClass}`}
        />
      </div>
      {overLimit && warning && (
        <p className="text-[10px] text-sarab-red mt-1 text-right">{warning}</p>
      )}
    </div>
  );
}

function FoodCard({ item, category }) {
  const isGood = category === 'good';
  const isBad = category === 'bad';
  
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/5 flex flex-col gap-3 group hover:bg-white/15 transition-all">
      <div className="flex justify-between items-start">
        <span className="font-bold text-white leading-tight pr-4">{item.name}</span>
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isGood ? 'bg-sarab-primary' : isBad ? 'bg-sarab-red' : 'bg-sarab-secondary'}`}></div>
      </div>
      <div className="text-xs text-gray-400 font-medium leading-relaxed">{item.reason}</div>
    </div>
  );
}

export default function WeeklyReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedDay, setExpandedDay] = useState('monday');

  const fetchReport = async () => {
    setLoading(true);
    setError(false);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/analysis/weekly`, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    const handleRefresh = () => fetchReport();
    window.addEventListener('refreshWeeklyReport', handleRefresh);
    return () => window.removeEventListener('refreshWeeklyReport', handleRefresh);
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
          <RefreshCw className="text-white/50 w-8 h-8" />
        </motion.div>
        <p className="text-white/50 mt-4 font-dancing text-xl">Generating your weekly insights...</p>
      </div>
    );
  }

  if (error || !data || data.has_data === false) {
    return (
      <div className="p-8 text-center text-white/70">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-2xl font-playfair font-bold text-white mb-2">Insufficient Data</h3>
        <p className="text-sm font-poppins">Upload more receipts this week to unlock your full analysis.</p>
        <p className="text-xs mt-2 italic text-gray-500">{data?.message}</p>
        <button onClick={fetchReport} className="mt-6 border border-white/20 px-6 py-2 rounded-full text-sm font-medium hover:bg-white/10 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const { weekly_nutrition: wn, food_categories, alternatives, meal_plan, top_tips } = data;
  const goodFoods = food_categories?.good || [];
  const okFoods = food_categories?.moderate || [];
  const badFoods = food_categories?.bad || [];
  const hasInsights = goodFoods.length > 0 || okFoods.length > 0 || badFoods.length > 0;

  return (
    <div className="p-4 md:p-8 relative">
      {/* Actions */}
      <div className="absolute top-0 right-8 flex gap-2 z-20">
        <button 
          onClick={fetchReport}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 shadow-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 hover:shadow-md transition-all"
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
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 shadow-sm flex items-center justify-center text-white/70 hover:text-sarab-red hover:bg-white/20 hover:shadow-md transition-all"
          title="Reset All Data"
        >
          <Trash2 size={18} />
        </button>
      </div>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="lg:col-span-1 bg-white/5 border border-white/10 p-8 rounded-[30px]"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-sarab-secondary" size={24} />
            <h3 className="text-xl font-playfair font-bold text-white">Gut Impact</h3>
          </div>
          <div className="flex items-end gap-2 mb-8">
            <span className="text-6xl font-playfair font-bold text-white leading-none">{wn?.daily_avg_fiber_g || 0}</span>
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">g Fiber/Day</span>
          </div>
          
          <div className="space-y-6">
            <NutritionBar label="Fiber (weekly)" value={wn?.weekly_fiber_g} unit="g" max={210} colorClass="bg-sarab-primary" />
            <NutritionBar label="Sugar (weekly)" value={wn?.weekly_sugar_g} unit="g" max={350} colorClass="bg-sarab-secondary" warning="High sugar impacts gut lining" />
            <NutritionBar label="Sodium (weekly)" value={wn?.weekly_sodium_mg} unit="mg" max={16100} colorClass="bg-sarab-red" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 flex flex-col gap-8"
        >
          {/* Actionable Recommendations */}
          {top_tips && top_tips.length > 0 && (
            <div className="bg-sarab-primary/10 border border-sarab-primary/20 p-8 rounded-[30px] flex-1">
              <div className="flex items-center gap-3 mb-6">
                <Lightbulb className="text-sarab-primary" size={24} />
                <h3 className="text-xl font-playfair font-bold text-white">AI Recommendations</h3>
              </div>
              <ul className="space-y-4">
                {top_tips.map((rec, i) => (
                  <motion.li 
                    initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1 }}
                    key={i} className="flex gap-4 text-gray-300 font-medium"
                  >
                    <div className="mt-1 text-sarab-primary shrink-0"><CheckCircle2 size={16} /></div>
                    <span className="leading-relaxed">{rec}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </div>

      {/* Visual Food Insights */}
      {hasInsights && (
        <div className="mb-16">
          <div className="mb-8">
            <span className="font-dancing text-sarab-secondary text-2xl">What you bought</span>
            <h3 className="text-3xl font-playfair font-bold text-white mt-1">Food Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-xs font-bold text-sarab-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sarab-primary"></div> Beneficial
              </h4>
              <div className="space-y-3">
                {goodFoods.length === 0 ? <p className="text-xs text-gray-500 italic">None found this week.</p> : goodFoods.map((f, i) => <FoodCard key={i} item={f} category="good" />)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-sarab-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sarab-secondary"></div> Moderate
              </h4>
              <div className="space-y-3">
                {okFoods.length === 0 ? <p className="text-xs text-gray-500 italic">None found this week.</p> : okFoods.map((f, i) => <FoodCard key={i} item={f} category="moderate" />)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-sarab-red uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sarab-red"></div> Reduce
              </h4>
              <div className="space-y-3">
                {badFoods.length === 0 ? <p className="text-xs text-gray-500 italic">None found this week.</p> : badFoods.map((f, i) => <FoodCard key={i} item={f} category="bad" />)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Alternatives */}
      {alternatives && alternatives.length > 0 && (
        <div className="mb-16 bg-white/5 border border-white/10 rounded-[30px] p-8">
          <div className="mb-6 flex items-center gap-3">
            <ArrowRight className="text-sarab-secondary" size={24} />
            <h3 className="text-2xl font-playfair font-bold text-white">Smart Swaps</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alternatives.map((alt, i) => (
              <div key={i} className="bg-black/20 rounded-2xl p-4 flex flex-col gap-3 border border-white/5">
                <div className="flex items-center gap-3 text-sm font-bold">
                  <span className="text-gray-500 line-through">{alt.avoid}</span>
                  <ArrowRight size={14} className="text-sarab-primary" />
                  <span className="text-sarab-primary">{alt.swap_for}</span>
                </div>
                <p className="text-xs text-gray-400 font-medium">{alt.benefit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Meal Plan */}
      {meal_plan && (
        <div>
          <div className="mb-8">
            <span className="font-dancing text-sarab-primary text-2xl">Menu</span>
            <h3 className="text-3xl font-playfair font-bold text-white mt-1">Recommended Meal Plan</h3>
          </div>
          
          <div className="space-y-4">
            {DAY_ORDER.map(dayKey => {
              const plan = meal_plan[dayKey];
              if (!plan) return null;
              const isOpen = expandedDay === dayKey;
              
              return (
                <div key={dayKey} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => setExpandedDay(isOpen ? null : dayKey)}
                    className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-white text-lg">
                        {DAY_LABELS[dayKey]}
                      </div>
                      <div className="text-left text-lg font-playfair font-bold text-white capitalize">
                        {dayKey}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/20"
                      >
                        <div className="p-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                           {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => (
                             plan[mealType] && (
                               <div key={mealType} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                 <div className="flex items-center gap-2 mb-2">
                                   <span className="text-xl">{MEAL_ICONS[mealType]}</span>
                                   <span className="font-bold text-sarab-secondary capitalize text-sm">{mealType}</span>
                                 </div>
                                 <p className="text-sm text-gray-300 leading-relaxed font-medium">{plan[mealType]}</p>
                               </div>
                             )
                           ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}



import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Salad, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, Lightbulb, CalendarDays, BarChart3, Package
} from 'lucide-react';

const API = 'http://127.0.0.1:8000/api/v1';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

/* ── Nutrition bar ── */
function NutritionBar({ label, value, unit, max, color, icon, warning }) {
  const pct = Math.min(100, (value / max) * 100);
  const overLimit = value > max;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="flex items-center gap-1 font-medium text-gray-600">{icon} {label}</span>
        <span className={`font-bold ${overLimit ? 'text-red-500' : 'text-gray-800'}`}>
          {value}{unit}{overLimit && ' ⚠️'}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${overLimit ? 'bg-red-400' : color} transition-all duration-700`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {overLimit && warning && (
        <p className="text-xs text-red-400 mt-0.5">{warning}</p>
      )}
    </div>
  );
}

/* ── Rating pill ── */
function RatingPill({ rating }) {
  const map = {
    High: 'bg-emerald-100 text-emerald-700',
    Adequate: 'bg-blue-100 text-blue-700',
    Moderate: 'bg-amber-100 text-amber-700',
    Low: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${map[rating] || 'bg-gray-100 text-gray-500'}`}>
      {rating}
    </span>
  );
}

/* ── Food card ── */
function FoodCard({ item, category }) {
  const styles = {
    good: { border: 'border-l-emerald-400', bg: '' },
    moderate: { border: 'border-l-amber-400', bg: '' },
    bad: { border: 'border-l-red-400', bg: '' },
  };
  const badges = {
    good: <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">✅ Good</span>,
    moderate: <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">⚠️ OK</span>,
    bad: <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">❌ Avoid</span>,
  };
  const { border } = styles[category] || styles.moderate;
  return (
    <div className={`bg-white rounded-lg p-3 border border-gray-100 border-l-4 ${border} shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.reason}</p>
        </div>
        {badges[category]}
      </div>
    </div>
  );
}

/* ── Collapsible section ── */
function Section({ id, title, icon, count, activeId, onToggle, children }) {
  const open = activeId === id;
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 font-bold text-gray-700 text-sm">
          {icon}
          {title}
          {count != null && (
            <span className="ml-1 text-xs font-normal text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{count}</span>
          )}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════ */
export default function WeeklyReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState('monday');
  const [openSection, setOpenSection] = useState('nutrition');

  const token = () => localStorage.getItem('token');

  const fetchAnalysis = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/analysis/weekly`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setData(res.data);
    } catch (e) {
      setError('Failed to load weekly analysis.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('This will delete ALL your scanned receipts and reset the weekly report. Are you sure?')) return;
    setResetting(true);
    try {
      await axios.delete(`${API}/receipts/all`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      // Notify shopping list + diversity score to also clear
      window.dispatchEvent(new Event('refreshShoppingList'));
      window.dispatchEvent(new Event('refreshDiversity'));
      // Reload the (now-empty) analysis
      await fetchAnalysis(true);
    } catch (e) {
      setError('Failed to reset data. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    const refresh = () => fetchAnalysis(true);
    window.addEventListener('refreshDiversity', refresh);
    window.addEventListener('refreshShoppingList', refresh);
    return () => {
      window.removeEventListener('refreshDiversity', refresh);
      window.removeEventListener('refreshShoppingList', refresh);
    };
  }, []);

  const toggle = (id) => setOpenSection(prev => prev === id ? null : id);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-purple-100 rounded-full animate-pulse" />
          <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[160, 120, 80, 140].map((h, i) => (
            <div key={i} className="rounded-xl animate-pulse bg-gray-100" style={{ height: h }} />
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-4 animate-pulse">
          Analysing your receipts with AI…
        </p>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md border p-8 text-center">
        <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => fetchAnalysis()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">
          Retry
        </button>
      </div>
    );
  }

  /* ── No data state ── */
  if (!data || !data.has_data) {
    return (
      <div className="bg-white rounded-xl shadow-md border p-8 text-center">
        <Salad className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-semibold">No receipt data yet</p>
        <p className="text-sm text-gray-400 mt-1">
          {data?.message || 'Upload a receipt above to get your personalised weekly report!'}
        </p>
      </div>
    );
  }

  const { summary, weekly_nutrition: wn, food_categories, alternatives, meal_plan, top_tips, product_count, products } = data;

  const goodCount = food_categories?.good?.length || 0;
  const modCount  = food_categories?.moderate?.length || 0;
  const badCount  = food_categories?.bad?.length || 0;
  const totalCat  = goodCount + modCount + badCount;

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden">

      {/* ── Header ── */}
      <div className="p-5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Salad className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Weekly Gut Health Report</h2>
              <p className="text-purple-200 text-xs mt-0.5">
                Based on {product_count} items from your receipts this week
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => fetchAnalysis(true)}
              disabled={refreshing || resetting}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating…' : 'Refresh'}
            </button>
            <button
              onClick={handleReset}
              disabled={refreshing || resetting}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/40 hover:bg-red-500/60 rounded-lg text-sm font-medium transition-colors border border-red-300/30"
            >
              <XCircle className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
              {resetting ? 'Resetting…' : 'Reset'}
            </button>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <p className="text-purple-100 text-sm leading-relaxed bg-white/10 rounded-lg px-4 py-3">
            {summary}
          </p>
        )}

        {/* Category summary pills */}
        <div className="flex gap-3 mt-3 flex-wrap">
          <span className="text-xs bg-emerald-500/30 border border-emerald-300/30 text-white px-3 py-1 rounded-full font-bold">
            ✅ {goodCount} Good
          </span>
          <span className="text-xs bg-amber-400/30 border border-amber-300/30 text-white px-3 py-1 rounded-full font-bold">
            ⚠️ {modCount} Moderate
          </span>
          <span className="text-xs bg-red-500/30 border border-red-300/30 text-white px-3 py-1 rounded-full font-bold">
            ❌ {badCount} Avoid
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 space-y-3">

        {/* ── 1. Nutrition ── */}
        <Section id="nutrition" title="Weekly Nutrition Totals" icon={<BarChart3 className="h-4 w-4 text-blue-500" />} activeId={openSection} onToggle={toggle}>
          {/* Daily average callout */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-orange-500">{wn.daily_avg_calories?.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-medium mt-1">kcal / day (avg)</div>
              <RatingPill rating={wn.daily_avg_calories > 2500 ? 'High' : wn.daily_avg_calories > 1800 ? 'Adequate' : 'Low'} />
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-green-600">{wn.daily_avg_fiber_g}</div>
              <div className="text-xs text-gray-500 font-medium mt-1">g fiber / day (avg)</div>
              <RatingPill rating={wn.fiber_rating} />
            </div>
          </div>

          {/* Macro stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {[
              { label: 'Protein', val: wn.weekly_protein_g, unit: 'g', icon: '💪', bg: 'bg-blue-50', text: 'text-blue-600', rating: wn.protein_rating },
              { label: 'Sugar', val: wn.weekly_sugar_g, unit: 'g', icon: '🍬', bg: 'bg-pink-50', text: 'text-pink-600', rating: wn.sugar_rating },
              { label: 'Fiber', val: wn.weekly_fiber_g, unit: 'g', icon: '🌿', bg: 'bg-emerald-50', text: 'text-emerald-600', rating: wn.fiber_rating },
              { label: 'Sodium', val: wn.weekly_sodium_mg, unit: 'mg', icon: '🧂', bg: 'bg-red-50', text: 'text-red-600', rating: wn.sodium_rating },
            ].map(({ label, val, unit, icon, bg, text, rating }) => (
              <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                <div className="text-xl mb-1">{icon}</div>
                <div className={`text-lg font-extrabold ${text}`}>
                  {val?.toLocaleString()}<span className="text-xs font-medium ml-0.5">{unit}</span>
                </div>
                <div className="text-xs text-gray-500">{label} (week)</div>
                {rating && <RatingPill rating={rating} />}
              </div>
            ))}
          </div>

          {/* Bars — weekly totals vs sensible week targets */}
          <div className="space-y-3">
            <NutritionBar label="Calories (weekly)" value={wn.weekly_calories} unit=" kcal" max={14000} color="bg-orange-400" icon="🔥"
              warning="Over 2,000 kcal/day average" />
            <NutritionBar label="Carbohydrates (weekly)" value={wn.weekly_carbs_g} unit="g" max={2100} color="bg-yellow-400" icon="🍞"
              warning="Over 300g/day average" />
            <NutritionBar label="Fat (weekly)" value={wn.weekly_fat_g} unit="g" max={560} color="bg-orange-300" icon="🥑"
              warning="Over 80g/day average" />
            <NutritionBar label="Sodium (weekly)" value={wn.weekly_sodium_mg} unit="mg" max={16100} color="bg-red-300" icon="🧂"
              warning="Over 2,300mg/day (WHO limit)" />
            <NutritionBar label="Fiber (weekly)" value={wn.weekly_fiber_g} unit="g" max={210} color="bg-emerald-400" icon="🌿" />
          </div>
        </Section>

        {/* ── 2. Food Categories ── */}
        <Section
          id="categories"
          title="Your Food Categories"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          count={`${totalCat} items`}
          activeId={openSection}
          onToggle={toggle}
        >
          {totalCat === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No items categorised yet.</p>
          ) : (
            <div className="space-y-2">
              {(food_categories?.good || []).map((f, i) => <FoodCard key={`g${i}`} item={f} category="good" />)}
              {(food_categories?.moderate || []).map((f, i) => <FoodCard key={`m${i}`} item={f} category="moderate" />)}
              {(food_categories?.bad || []).map((f, i) => <FoodCard key={`b${i}`} item={f} category="bad" />)}
            </div>
          )}
        </Section>

        {/* ── 3. Alternatives ── */}
        {alternatives?.length > 0 && (
          <Section
            id="alternatives"
            title="Healthy Swaps"
            icon={<ArrowRight className="h-4 w-4 text-purple-500" />}
            count={alternatives.length}
            activeId={openSection}
            onToggle={toggle}
          >
            <div className="space-y-3">
              {alternatives.map((alt, i) => (
                <div key={i} className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full line-through">{alt.avoid}</span>
                    <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">{alt.swap_for}</span>
                  </div>
                  <p className="text-xs text-gray-500">{alt.benefit}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── 4. Meal Plan ── */}
        {meal_plan && (
          <Section
            id="mealplan"
            title="7-Day Meal Plan"
            icon={<CalendarDays className="h-4 w-4 text-teal-500" />}
            count="based on your groceries"
            activeId={openSection}
            onToggle={toggle}
          >
            {/* Day selector */}
            <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {DAY_ORDER.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    activeDay === day ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>

            {meal_plan[activeDay] ? (
              <div className="space-y-2">
                {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
                  meal_plan[activeDay][meal] ? (
                    <div key={meal} className="flex items-start gap-3 bg-teal-50 rounded-lg p-3 border border-teal-100">
                      <span className="text-xl flex-shrink-0">{MEAL_ICONS[meal]}</span>
                      <div>
                        <p className="text-xs font-bold text-teal-700 uppercase tracking-wide">{meal}</p>
                        <p className="text-sm text-gray-700 mt-0.5">{meal_plan[activeDay][meal]}</p>
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No meal plan for this day.</p>
            )}
          </Section>
        )}

        {/* ── 5. Products scanned ── */}
        {products?.length > 0 && (
          <Section
            id="products"
            title="Scanned Products This Week"
            icon={<Package className="h-4 w-4 text-gray-500" />}
            count={products.length}
            activeId={openSection}
            onToggle={toggle}
          >
            <div className="flex flex-wrap gap-2">
              {products.map((p, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200 font-medium">
                  {p}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* ── 6. Tips ── */}
        {top_tips?.length > 0 && (
          <Section
            id="tips"
            title="Personalised Tips"
            icon={<Lightbulb className="h-4 w-4 text-yellow-500" />}
            count={top_tips.length}
            activeId={openSection}
            onToggle={toggle}
          >
            <div className="space-y-2">
              {top_tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                  <span className="text-yellow-500 font-extrabold text-lg leading-none flex-shrink-0">{i + 1}</span>
                  <p className="text-sm text-gray-700 leading-snug">{tip}</p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

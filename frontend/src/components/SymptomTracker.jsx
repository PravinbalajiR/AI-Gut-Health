import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, Plus } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + '/api/v1';

const SymptomTracker = () => {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [todayLog, setTodayLog] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    severity_overall: 0,
    bloating: 0,
    abdominal_pain: 0,
    stool_type: 'Type 4',
    notes: ''
  });

  useEffect(() => {
    fetchSymptoms();
  }, []);

  const fetchSymptoms = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/symptoms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSymptoms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogSymptom = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/symptoms`, todayLog, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLogging(false);
      fetchSymptoms();
    } catch (err) {
      console.error("Failed to log symptom", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col h-full"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-playfair text-gray-800">Symptom Tracker</h3>
            <p className="text-sm text-gray-500">Log how you feel today</p>
          </div>
        </div>
        {!isLogging && (
          <button onClick={() => setIsLogging(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
            <Plus size={16} /> Log Today
          </button>
        )}
      </div>

      {isLogging ? (
        <form onSubmit={handleLogSymptom} className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overall Severity (0-10)</label>
              <input type="range" min="0" max="10" className="w-full accent-orange-500" 
                value={todayLog.severity_overall} onChange={e => setTodayLog({...todayLog, severity_overall: parseInt(e.target.value)})} />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>None</span><span>Severe</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bloating (0-10)</label>
                <input type="number" min="0" max="10" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500" 
                  value={todayLog.bloating} onChange={e => setTodayLog({...todayLog, bloating: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pain (0-10)</label>
                <input type="number" min="0" max="10" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500" 
                  value={todayLog.abdominal_pain} onChange={e => setTodayLog({...todayLog, abdominal_pain: parseInt(e.target.value)})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stool Type (Bristol Scale)</label>
              <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                value={todayLog.stool_type} onChange={e => setTodayLog({...todayLog, stool_type: e.target.value})}>
                <option>Type 1 (Hard lumps)</option>
                <option>Type 2 (Lumpy sausage)</option>
                <option>Type 3 (Sausage with cracks)</option>
                <option>Type 4 (Smooth, soft sausage)</option>
                <option>Type 5 (Soft blobs)</option>
                <option>Type 6 (Mushy)</option>
                <option>Type 7 (Liquid)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Suspected Foods</label>
              <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Ate spicy food..."
                value={todayLog.notes} onChange={e => setTodayLog({...todayLog, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button type="button" onClick={() => setIsLogging(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
            <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors">Save Entry</button>
          </div>
        </form>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-lg"></div>)}
            </div>
          ) : symptoms.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
              <Activity size={40} className="mb-2 opacity-20" />
              <p>No symptoms logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {symptoms.map(s => (
                <div key={s.symptom_id} className="p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{s.entry_date}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{s.notes || s.stool_type}</p>
                  </div>
                  <div className="flex gap-2">
                    {s.severity_overall > 0 && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Severity {s.severity_overall}</span>}
                    {s.bloating > 0 && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Bloat {s.bloating}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default SymptomTracker;

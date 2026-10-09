import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, FileText, Activity, AlertCircle, ShoppingBag } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + '/api/v1';

const MedicalTimeline = () => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/timeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeline(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'document': return <FileText size={16} className="text-blue-500" />;
      case 'symptom': return <Activity size={16} className="text-orange-500" />;
      case 'condition': return <AlertCircle size={16} className="text-red-500" />;
      case 'receipt': return <ShoppingBag size={16} className="text-green-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  if (loading) return <div className="bg-white p-6 rounded-2xl shadow-sm border animate-pulse h-64"></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border h-[400px] flex flex-col"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
          <Clock size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold font-playfair text-gray-800">Health Timeline</h3>
          <p className="text-sm text-gray-500">Chronological view of your health events</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        {timeline.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events to display yet.</p>
        ) : (
          <div className="space-y-6 relative">
            {timeline.map((event, i) => (
              <div key={i} className="flex gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0 z-10 shadow-sm mt-1">
                  {getIcon(event.type)}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border flex-1 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-gray-800 text-sm">{event.title}</h4>
                    <span className="text-xs text-gray-400 font-medium whitespace-nowrap ml-2">{event.date}</span>
                  </div>
                  {event.data.status && <p className="text-xs text-gray-500">Status: {event.data.status}</p>}
                  {event.data.severity !== undefined && <p className="text-xs text-gray-500">Severity: {event.data.severity}/10</p>}
                  {event.data.items && <p className="text-xs text-gray-500">{event.data.items} items scanned</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MedicalTimeline;

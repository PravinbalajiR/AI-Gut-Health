import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Save, Activity } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + '/api/v1';

const MedicalProfile = () => {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/medical-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/medical-profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setMessage('Profile saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="bg-white p-6 rounded-2xl shadow-sm border animate-pulse h-64"></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <User size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold font-playfair text-gray-800">My Medical Profile</h3>
          <p className="text-sm text-gray-500">Provide context for AI recommendations</p>
        </div>
        <div className="ml-auto text-right">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Completeness</span>
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-sarab-primary" style={{ width: `${profile.profile_completeness || 0}%` }}></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sarab-primary" 
              value={profile.date_of_birth || ''} onChange={e => setProfile({...profile, date_of_birth: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
            <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sarab-primary"
              value={profile.sex || ''} onChange={e => setProfile({...profile, sex: e.target.value})}>
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Preference</label>
            <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sarab-primary"
              value={profile.dietary_preference || ''} onChange={e => setProfile({...profile, dietary_preference: e.target.value})}>
              <option value="">No specific preference</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Pescatarian">Pescatarian</option>
              <option value="Keto">Keto</option>
              <option value="Paleo">Paleo</option>
              <option value="Low FODMAP">Low FODMAP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions/Allergies</label>
            <input type="text" placeholder="e.g. Gluten, Dairy, Nuts" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sarab-primary" 
              value={profile.dietary_restrictions || ''} onChange={e => setProfile({...profile, dietary_restrictions: e.target.value})} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Known GI History / Conditions</label>
          <textarea placeholder="e.g. Diagnosed with IBS-D in 2020. History of acid reflux." rows="2" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sarab-primary text-sm"
            value={profile.gi_history_notes || ''} onChange={e => setProfile({...profile, gi_history_notes: e.target.value})}></textarea>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className={`text-sm ${message.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>{message}</span>
          <button type="submit" disabled={saving} className="bg-sarab-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#22503a] transition-colors disabled:opacity-50">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default MedicalProfile;

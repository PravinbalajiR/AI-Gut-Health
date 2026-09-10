import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NutritionDashboard from './components/NutritionDashboard';
import ReceiptUploader from './components/ReceiptUploader';
import DiversityScore from './components/DiversityScore';
import AIAssistant from './components/AIAssistant';
import ShoppingList from './components/ShoppingList';
import AdminPanel from './components/AdminPanel';
import WeeklyReport from './components/WeeklyReport';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axios.post('http://127.0.0.1:8000/api/v1/auth/login', formData);
      localStorage.setItem('token', response.data.access_token);
      setToken(response.data.access_token);
      setError('');
    } catch (err) {
      setError('Login failed. Please check credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAdminMode(false);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-green-800">Gut Health AI</h1>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded" />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-800">Gut Health AI</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsAdminMode(!isAdminMode)} 
              className={`px-4 py-2 rounded text-sm font-bold transition-colors ${isAdminMode ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {isAdminMode ? 'Exit Admin Mode' : 'Admin Panel'}
            </button>
            <button onClick={handleLogout} className="text-red-600 hover:underline text-sm font-medium">Logout</button>
          </div>
        </div>
      </nav>
      <main className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isAdminMode ? (
          <AdminPanel />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              <DiversityScore />
              <NutritionDashboard />
              <ReceiptUploader />
            </div>
            <div className="lg:col-span-5 space-y-8">
              <AIAssistant />
              <ShoppingList />
            </div>
            {/* Full-width Weekly Report */}
            <div className="lg:col-span-12">
              <WeeklyReport />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NutritionDashboard from './components/NutritionDashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const res = await axios.post('http://127.0.0.1:8000/api/v1/auth/login', formData);
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
      setError('');
    } catch (err) {
      setError('Login failed');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-2xl mb-4 text-orange-600 font-bold">Gut Health AI - Login</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <input className="w-full border p-2 mb-4 rounded" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full border p-2 mb-4 rounded" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-orange-600 text-white p-2 rounded">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-orange-600">Gut Health AI</span>
            </div>
            <div className="flex items-center">
              <button onClick={() => {
                localStorage.removeItem('token');
                setToken(null);
              }} className="text-sm text-gray-500">Logout</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10">
        <NutritionDashboard />
      </main>
    </div>
  );
}

export default App;

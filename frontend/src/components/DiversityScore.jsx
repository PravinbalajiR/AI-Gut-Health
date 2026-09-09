import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Leaf } from 'lucide-react';

const DiversityScore = () => {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchScore = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/v1/scores/diversity/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScore(response.data);
    } catch (err) {
      setError('Failed to fetch diversity score');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
    
    // Set up a custom event listener so other components can trigger a refresh
    const handleRefresh = () => fetchScore();
    window.addEventListener('refreshDiversity', handleRefresh);
    return () => window.removeEventListener('refreshDiversity', handleRefresh);
  }, []);

  if (loading) return <div className="animate-pulse bg-gray-200 h-32 rounded-xl mb-8 max-w-4xl mx-auto"></div>;
  if (error) return null; // Silently fail for now if no score
  if (!score) return null;

  return (
    <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden text-white">
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white/20 rounded-full">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Weekly Plant Diversity</h2>
            <p className="text-teal-100 mt-1">Based on unique ingredients from your receipts in the last 7 days.</p>
            <p className="text-xs text-teal-200 mt-2">Target: 30 unique plants/ingredients per week.</p>
          </div>
        </div>
        
        <div className="text-center bg-white/10 p-6 rounded-xl border border-white/20 min-w-[200px]">
          <div className="text-sm font-semibold uppercase tracking-wider text-teal-100 mb-2">Diversity Score</div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-extrabold">{score.score}</span>
            <span className="text-xl text-teal-200 font-medium">/ 100</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiversityScore;

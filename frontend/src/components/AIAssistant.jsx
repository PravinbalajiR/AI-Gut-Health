import React, { useState } from 'react';
import axios from 'axios';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI Gut Health Assistant. I have context on your recent receipts and your weekly plant diversity score. How can I help you optimize your diet today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://127.0.0.1:8000/api/v1/assistant/chat', 
        { question: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please make sure the GEMINI_API_KEY is configured in the backend environment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center gap-3">
        <Bot className="h-6 w-6" />
        <h2 className="text-xl font-bold">AI Gut Health Coach</h2>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-600 text-white'}`}>
              {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border shadow-sm rounded-tl-sm text-gray-800 whitespace-pre-wrap'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Loader2 className="animate-spin h-4 w-4" />
            </div>
            <div className="p-4 bg-white border shadow-sm rounded-2xl rounded-tl-sm text-gray-500">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your diet, recommendations, or diversity score..."
            className="flex-1 px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send size={20} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Loader2 } from 'lucide-react';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello. I'm your Gut Health AI Coach. I have context on your recent grocery scans and diversity scores. What would you like to explore about your microbiome today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post((import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + '/api/v1/assistant/chat', 
        { question: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "My apologies, I encountered an issue connecting to my knowledge base.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const presetQuestions = [
    "What should I eat to increase diversity?",
    "Analyze my recent groceries",
    "Why am I feeling bloated?"
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-[30px] overflow-hidden shadow-sm relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-sarab-secondary opacity-5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="p-6 pb-2 relative z-10 flex items-center justify-between">
        <div>
          <span className="font-dancing text-sarab-secondary text-xl mb-1 block">Always here for you</span>
          <h3 className="text-2xl font-playfair font-bold text-sarab-dark flex items-center gap-2">
            AI Coach <Sparkles className="text-sarab-primary" size={20}/>
          </h3>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 relative z-10 scroll-smooth">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-4 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-sarab-cream flex items-center justify-center shrink-0 border border-sarab-cream2 text-sarab-secondary shadow-sm">
                  <Sparkles size={18} />
                </div>
              )}
              
              <div className={`max-w-[85%] p-5 text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-sarab-dark text-white rounded-3xl rounded-tr-none' 
                  : 'bg-white border border-gray-100 text-gray-700 rounded-3xl rounded-tl-none font-poppins'
              }`}>
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-sarab-dark font-playfair text-lg">$1</strong>') }} />
                ) : (
                  msg.content
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
                  <User size={18} />
                </div>
              )}
            </motion.div>
          ))}
          
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 justify-start"
            >
              <div className="w-10 h-10 rounded-full bg-sarab-cream flex items-center justify-center shrink-0 border border-sarab-cream2 text-sarab-secondary shadow-sm">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <div className="p-5 bg-white border border-gray-100 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-2">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-sarab-primary rounded-full"></motion.div>
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-sarab-primary rounded-full"></motion.div>
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-sarab-primary rounded-full"></motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-white relative z-10 border-t border-gray-50">
        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2 mb-4">
            {presetQuestions.map((q, i) => (
              <button 
                key={i}
                onClick={() => setInput(q)}
                className="text-xs bg-sarab-light text-sarab-dark border border-gray-200 px-4 py-2 rounded-full font-medium hover:bg-sarab-cream2 hover:border-sarab-secondary transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={sendMessage} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your gut health..."
            className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sarab-primary focus:bg-white transition-all text-sm font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 w-10 h-10 bg-sarab-primary text-white rounded-full flex items-center justify-center hover:bg-[#22503a] transition-colors disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
          >
            <Send size={16} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;


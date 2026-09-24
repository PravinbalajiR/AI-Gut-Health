import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import NutritionDashboard from './components/NutritionDashboard';
import ReceiptUploader from './components/ReceiptUploader';
import DiversityScore from './components/DiversityScore';
import AIAssistant from './components/AIAssistant';
import ShoppingList from './components/ShoppingList';
import AdminPanel from './components/AdminPanel';
import WeeklyReport from './components/WeeklyReport';
import { Leaf, LogOut, Settings, Menu, X, ArrowRight, Activity, TrendingUp, Sparkles, ShoppingBag } from 'lucide-react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axios.post((import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + '/api/v1/auth/login', formData);
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

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-sarab-light flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sarab-primary opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-sarab-secondary opacity-5 rounded-full blur-3xl"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-10 rounded-3xl shadow-sarab-lg w-full max-w-md relative z-10 border border-gray-100"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-sarab-cream2 text-sarab-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf size={32} />
            </div>
            <h1 className="text-3xl font-playfair font-bold text-sarab-dark">Gut Health AI</h1>
            <p className="text-gray-500 mt-2 font-poppins text-sm">Sign in to your personalized microbiome journey</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-sarab-red text-sm p-3 rounded-xl mb-6 text-center font-medium">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-sarab-dark mb-2">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sarab-primary focus:border-transparent transition-all bg-gray-50 focus:bg-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-sarab-dark mb-2">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sarab-primary focus:border-transparent transition-all bg-gray-50 focus:bg-white" 
              />
            </div>
            <button type="submit" className="w-full bg-sarab-primary text-white py-3.5 rounded-xl font-semibold hover:bg-[#22503a] hover:shadow-sarab transition-all transform hover:-translate-y-0.5">
              Access My Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sarab-light text-gray-800 font-poppins flex flex-col relative overflow-hidden">
      
      {/* Top Bar (Sarab Style) */}
      <div className="bg-sarab-dark text-gray-300 py-2 text-xs font-medium hidden md:block z-50 relative">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><Sparkles size={14} className="text-sarab-secondary" /> AI-Powered MicroBiome Analysis</span>
            <span className="flex items-center gap-2"><Activity size={14} className="text-sarab-secondary" /> Real-time Gut Tracking</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="bg-sarab-primary text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Premium Member</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sarab py-3' : 'bg-white py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('hero')}>
            <div className="w-10 h-10 bg-sarab-primary rounded-full flex items-center justify-center text-white shadow-md">
              <Leaf size={20} />
            </div>
            <h1 className="text-2xl font-playfair font-bold text-sarab-dark tracking-tight">Gut Health <span className="text-sarab-primary">AI</span></h1>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 font-medium text-sm">
            <button onClick={() => scrollTo('status')} className="text-gray-600 hover:text-sarab-primary transition-colors">My Gut</button>
            <button onClick={() => scrollTo('food')} className="text-gray-600 hover:text-sarab-primary transition-colors">Food & OCR</button>
            <button onClick={() => scrollTo('ai')} className="text-gray-600 hover:text-sarab-primary transition-colors">AI Coach</button>
            <button onClick={() => scrollTo('shopping')} className="text-gray-600 hover:text-sarab-primary transition-colors">Shopping</button>
            <button onClick={() => scrollTo('report')} className="text-gray-600 hover:text-sarab-primary transition-colors">Reports</button>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <button 
              onClick={() => setIsAdminMode(!isAdminMode)} 
              className={`p-2 rounded-full transition-colors ${isAdminMode ? 'bg-sarab-secondary text-white shadow-md' : 'text-gray-400 hover:bg-gray-100 hover:text-sarab-dark'}`}
              title="Admin Panel"
            >
              <Settings size={20} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium text-sm transition-colors group">
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
              <span>Logout</span>
            </button>
          </div>

          <button className="lg:hidden text-sarab-dark p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b shadow-lg overflow-hidden fixed w-full z-30 top-[60px]"
          >
            <div className="flex flex-col p-4 gap-4 font-medium">
              <button onClick={() => scrollTo('status')} className="text-left py-2 border-b">My Gut</button>
              <button onClick={() => scrollTo('food')} className="text-left py-2 border-b">Food & OCR</button>
              <button onClick={() => scrollTo('ai')} className="text-left py-2 border-b">AI Coach</button>
              <button onClick={() => scrollTo('shopping')} className="text-left py-2 border-b">Shopping</button>
              <button onClick={() => scrollTo('report')} className="text-left py-2 border-b">Reports</button>
              <button onClick={() => setIsAdminMode(!isAdminMode)} className="text-left py-2 border-b text-sarab-secondary">Admin Mode</button>
              <button onClick={handleLogout} className="text-left py-2 text-red-500 flex items-center gap-2"><LogOut size={18}/> Logout</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative z-10 pb-20">
        
        {isAdminMode ? (
          <div className="max-w-7xl mx-auto px-6 py-12 w-full">
            <AdminPanel />
          </div>
        ) : (
          <>
            {/* HERO SECTION */}
            <section id="hero" className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 px-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-sarab-cream2 rounded-bl-[100px] -z-10 transform translate-x-1/4"></div>
              
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="max-w-xl"
                >
                  <span className="font-dancing text-sarab-secondary text-2xl mb-4 block">Welcome to your wellness journey</span>
                  <h1 className="text-5xl lg:text-7xl font-playfair font-bold text-sarab-dark leading-[1.1] mb-6">
                    Your gut.<br />
                    <span className="text-sarab-primary relative inline-block">
                      Understood.
                      <svg className="absolute w-full h-4 -bottom-1 left-0 text-sarab-secondary opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent"/></svg>
                    </span>
                  </h1>
                  <p className="text-lg text-gray-600 mb-10 leading-relaxed font-light">
                    AI-powered insights connecting what you eat with how you feel. Scan your receipts, track your plant diversity, and build a thriving microbiome.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button onClick={() => scrollTo('status')} className="bg-sarab-primary text-white px-8 py-4 rounded-full font-semibold shadow-sarab hover:shadow-sarab-hover hover:bg-[#22503a] transition-all flex items-center gap-2 transform hover:-translate-y-1">
                      Explore Your Gut <ArrowRight size={18} />
                    </button>
                    <button onClick={() => scrollTo('food')} className="bg-white text-sarab-dark border-2 border-gray-100 px-8 py-4 rounded-full font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-1">
                      Scan Receipt
                    </button>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="relative"
                >
                  <div className="relative rounded-3xl overflow-hidden shadow-sarab-lg aspect-[4/3] group">
                    <img 
                      src="/img/gut-health.png" 
                      alt="Healthy fresh food" 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1200'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  </div>
                  
                  {/* Floating Elements */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-sarab flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-green-100 text-sarab-primary rounded-full flex items-center justify-center">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Diversity Score</p>
                      <p className="text-xl font-bold text-sarab-dark">Optimized</p>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </section>

            {/* STATUS & DISCOVER */}
            <section id="status" className="py-20 bg-white relative">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <span className="font-dancing text-sarab-primary text-2xl">Today's Snapshot</span>
                  <h2 className="text-4xl font-playfair font-bold text-sarab-dark mt-2">How is your gut doing?</h2>
                </div>
                
                <div className="flex justify-center w-full mb-12">
                  <div className="w-full max-w-4xl">
                    <DiversityScore />
                  </div>
                </div>
              </div>
            </section>

            {/* FOOD SCANNING & EXPLORATION */}
            <section id="food" className="py-24 bg-sarab-cream relative overflow-hidden">
              {/* Decorative background circle */}
              <div className="absolute top-1/2 left-0 w-96 h-96 bg-white rounded-full opacity-50 blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                  <div>
                    <div className="mb-8">
                      <span className="font-dancing text-sarab-secondary text-2xl">Discover</span>
                      <h2 className="text-4xl font-playfair font-bold text-sarab-dark mt-2 mb-4">What's on your plate.</h2>
                      <p className="text-gray-600">Scan grocery receipts or search directly to instantly understand the nutritional impact of your foods on your microbiome.</p>
                    </div>
                    
                    <div className="bg-white rounded-3xl shadow-sarab-lg p-1 overflow-hidden">
                      <ReceiptUploader />
                    </div>
                  </div>
                  
                  <div className="lg:pt-20">
                    <div className="bg-white rounded-3xl shadow-sarab-lg p-1 overflow-hidden h-full">
                       <NutritionDashboard />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* AI COACH & SHOPPING */}
            <section id="ai" className="py-24 bg-white relative">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <span className="font-dancing text-sarab-primary text-2xl">Your Personal Guide</span>
                  <h2 className="text-4xl font-playfair font-bold text-sarab-dark mt-2">Intelligent AI Coaching</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-7">
                    <div className="bg-sarab-light rounded-3xl shadow-sarab p-2 h-[700px] border border-gray-100 flex flex-col">
                      <AIAssistant />
                    </div>
                  </div>
                  
                  <div id="shopping" className="lg:col-span-5">
                    <div className="bg-white rounded-3xl shadow-sarab border border-gray-100 h-full p-2 flex flex-col">
                      <div className="p-6 pb-2">
                        <div className="flex items-center gap-3 mb-2">
                          <ShoppingBag className="text-sarab-secondary" size={28} />
                          <h3 className="text-2xl font-playfair font-bold text-sarab-dark">Smart Grocery List</h3>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Curated for your microbiome diversity.</p>
                      </div>
                      <div className="flex-1 overflow-hidden px-2">
                        <ShoppingList />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* WEEKLY REPORT */}
            <section id="report" className="py-24 bg-sarab-dark text-white relative overflow-hidden">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sarab-primary opacity-20 rounded-full blur-[100px] transform translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                  <span className="font-dancing text-sarab-secondary text-2xl">Progress</span>
                  <h2 className="text-4xl font-playfair font-bold mt-2">Your Week in Review</h2>
                  <p className="text-gray-400 mt-4 max-w-2xl mx-auto">Analyze trends, spot dietary gaps, and see exactly how your choices are shaping your gut health over time.</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl">
                  <WeeklyReport />
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-sarab-primary rounded-full flex items-center justify-center text-white">
                  <Leaf size={20} />
                </div>
                <h2 className="text-2xl font-playfair font-bold text-white tracking-tight">Gut Health <span className="text-sarab-primary">AI</span></h2>
              </div>
              <p className="max-w-md leading-relaxed text-sm">
                Empowering your digestive wellness through cutting-edge AI, nutritional science, and seamless receipt tracking. Your gut, fully understood.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6 font-poppins tracking-wide">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => scrollTo('hero')} className="hover:text-sarab-primary transition-colors">Home</button></li>
                <li><button onClick={() => scrollTo('status')} className="hover:text-sarab-primary transition-colors">My Gut Status</button></li>
                <li><button onClick={() => scrollTo('food')} className="hover:text-sarab-primary transition-colors">Scan Receipt</button></li>
                <li><button onClick={() => scrollTo('ai')} className="hover:text-sarab-primary transition-colors">AI Coach</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6 font-poppins tracking-wide">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-sarab-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-sarab-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-sarab-primary transition-colors">Medical Disclaimer</a></li>
                <li><a href="#" className="hover:text-sarab-primary transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; 2026 Gut Health AI. All rights reserved.</p>
            <p className="text-xs text-gray-500">Not intended as medical advice. Always consult a physician.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;


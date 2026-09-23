import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, FileText, Loader2, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';

const ReceiptUploader = () => {
  const [file, setFile] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('store_name', storeName || 'Unknown Store');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://127.0.0.1:8000/api/v1/receipts/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data);
      
      window.dispatchEvent(new Event('refreshShoppingList'));
      window.dispatchEvent(new Event('refreshDiversity'));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 relative overflow-hidden h-full flex flex-col justify-center">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-sarab-secondary opacity-10 rounded-full blur-2xl"></div>
      
      <div className="mb-8">
        <h3 className="text-3xl font-playfair font-bold text-sarab-dark mb-2">Scan Receipt</h3>
        <p className="text-gray-500 font-poppins text-sm">Upload your grocery receipt and let our AI extract the ingredients.</p>
      </div>

      <AnimatePresence mode="wait">
        {!result && !loading && (
          <motion.form 
            key="upload-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleUpload} 
            className="flex flex-col gap-6"
          >
            <div>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Where did you shop? (Optional)"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sarab-primary transition-all text-sarab-dark font-medium placeholder-gray-400"
              />
            </div>

            <div 
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${dragActive ? 'border-sarab-primary bg-green-50' : file ? 'border-sarab-secondary bg-orange-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => { if(e.target.files?.[0]) setFile(e.target.files[0]) }}
                className="hidden"
              />
              
              {!file ? (
                <div className="flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-sarab-primary">
                    <Camera size={28} />
                  </div>
                  <p className="font-semibold text-sarab-dark text-lg mb-1">Click or drag receipt here</p>
                  <p className="text-xs text-gray-400 font-medium">JPEG, PNG up to 10MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-sarab-secondary">
                    <FileText size={28} />
                  </div>
                  <p className="font-semibold text-sarab-dark text-lg mb-1">{file.name}</p>
                  <p className="text-xs text-sarab-secondary font-bold">Ready to scan!</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!file}
              className="w-full py-4 bg-sarab-dark text-white rounded-2xl font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Analyze Receipt <ChevronRight size={18} />
            </button>
            
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sarab-red text-sm font-medium bg-red-50 p-3 rounded-xl justify-center">
                <XCircle size={16} /> {error}
              </motion.div>
            )}
          </motion.form>
        )}

        {loading && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="relative w-24 h-24 flex items-center justify-center mb-8">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-sarab-primary rounded-full blur-xl"
              ></motion.div>
              <Loader2 size={40} className="text-sarab-primary animate-spin relative z-10" />
            </div>
            <h4 className="text-2xl font-playfair font-bold text-sarab-dark mb-2">Reading Receipt...</h4>
            <p className="text-gray-500 text-sm">Our AI is extracting nutritional profiles</p>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-sarab-cream rounded-2xl p-6 border border-sarab-cream2"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-sarab-primary rounded-full flex items-center justify-center text-white">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sarab-dark text-lg">Scan Complete</h4>
                <p className="text-xs text-gray-500 font-medium">Store: {result.store_name}</p>
              </div>
            </div>

            <div className="mb-6">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Found Ingredients</h5>
              {result.items.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.items.map((item) => (
                    <span key={item.receipt_item_id} className="bg-white border border-gray-100 px-4 py-2 rounded-full text-sm font-semibold text-sarab-dark shadow-sm">
                      {item.product?.product_name || `Item ${item.product_id}`}
                      <span className="ml-2 text-gray-400 text-xs">x{item.quantity}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic bg-white p-4 rounded-xl border border-gray-100">
                  No familiar products identified. Try searching manually to add them to your database.
                </p>
              )}
            </div>

            <button 
              onClick={() => { setResult(null); setFile(null); setStoreName(''); }}
              className="w-full bg-white border border-gray-200 text-sarab-dark font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Scan Another Receipt
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReceiptUploader;

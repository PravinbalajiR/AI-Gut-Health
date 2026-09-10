import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';

const ReceiptUploader = () => {
  const [file, setFile] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
      
      // Notify both ShoppingList and DiversityScore to refresh
      window.dispatchEvent(new Event('refreshShoppingList'));
      window.dispatchEvent(new Event('refreshDiversity'));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <FileText className="h-6 w-6 text-orange-600" />
        Receipt Scanner (OCR)
      </h2>

      <form onSubmit={handleUpload} className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Store Name (Optional)</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Whole Foods"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="mt-6 w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Upload className="h-5 w-5" />}
          {loading ? 'Processing Image & Matching Products...' : 'Upload & Analyze Receipt'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-2 text-green-800 mb-4">
            <CheckCircle2 className="h-6 w-6" />
            <h3 className="text-xl font-bold">Receipt Processed Successfully!</h3>
          </div>
          
          <p className="text-green-900 font-medium mb-4">
            Store: {result.store_name}
          </p>

          <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Identified Products</h4>
          {result.items.length > 0 ? (
            <ul className="space-y-3">
              {result.items.map((item) => (
                <li key={item.receipt_item_id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
                  <span className="font-medium text-gray-800">{item.product?.product_name || `Unknown Product ID ${item.product_id}`}</span>
                  <span className="text-sm text-gray-500 text-right">
                    {item.product?.brand && <span className="block">{item.product.brand}</span>}
                    Qty: {item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">
              No products in your local database matched the text found on this receipt. 
              Tip: Use the search bar above to search for an item (e.g., "Milk" or "Apples") to add it to your database, then upload the receipt again!
            </p>
          )}

          {result.raw_ocr_text && (
            <div className="mt-8 pt-6 border-t border-green-200">
              <h4 className="font-bold text-gray-800 mb-3">Raw Extracted Text (Diagnostics)</h4>
              <pre className="bg-gray-50 p-4 rounded text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto border">
                {result.raw_ocr_text}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceiptUploader;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FileText, UploadCloud, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + '/api/v1';

const MedicalRecords = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [consent, setConsent] = useState(false);
  const [reviewingDoc, setReviewingDoc] = useState(null);
  const [extractions, setExtractions] = useState([]);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/medical-records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ai_consent', consent);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/medical-records/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFile(null);
      setConsent(false);
      fetchDocs();
    } catch (err) {
      alert("Upload failed: " + err.response?.data?.detail || err.message);
    } finally {
      setUploading(false);
    }
  };

  const startReview = async (doc) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/medical-records/${doc.document_id}/extractions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExtractions(res.data.map(ext => ({...ext, review_status: 'confirmed'}))); // default to confirmed
      setReviewingDoc(doc);
    } catch (err) {
      console.error(err);
    }
  };

  const submitReview = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/medical-records/${reviewingDoc.document_id}/review`, {
        extractions: extractions.map(e => ({
          extraction_id: e.extraction_id,
          review_status: e.review_status,
          user_correction: e.user_correction
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewingDoc(null);
      fetchDocs();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="bg-white p-6 rounded-2xl shadow-sm border animate-pulse h-64"></div>;

  if (reviewingDoc) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-2xl shadow-sm border h-[400px] flex flex-col">
        <h3 className="text-lg font-bold mb-4">Review Extractions: {reviewingDoc.original_filename}</h3>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {extractions.length === 0 ? (
            <p className="text-gray-500">No medical data could be automatically extracted.</p>
          ) : extractions.map((ext, idx) => (
            <div key={ext.extraction_id} className="p-3 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm uppercase text-gray-500">{ext.field_type}</span>
                <select 
                  className="text-sm border rounded p-1"
                  value={ext.review_status}
                  onChange={(e) => {
                    const newExt = [...extractions];
                    newExt[idx].review_status = e.target.value;
                    setExtractions(newExt);
                  }}
                >
                  <option value="confirmed">Confirm</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              <p className="font-medium text-gray-800">{ext.field_name}: {ext.extracted_value} {ext.extracted_unit || ''}</p>
              {ext.original_text && <p className="text-xs text-gray-400 mt-1 italic">"{ext.original_text}"</p>}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <button onClick={() => setReviewingDoc(null)} className="flex-1 py-2 text-gray-600 font-medium">Cancel</button>
          <button onClick={submitReview} className="flex-1 bg-sarab-primary text-white py-2 rounded-lg font-medium">Save to Profile</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border h-[400px] flex flex-col"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold font-playfair text-gray-800">Medical Records</h3>
          <p className="text-sm text-gray-500">Upload lab results & reports</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="mb-6 p-4 border-2 border-dashed rounded-xl bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <input type="file" accept="image/*,application/pdf" className="text-sm flex-1" onChange={e => setFile(e.target.files[0])} />
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 mb-3 cursor-pointer">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="rounded" />
          I consent to processing this document with AI to extract clinical data.
        </label>
        <button type="submit" disabled={!file || uploading} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium text-sm flex justify-center items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50">
          <UploadCloud size={16} /> {uploading ? 'Processing...' : 'Upload & Process'}
        </button>
      </form>

      <div className="flex-1 overflow-y-auto">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Your Documents</h4>
        {docs.length === 0 ? (
          <p className="text-xs text-gray-400">No documents uploaded.</p>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => (
              <div key={doc.document_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{doc.original_filename}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.processing_status === 'needs_review' && (
                    <button onClick={() => startReview(doc)} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium">Review Data</button>
                  )}
                  {doc.processing_status === 'complete' && <CheckCircle size={14} className="text-green-500" />}
                  {doc.processing_status === 'failed' && <AlertCircle size={14} className="text-red-500" title={doc.processing_error} />}
                  <button onClick={async () => {
                    const token = localStorage.getItem('token');
                    await axios.delete(`${API}/medical-records/${doc.document_id}`, { headers: { Authorization: `Bearer ${token}` } });
                    fetchDocs();
                  }} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MedicalRecords;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { API_BASE_URL } from '../utils/api';

const KYC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    country: '',
    state: '',
    city: '',
    postcode: '',
    street: '',
    idType: 'Passport',
    idDocument: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    fetch(`${API_BASE_URL}/api/kyc/status/${user.uid}`)
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          setStatus(data.status);
        } else {
          setStatus('unverified');
        }
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
        setError('Failed to fetch status');
      });
  }, [user]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, idDocument: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const requestVerification = async () => {
    // Format: Country, City, State, Postcode, Street
    const fullAddress = [
      formData.country,
      formData.city,
      formData.state,
      formData.postcode,
      formData.street
    ].filter(Boolean).join(', ');

    if (!formData.fullName || !formData.dateOfBirth || !formData.country || !formData.city || !formData.state || !formData.postcode || !formData.street || !formData.idDocument) {
      alert('Please fill out all required fields (including State and Postcode) and upload an ID document.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/kyc/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.uid,
          full_name: formData.fullName,
          date_of_birth: formData.dateOfBirth,
          address: fullAddress,
          id_type: formData.idType,
          id_document: formData.idDocument
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('pending');
        alert('Verification request submitted successfully.');
        navigate('/profile');
      } else {
        alert(data.error || 'Failed to submit request.');
      }
    } catch (err) {
      alert('Network error submitting request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <div className="container mx-auto max-w-3xl px-4 py-8 flex-1 flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary mb-2">Identity Verification</h1>
          <p className="text-secondary">Complete KYC to unlock higher withdrawal limits and VIP tiers.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8 flex-1 flex flex-col items-center justify-center">
          {status === 'loading' && <div className="text-secondary">Loading your status...</div>}
          
          {status === 'error' && (
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">!</div>
              <p className="text-secondary mb-6">{error}</p>
            </div>
          )}

          {status === 'verified' && (
            <div className="text-center">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">You are Verified</h2>
              <p className="text-secondary mb-6">Your identity has been verified. You have full access.</p>
              <button 
                onClick={() => navigate('/profile')}
                className="bg-blue-50 text-secondary px-8 py-3 rounded-lg font-bold hover:bg-blue-100 transition"
              >
                Return to Profile
              </button>
            </div>
          )}

          {status === 'pending' && (
            <div className="text-center">
              <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 animate-pulse">
                ⏳
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Verification Pending</h2>
              <p className="text-secondary mb-6">Your verification request is currently processing. Please check back later.</p>
              <button 
                onClick={() => navigate('/profile')}
                className="bg-blue-50 text-secondary px-8 py-3 rounded-lg font-bold hover:bg-blue-100 transition"
              >
                Return to Profile
              </button>
            </div>
          )}

          {(status === 'unverified' || status === 'rejected') && (
            <div className="text-center w-full max-w-md mx-auto">
              {status === 'rejected' && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm font-bold border border-red-100">
                  Your previous verification request was rejected. Please submit a new request.
                </div>
              )}
              <div className="bg-white p-6 rounded-xl border border-blue-100 mb-8 text-left shadow-sm">
                <h3 className="font-bold text-primary mb-4 text-xl">Personal Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-1">Full Legal Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-accent focus:border-accent"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-1">Date of Birth</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-accent focus:border-accent"
                      value={formData.dateOfBirth}
                      onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-secondary mb-1">Country</label>
                      <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-accent focus:border-accent"
                        placeholder="United States"
                        value={formData.country}
                        onChange={e => setFormData({...formData, country: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-secondary mb-1">State / Province</label>
                      <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-accent focus:border-accent"
                        placeholder="California"
                        value={formData.state}
                        onChange={e => setFormData({...formData, state: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-secondary mb-1">City</label>
                      <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-accent focus:border-accent"
                        placeholder="San Francisco"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-secondary mb-1">Postal / Zip Code</label>
                      <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-accent focus:border-accent"
                        placeholder="94105"
                        value={formData.postcode}
                        onChange={e => setFormData({...formData, postcode: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-1">Street Address</label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-accent focus:border-accent"
                      placeholder="123 Main St, Apt 4B"
                      rows="2"
                      value={formData.street}
                      onChange={e => setFormData({...formData, street: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-1">Document Type</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-accent focus:border-accent"
                      value={formData.idType}
                      onChange={e => setFormData({...formData, idType: e.target.value})}
                    >
                      <option value="Passport">Passport</option>
                      <option value="Driver's License">Driver's License</option>
                      <option value="National ID Card">National ID Card</option>
                      <option value="Residence Permit">Residence Permit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-1">Upload Document Image</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-accent focus:border-accent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={handleImageUpload}
                    />
                    {formData.idDocument && <p className="text-xs text-green-600 mt-2 font-semibold">✓ Document attached</p>}
                  </div>
                </div>
              </div>
              <button 
                onClick={requestVerification}
                disabled={isSubmitting}
                className={`w-full text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition text-lg ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#00B4D8] hover:bg-opacity-90'}`}
              >
                {isSubmitting ? 'Submitting...' : 'Verify Your Account'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYC;

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const KYC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    country: '',
    docType: 'passport'
  });
  const [loading, setLoading] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.dob || !formData.country) {
      alert('Please fill out all fields');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('https://goalign-mrkd.onrender.com/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          full_name: formData.fullName,
          dob: formData.dob,
          country: formData.country,
          document_type: formData.docType
        })
      });

      if (res.ok) {
        setStep(3); // Success step
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit KYC');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <div className="container mx-auto max-w-3xl px-4 py-8 flex-1 flex flex-col">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-primary mb-2">Identity Verification</h1>
          <p className="text-secondary">Complete KYC to unlock higher withdrawal limits and VIP tiers.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8 flex-1">
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-blue-50 -z-10 -translate-y-1/2"></div>
            <div className={`absolute left-0 top-1/2 h-1 bg-accent -z-10 -translate-y-1/2 transition-all duration-500`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
            
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-accent text-primary' : 'bg-blue-50 text-secondary'}`}>1</div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-accent text-primary' : 'bg-blue-50 text-secondary'}`}>2</div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-accent text-primary' : 'bg-blue-50 text-secondary'}`}>3</div>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-primary mb-4">Personal Information</h2>
              <div>
                <label className="block text-sm font-bold text-secondary mb-1">Full Legal Name</label>
                <input 
                  type="text" 
                  className="w-full bg-blue-50/30 border border-blue-100 rounded-lg p-3 text-primary focus:border-accent outline-none"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-secondary mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  className="w-full bg-blue-50/30 border border-blue-100 rounded-lg p-3 text-primary focus:border-accent outline-none"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-secondary mb-1">Country of Residence</label>
                <select 
                  className="w-full bg-blue-50/30 border border-blue-100 rounded-lg p-3 text-primary focus:border-accent outline-none"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                >
                  <option value="">Select a country</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="SG">Singapore</option>
                </select>
              </div>
              <button 
                onClick={() => {
                  if (formData.fullName && formData.dob && formData.country) setStep(2);
                  else alert('Please fill out all fields');
                }}
                className="w-full bg-primary text-white font-bold py-4 rounded-lg mt-8 hover:bg-secondary transition"
              >
                Next Step
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-primary mb-4">Document Upload</h2>
              
              <div>
                <label className="block text-sm font-bold text-secondary mb-3">Document Type</label>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => setFormData({...formData, docType: 'passport'})}
                    className={`flex-1 py-3 rounded-lg font-bold border transition ${formData.docType === 'passport' ? 'border-accent bg-accent/10 text-primary' : 'border-blue-100 text-secondary hover:bg-blue-50/30'}`}
                  >
                    Passport
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, docType: 'id_card'})}
                    className={`flex-1 py-3 rounded-lg font-bold border transition ${formData.docType === 'id_card' ? 'border-accent bg-accent/10 text-primary' : 'border-blue-100 text-secondary hover:bg-blue-50/30'}`}
                  >
                    Identity Card
                  </button>
                </div>
              </div>

              <input 
                type="file"
                accept="image/jpeg, image/png, application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFileUploaded(true);
                  }
                }}
              />
              <div 
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${fileUploaded ? 'border-green-400 bg-green-50' : 'border-blue-200 hover:border-accent hover:bg-blue-50/30'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {fileUploaded ? (
                  <div>
                    <div className="text-green-500 text-4xl mb-2">✓</div>
                    <p className="font-bold text-primary">Document Uploaded Successfully</p>
                    <p className="text-sm text-secondary">Click to replace</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-blue-200 text-4xl mb-4">📄</div>
                    <p className="font-bold text-primary mb-1">Click to Upload Document</p>
                    <p className="text-sm text-secondary">JPEG, PNG, or PDF up to 5MB</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-4 mt-8">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 bg-blue-50 text-secondary font-bold py-4 rounded-lg hover:bg-blue-100 transition"
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={!fileUploaded || loading}
                  className="flex-1 bg-primary text-white font-bold py-4 rounded-lg hover:bg-secondary transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Verification'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-green-500 text-5xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Verification Complete!</h2>
              <p className="text-secondary mb-8">Your identity has been successfully verified. You now have full access to all Goalign features.</p>
              <button 
                onClick={() => navigate('/profile')}
                className="bg-accent text-primary px-8 py-3 rounded-lg font-bold hover:bg-opacity-90 transition"
              >
                Return to Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYC;

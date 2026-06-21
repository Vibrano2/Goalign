import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState('unverified');

  useEffect(() => {
    if (user) {
      fetch(`https://goalign-mrkd.onrender.com/api/kyc/status/${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.status) setKycStatus(data.status);
        })
        .catch(err => console.error('Error fetching KYC status:', err));
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="bg-[#03045E] pt-12 pb-24 px-4 relative">
        <div className="container mx-auto max-w-3xl relative z-10 text-center text-white">
          <div className="w-24 h-24 bg-accent/20 border-2 border-accent rounded-full flex items-center justify-center text-4xl font-bold text-accent mx-auto mb-4">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <h1 className="text-3xl font-extrabold mb-1">{user?.displayName || 'Anonymous User'}</h1>
          <p className="text-blue-200 text-sm">{user?.email}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${kycStatus === 'verified' ? 'bg-green-100 text-green-500' : 'bg-orange-100 text-orange-500'}`}>
              {kycStatus === 'verified' ? '✓' : '!'}
            </div>
            <div>
              <h3 className="font-bold text-primary">Identity Verification (KYC)</h3>
              <p className="text-sm text-secondary">
                Status: <span className={`font-bold uppercase ${kycStatus === 'verified' ? 'text-green-500' : 'text-orange-500'}`}>{kycStatus}</span>
              </p>
            </div>
          </div>
          {kycStatus !== 'verified' && (
            <button 
              onClick={() => navigate('/kyc')}
              className="bg-[#00B4D8] text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-opacity-90 transition"
            >
              Verify Now
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-blue-50">
            <h2 className="font-bold text-lg text-primary">Account Security</h2>
          </div>
          <div className="divide-y divide-blue-50">
            <div onClick={() => alert("Change Password flow will be available in the next update.")} className="p-4 flex justify-between items-center hover:bg-blue-50/30 cursor-pointer transition">
              <div>
                <div className="font-bold text-primary text-sm">Change Password</div>
                <div className="text-xs text-secondary">Update your login password</div>
              </div>
              <div className="text-gray-400">&gt;</div>
            </div>
            <div onClick={() => alert("2FA setup with Google Authenticator coming soon!")} className="p-4 flex justify-between items-center hover:bg-blue-50/30 cursor-pointer transition">
              <div>
                <div className="font-bold text-primary text-sm">Two-Factor Authentication (2FA)</div>
                <div className="text-xs text-secondary">Not enabled</div>
              </div>
              <div className="text-accent text-sm font-bold">Enable</div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-500 font-bold py-4 rounded-xl border border-red-100 hover:bg-red-100 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Profile;

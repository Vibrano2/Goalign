import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { Crown, Diamond, CheckCircle, ShieldAlert } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const VIP = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Activate VIP');
  const [vipStatus, setVipStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [safePassword, setSafePassword] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchVipStatus();
  }, [user]);

  const fetchVipStatus = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/vip/status/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setVipStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch VIP status', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedTier) {
      setError('Please select a VIP package to upgrade.');
      return;
    }
    if (!safePassword) {
      setError('Please enter your safe password.');
      return;
    }
    
    setError('');
    setSuccess('');
    setUpgrading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/vip/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          targetLevel: selectedTier,
          safePassword
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to upgrade');
      
      setSuccess(data.message);
      setSafePassword('');
      fetchVipStatus(); // Refresh status
    } catch (err) {
      setError(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">Loading VIP...</div>;

  const packages = [
    { level: 1, daily: 10, monthly: 30, valid: 60, price: 50, bg: 'bg-gradient-to-r from-[#f0f2f5] to-[#e4e7eb]', text: 'text-gray-700', icon: <Crown className="w-8 h-8 text-gray-400" /> },
    { level: 2, daily: 100, monthly: 3000, valid: 60, price: 500, bg: 'bg-gradient-to-r from-[#e6e6fa] to-[#d8bfd8]', text: 'text-purple-800', icon: <Crown className="w-8 h-8 text-purple-400" /> },
    { level: 3, daily: 30000, monthly: 450000, valid: 90, price: 3000, bg: 'bg-gradient-to-r from-[#ffe4e1] to-[#ffb6c1]', text: 'text-rose-800', icon: <Crown className="w-8 h-8 text-rose-400" /> },
    { level: 4, daily: 80000, monthly: 950000, valid: 90, price: 5000, bg: 'bg-gradient-to-r from-[#e0ffff] to-[#afeeee]', text: 'text-cyan-800', icon: <Crown className="w-8 h-8 text-cyan-500" /> },
    { level: 5, daily: 150000, monthly: 2500000, valid: 365, price: 10000, bg: 'bg-gradient-to-r from-[#fffacd] to-[#ffd700]', text: 'text-yellow-800', icon: <Crown className="w-8 h-8 text-yellow-600" /> },
    { level: 6, daily: 300000, monthly: 4500000, valid: 365, price: 50000, bg: 'bg-gradient-to-r from-[#e6e6fa] to-[#dda0dd]', text: 'text-fuchsia-800', icon: <Crown className="w-8 h-8 text-fuchsia-400" /> },
    { level: 7, daily: 500000, monthly: 8000000, valid: 365, price: 100000, bg: 'bg-gradient-to-r from-[#2c3e50] to-[#34495e]', text: 'text-white', icon: <Diamond className="w-8 h-8 text-gray-300" /> },
    { level: 8, daily: 1000000, monthly: 20000000, valid: 365, price: 300000, bg: 'bg-gradient-to-r from-[#000000] to-[#1a1a1a]', text: 'text-[#ffd700]', icon: <Diamond className="w-8 h-8 text-[#ffd700]" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6fa] pb-24 font-sans">
      {/* Header */}
      <div className="bg-[#2185ff] pt-8 pb-16 px-4 rounded-b-3xl text-white">
        <div className="flex justify-center space-x-8 text-sm font-bold mb-6">
          <button 
            onClick={() => setActiveTab('Activate VIP')}
            className={`pb-1 transition-all ${activeTab === 'Activate VIP' ? 'border-b-2 border-white text-white' : 'text-white/70 hover:text-white'}`}
          >
            Activate VIP
          </button>
          <button 
            onClick={() => setActiveTab('Activation record')}
            className={`pb-1 transition-all ${activeTab === 'Activation record' ? 'border-b-2 border-white text-white' : 'text-white/70 hover:text-white'}`}
          >
            Activation record
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-white/40">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg">{user?.displayName || 'User'}</span>
              <span className="bg-orange-500 text-xs px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                <Crown className="w-3 h-3" />
                <span>VIP {vipStatus?.vipLevel || 0}</span>
              </span>
            </div>
            <div className="text-xs text-white/80 mt-1">
              Referral code: <span className="font-mono">M6224308</span>
            </div>
            <div className="text-xs text-white/80">
              Margin release time: 2028-02-02 17:50
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'Activate VIP' && (
        <>
          {/* Limits Card */}
          <div className="px-4 -mt-10 relative z-10 mb-6">
            <div className="bg-white rounded-xl shadow-md p-4 flex justify-between items-center text-center">
              <div className="flex-1 border-r border-gray-100">
                <div className="font-extrabold text-xl text-gray-800">{vipStatus?.limits?.daily || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Daily transfer limit</div>
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-xl text-gray-800">{vipStatus?.limits?.monthly || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Monthly transfer limit</div>
              </div>
            </div>
          </div>

          {/* VIP Packages */}
          <div className="px-4">
            <div className="flex items-center space-x-1 mb-4">
              <div className="w-1 h-4 bg-[#2185ff] rounded-full"></div>
              <h3 className="font-bold text-gray-700 text-sm">VIP package</h3>
            </div>

            <div className="space-y-3">
              {packages.map((pkg) => (
                <div 
                  key={pkg.level} 
                  onClick={() => setSelectedTier(pkg.level)}
                  className={`${pkg.bg} rounded-2xl p-4 relative overflow-hidden shadow-sm cursor-pointer border-2 transition-all ${selectedTier === pkg.level ? 'border-[#2185ff] shadow-md scale-[1.02]' : 'border-transparent'}`}
                >
                  {/* Card Content */}
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <div className="flex items-end space-x-2 mb-2">
                        <span className={`text-3xl font-black italic tracking-tighter ${pkg.text}`}>V{pkg.level}</span>
                        <span className="text-[10px] text-orange-500 font-bold mb-1">View details</span>
                      </div>
                      <div className={`text-[11px] leading-tight ${pkg.level >= 7 ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div>Daily transfer limit: {pkg.daily}</div>
                        <div>Monthly transfer limit: {pkg.monthly}</div>
                        <div>valid date: {pkg.valid}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between h-full space-y-4">
                      {/* Icon Box */}
                      <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner border border-white/40">
                        {pkg.icon}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-orange-500 font-bold text-sm">${pkg.price}.00</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedTier === pkg.level ? 'bg-[#2185ff] text-white' : 'border border-gray-400/50'}`}>
                          {selectedTier === pkg.level && <CheckCircle className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Text */}
            <div className="mt-6 text-[10px] text-orange-500 leading-tight">
              Except for VIP1, the USDT paid by other VIP members is a deposit. When your membership expires or you no longer need to use membership functions, you can send an email to customer service to apply for a refund of your deposit. Subscribers are not charged USDT.
            </div>

            {/* Checkout Section */}
            <div className="mt-6 space-y-3">
              {error && <div className="text-xs text-red-500 flex items-center"><ShieldAlert className="w-3 h-3 mr-1"/>{error}</div>}
              {success && <div className="text-xs text-green-500 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/>{success}</div>}
              
              <div className="bg-gray-100 rounded-lg py-3 px-4 flex items-center justify-between text-sm">
                <span className="text-gray-600">Balance ( <span className="font-bold text-gray-800">{vipStatus?.balance?.toFixed(2) || '0.00'}</span> )</span>
                <div className="w-5 h-5 rounded-full bg-[#2185ff] text-white flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>

              <input 
                type="password" 
                placeholder="Enter safe password" 
                className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-[#2185ff]"
                value={safePassword}
                onChange={(e) => setSafePassword(e.target.value)}
              />

              <button 
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full bg-[#2185ff] text-white rounded-full py-3.5 font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition disabled:opacity-50"
              >
                {upgrading ? 'Processing...' : 'Upgrade now'}
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'Activation record' && (
        <div className="px-4 -mt-10 relative z-10 mb-6">
          <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="text-4xl mb-4 opacity-50">📋</div>
            <h3 className="font-bold text-gray-700">No Activation Records</h3>
            <p className="text-xs text-gray-400 mt-2">You haven't activated any VIP subscriptions yet.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VIP;

import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Funding modal state
  const [fundModal, setFundModal] = useState({ open: false, userId: null, asset: 'USDT', amount: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const res = await fetch('https://goalign-mrkd.onrender.com/api/admin/users', {
          headers: { 'x-user-uid': user.uid }
        });
        
        if (res.status === 403 || res.status === 401) {
          navigate('/');
          return;
        }

        const data = await res.json();
        if (data.users) {
          setUsers(data.users);
        } else {
          setError('Failed to load users');
        }
      } catch (err) {
        setError('Network error checking admin status');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, navigate]);

  const handleUpdateVip = async (internalId, newLevel) => {
    try {
      const res = await fetch(`https://goalign-mrkd.onrender.com/api/admin/user/${internalId}/vip`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': user.uid 
        },
        body: JSON.stringify({ level: parseInt(newLevel) })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === internalId ? { ...u, vip_level: parseInt(newLevel) } : u));
      } else {
        alert('Failed to update VIP');
      }
    } catch (err) {
      alert('Error updating VIP');
    }
  };

  const handleFundUser = async () => {
    try {
      const res = await fetch(`https://goalign-mrkd.onrender.com/api/admin/user/${fundModal.userId}/fund`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': user.uid 
        },
        body: JSON.stringify({ asset: fundModal.asset, amount: fundModal.amount })
      });
      
      if (res.ok) {
        alert('Funds successfully added!');
        setFundModal({ open: false, userId: null, asset: 'USDT', amount: '' });
        // Refresh users to get new balances
        window.location.reload();
      } else {
        alert('Failed to add funds');
      }
    } catch (err) {
      alert('Network error adding funds');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#03045E] flex items-center justify-center text-white">Authenticating Admin...</div>;
  if (error) return <div className="min-h-screen bg-[#03045E] flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-background text-primary">
      <div className="bg-[#03045E] text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Platform Admin Dashboard</h1>
          <p className="text-blue-200">Manage users, adjust VIP tiers, and oversee platform liquidity.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="p-4 border-b border-blue-50 bg-blue-50/30 flex justify-between items-center">
            <h2 className="font-bold text-lg">Registered Users ({users.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider bg-gray-50/50">
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Email / UID</th>
                  <th className="px-6 py-4 font-semibold">Spot Balances</th>
                  <th className="px-6 py-4 font-semibold">VIP Level</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs mr-3">
                          {u.display_name ? u.display_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="font-bold text-primary">{u.display_name || 'Anonymous'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{u.email}</div>
                      <div className="text-xs text-gray-400 font-mono">{u.firebase_uid.substring(0, 12)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {u.balances ? u.balances.map(b => (
                        <div key={b.asset}>{parseFloat(b.available).toFixed(2)} {b.asset}</div>
                      )) : 'No funds'}
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-accent focus:border-accent block w-full p-2"
                        value={u.vip_level}
                        onChange={(e) => handleUpdateVip(u.id, e.target.value)}
                      >
                        {[0,1,2,3,4,5].map(lvl => (
                          <option key={lvl} value={lvl}>VIP {lvl}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setFundModal({ open: true, userId: u.id, asset: 'USDT', amount: '' })}
                        className="bg-[#00B4D8] text-white px-3 py-1.5 rounded-md text-sm font-bold shadow-sm hover:bg-opacity-90 transition"
                      >
                        + Fund Account
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fund User Modal */}
      {fundModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Manual Deposit</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={fundModal.asset}
                  onChange={e => setFundModal({...fundModal, asset: e.target.value})}
                >
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-md p-2 font-mono"
                  placeholder="1000"
                  value={fundModal.amount}
                  onChange={e => setFundModal({...fundModal, amount: e.target.value})}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setFundModal({ ...fundModal, open: false })}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleFundUser}
                className="flex-1 px-4 py-2 bg-[#00B4D8] text-white rounded-md font-bold hover:bg-opacity-90 shadow-lg"
              >
                Execute Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

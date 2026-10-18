import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

const Admin = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [adminTab, setAdminTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingDeposits, setSyncingDeposits] = useState(false);
  const [error, setError] = useState('');
  
  // Funding modal state
  const [fundModal, setFundModal] = useState({ open: false, userId: null, asset: 'USDT', amount: '' });
  
  // KYC review modal state
  const [kycModal, setKycModal] = useState({ open: false, user: null });

  const fetchWithdrawals = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/withdrawals`, {
        headers: { 'x-user-uid': user.uid }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.withdrawals) setWithdrawals(data.withdrawals);
      }
    } catch (err) {
      console.error('Failed to fetch admin withdrawals', err);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
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
    fetchWithdrawals();
  }, [user, navigate]);

  const handleApproveWithdrawal = async (uuid) => {
    const txid = prompt('Enter provider transaction hash (optional, leave blank to auto-generate/dispatch):');
    if (txid === null) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/withdrawals/${uuid}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid
        },
        body: JSON.stringify({ providerTxid: txid.trim() || undefined, dispatchBybit: false })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Withdrawal approved successfully!');
        fetchWithdrawals();
      } else {
        alert(`Failed to approve: ${data.error}`);
      }
    } catch (err) {
      alert('Network error approving withdrawal');
    }
  };

  const handleRejectWithdrawal = async (uuid) => {
    const reason = prompt('Enter rejection reason (funds will be refunded to user):', 'Compliance policy check failed');
    if (reason === null) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/withdrawals/${uuid}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Withdrawal rejected and funds refunded to user spot balance!');
        fetchWithdrawals();
      } else {
        alert(`Failed to reject: ${data.error}`);
      }
    } catch (err) {
      alert('Network error rejecting withdrawal');
    }
  };

  const handleSyncDeposits = async () => {
    setSyncingDeposits(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/deposits/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid
        },
        body: JSON.stringify({ coin: 'USDT' })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Deposit sync completed! ${data.result?.synced || 0} newly credited deposits.`);
      } else {
        alert(`Deposit sync failed: ${data.error}`);
      }
    } catch (err) {
      alert('Network error syncing deposits');
    }
    setSyncingDeposits(false);
  };

  const handleUpdateVip = async (internalId, newLevel) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${internalId}/vip`, {
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

  const handleUpdateKyc = async (internalId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${internalId}/kyc`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': user.uid 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === internalId ? { ...u, kyc_status: status } : u));
      } else {
        alert('Failed to update KYC status');
      }
    } catch (err) {
      alert('Error updating KYC status');
    } finally {
      if (kycModal.open) {
        setKycModal({ open: false, user: null });
      }
    }
  };

  const handleFundUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${fundModal.userId}/fund`, {
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
          <p className="text-blue-200">Manage users, adjust VIP tiers, settle withdrawals, and oversee platform liquidity.</p>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setAdminTab('users')}
              className={`px-5 py-2.5 rounded-lg font-bold text-sm transition ${
                adminTab === 'users' ? 'bg-white text-primary shadow' : 'bg-blue-800/60 text-blue-100 hover:bg-blue-800'
              }`}
            >
              Registered Users ({users.length})
            </button>
            <button
              onClick={() => setAdminTab('withdrawals')}
              className={`px-5 py-2.5 rounded-lg font-bold text-sm transition flex items-center space-x-2 ${
                adminTab === 'withdrawals' ? 'bg-white text-primary shadow' : 'bg-blue-800/60 text-blue-100 hover:bg-blue-800'
              }`}
            >
              <span>Withdrawals & Operations ({withdrawals.length})</span>
              {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                <span className="bg-amber-400 text-blue-950 px-2 py-0.5 rounded-full text-xs font-black">
                  {withdrawals.filter(w => w.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {adminTab === 'users' ? (
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
                    <th className="px-6 py-4 font-semibold text-center">KYC Status</th>
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
                      <td className="px-6 py-4 text-center">
                        {u.kyc_status === 'pending' ? (
                          <div className="flex flex-col items-center space-y-2">
                            <span className="text-orange-500 font-bold text-xs uppercase bg-orange-100 px-2 py-1 rounded">Pending</span>
                            <button 
                              onClick={() => setKycModal({ open: true, user: u })} 
                              className="bg-[#00B4D8] text-white px-3 py-1 rounded font-bold text-xs shadow hover:bg-opacity-90"
                            >
                              Review App
                            </button>
                          </div>
                        ) : (
                          <span className={`font-bold text-xs uppercase px-2 py-1 rounded ${
                            u.kyc_status === 'verified' ? 'text-green-600 bg-green-100' : 
                            u.kyc_status === 'rejected' ? 'text-red-600 bg-red-100' : 'text-gray-600 bg-gray-100'
                          }`}>
                            {u.kyc_status || 'unverified'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-y-2">
                        <button 
                          onClick={() => setFundModal({ open: true, userId: u.id, asset: 'USDT', amount: '' })}
                          className="bg-[#00B4D8] text-white px-3 py-1.5 rounded-md text-sm font-bold shadow-sm hover:bg-opacity-90 transition w-full"
                        >
                          + Fund
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Withdrawals & Operations Tab */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-blue-100">
              <div>
                <h2 className="font-bold text-lg text-primary">Withdrawal Requests & Settlements</h2>
                <p className="text-xs text-secondary">Review pending withdrawals, approve on-chain broadcasts, or reject and refund.</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSyncDeposits}
                  disabled={syncingDeposits}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow transition disabled:opacity-50"
                >
                  {syncingDeposits ? 'Syncing...' : '↻ Sync Bybit Deposits'}
                </button>
                <button
                  onClick={fetchWithdrawals}
                  className="px-4 py-2.5 bg-blue-50 text-accent hover:bg-blue-100 font-bold rounded-lg text-sm transition"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
              {withdrawals.length === 0 ? (
                <div className="p-12 text-center text-secondary">No withdrawal requests found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase tracking-wider bg-gray-50/50">
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Asset / Amount</th>
                        <th className="px-4 py-3">Network</th>
                        <th className="px-4 py-3">Destination Address</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3">Provider TXID</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50 text-sm">
                      {withdrawals.map((w) => (
                        <tr key={w.withdrawal_uuid} className="hover:bg-blue-50/30">
                          <td className="px-4 py-3 text-xs text-secondary whitespace-nowrap">
                            {new Date(w.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-primary">{w.display_name || 'User'}</div>
                            <div className="text-xs text-secondary">{w.email}</div>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-primary whitespace-nowrap">
                            {parseFloat(w.amount).toFixed(4)} {w.asset}
                          </td>
                          <td className="px-4 py-3 text-xs">{w.network}</td>
                          <td className="px-4 py-3 font-mono text-xs max-w-[140px] truncate" title={w.address}>
                            {w.address}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              w.status === 'completed' ? 'bg-green-100 text-green-700' :
                              w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {w.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-secondary max-w-[140px] truncate" title={w.provider_txid || 'None'}>
                            {w.provider_txid || '—'}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            {w.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleApproveWithdrawal(w.withdrawal_uuid)}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition shadow-sm"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectWithdrawal(w.withdrawal_uuid)}
                                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-bold transition"
                                >
                                  Reject & Refund
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Settled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* KYC Review Modal */}
      {kycModal.open && kycModal.user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
              <h3 className="text-2xl font-bold text-primary">Review KYC Application</h3>
              <button onClick={() => setKycModal({ open: false, user: null })} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!kycModal.user.kyc_application ? (
                <div className="text-orange-500 mb-4 bg-orange-50 p-4 rounded-lg">
                  This user has a pending status but no application data was found (legacy request).
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 font-bold mb-1">Full Name</p>
                    <p className="font-medium text-lg">{kycModal.user.kyc_application.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-bold mb-1">Date of Birth</p>
                    <p className="font-medium text-lg">{new Date(kycModal.user.kyc_application.date_of_birth).toLocaleDateString()}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 font-bold mb-1">Residential Address</p>
                    <p className="font-medium bg-gray-50 p-3 rounded-lg">{kycModal.user.kyc_application.address}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 font-bold mb-2">
                      ID Document <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs ml-2 uppercase">{kycModal.user.kyc_application.id_type || 'ID'}</span>
                    </p>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-2 flex justify-center">
                      <img 
                        src={kycModal.user.kyc_application.id_document_base64} 
                        alt="ID Document" 
                        className="max-h-[300px] object-contain rounded"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex space-x-4 sticky bottom-0 bg-white rounded-b-xl">
              <button 
                onClick={() => handleUpdateKyc(kycModal.user.id, 'rejected')}
                className="flex-1 px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition"
              >
                Reject Application
              </button>
              <button 
                onClick={() => handleUpdateKyc(kycModal.user.id, 'verified')}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition shadow-lg shadow-green-500/30"
              >
                Approve & Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

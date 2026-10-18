import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { API_BASE_URL } from '../utils/api';

export default function CopyTrading() {
  const { user } = useAuthStore();
  const [masters, setMasters] = useState([]);
  const [allocations, setAllocations] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [mastersRes, allocRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/copytrade/masters`),
        user ? fetch(`${API_BASE_URL}/api/copytrade/allocations/${user.uid}`) : Promise.resolve(null)
      ]);

      const mastersData = await mastersRes.json();
      setMasters(mastersData.masters || []);

      if (allocRes) {
        const allocData = await allocRes.json();
        setAllocations(allocData.allocations || []);
      }
    } catch (err) {
      console.error('Failed to fetch copytrade data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll for simulated PNL updates
    return () => clearInterval(interval);
  }, [user]);

  const handleCopy = async () => {
    if (!user || !selectedMaster || !amount) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/copytrade/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.accessToken}` },
        body: JSON.stringify({
          user_id: user.uid,
          master_name: selectedMaster.name,
          amount: parseFloat(amount)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      setSelectedMaster(null);
      setAmount('');
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopCopy = async (allocationId) => {
    if (!user || !window.confirm('Are you sure you want to stop copying? Your current balance will be returned to your Spot wallet.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/copytrade/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.accessToken}` },
        body: JSON.stringify({
          user_id: user.uid,
          allocation_id: allocationId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-primary font-sans p-4 pb-20">
      <div className="container mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Copy Trading</h1>
            <p className="text-secondary max-w-lg">Discover top-performing Master Traders. Allocate your funds to automatically mirror their strategies and share in their success.</p>
          </div>
          <div className="mt-6 md:mt-0">
            <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md">
              Become a Master Trader
            </button>
          </div>
        </div>

        {/* User's Active Allocations */}
        {user && allocations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
            <div className="p-4 border-b border-blue-50 bg-blue-50/30">
              <h3 className="font-bold text-primary">My Copy Portfolio</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allocations.map(alloc => (
                <div key={alloc.id} className="border border-blue-100 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-50 text-green-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl">ACTIVE</div>
                  <h4 className="font-bold text-lg text-primary mb-4">{alloc.master_name}</h4>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Principal</span>
                      <span className="font-medium">${parseFloat(alloc.allocated_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Current Value</span>
                      <span className="font-bold text-primary">${alloc.current_value}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Simulated PNL</span>
                      <span className={`font-bold ${parseFloat(alloc.pnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {parseFloat(alloc.pnl) >= 0 ? '+' : ''}{alloc.pnl} ({alloc.pnl_percent}%)
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleStopCopy(alloc.id)}
                    className="w-full border border-red-200 text-red-500 font-bold py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Stop Copying
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Master Traders List */}
        <div>
          <h2 className="text-xl font-bold text-primary mb-4">Discover Top Traders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {isLoading && masters.length === 0 ? (
              <div className="col-span-full py-12 text-center text-secondary">Loading Master Traders...</div>
            ) : (
              masters.map(master => (
                <div key={master.id} className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                        {master.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-primary leading-tight">{master.name}</h3>
                        <div className="text-xs text-secondary">{master.copiers.toLocaleString()} Copiers</div>
                      </div>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded ${
                      master.risk === 'Low' ? 'bg-green-100 text-green-700' : 
                      master.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {master.risk} Risk
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-3 rounded-xl">
                    <div>
                      <div className="text-xs text-secondary mb-1">ROI (30d)</div>
                      <div className="font-bold text-green-500 text-lg">+{master.roi}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-secondary mb-1">Win Rate</div>
                      <div className="font-bold text-primary text-lg">{master.winRate}%</div>
                    </div>
                    <div className="col-span-2 border-t border-gray-200 pt-2 mt-1">
                      <div className="text-xs text-secondary mb-1">Assets Under Management</div>
                      <div className="font-medium text-primary">${master.aum.toLocaleString()}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!user) return alert('Please log in first');
                      setSelectedMaster(master);
                    }}
                    className="mt-auto w-full bg-accent text-primary font-bold py-3 rounded-xl hover:bg-opacity-90 transition-colors shadow-sm"
                  >
                    Copy
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Allocation Modal */}
      {selectedMaster && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-primary mb-2">Copy {selectedMaster.name}</h2>
            <p className="text-sm text-secondary mb-6">Enter the amount of USDT from your Spot Wallet you wish to allocate.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-secondary uppercase mb-1 block">Amount (USDT)</label>
                <input 
                  type="number" 
                  min="10"
                  placeholder="Min 10 USDT"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-lg font-medium"
                />
              </div>
              <div className="bg-blue-50/50 p-4 rounded-xl text-xs text-secondary">
                By copying this trader, you agree to mirror their trading signals automatically. You can stop copying at any time.
              </div>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => setSelectedMaster(null)}
                className="flex-1 py-3 bg-gray-100 text-secondary font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCopy}
                disabled={isProcessing || !amount}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 transition-colors shadow-md disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

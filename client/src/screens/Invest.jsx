import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { ChevronRight } from 'lucide-react';

const PLEDGE_PRODUCTS = [
  { asset: 'USDT', apy: 0.18, min: 10 },
  { asset: 'BTC', apy: 0.08, min: 0.001 },
  { asset: 'ETH', apy: 0.06, min: 0.01 }
];

const Invest = () => {
  const { user } = useAuthStore();
  const [activeMainTab, setActiveMainTab] = useState('Quantify');
  const [quantifyFilter, setQuantifyFilter] = useState('All');
  
  const [quantifyPlans, setQuantifyPlans] = useState([]);
  const [balances, setBalances] = useState({});
  const [pledges, setPledges] = useState([]);
  const [pledgeAmounts, setPledgeAmounts] = useState({});
  const [quantifyAmounts, setQuantifyAmounts] = useState({});
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    if (!user) return;
    try {
      const balRes = await fetch(`https://goalign-mrkd.onrender.com/api/wallet/balances/${user.uid}`);
      const balData = await balRes.json();
      if (balRes.ok && balData.balances) {
        const spots = {};
        balData.balances.forEach(b => {
          if (b.account_type === 'spot') {
            spots[b.asset] = parseFloat(b.available);
          }
        });
        setBalances(spots);
      }

      const pldRes = await fetch(`https://goalign-mrkd.onrender.com/api/invest/pledges/${user.uid}`);
      const pldData = await pldRes.json();
      if (pldRes.ok && pldData.pledges) {
        setPledges(pldData.pledges);
      }

      const quantRes = await fetch(`https://goalign-mrkd.onrender.com/api/invest/quantify-plans`);
      const quantData = await quantRes.json();
      if (quantRes.ok && quantData.plans) {
        setQuantifyPlans(quantData.plans);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handlePledge = async (asset) => {
    if (!user) {
      setMessage('Please login first');
      return;
    }
    const amount = pledgeAmounts[asset];
    if (!amount || parseFloat(amount) <= 0) {
      setMessage(`Enter a valid amount for ${asset}`);
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('https://goalign-mrkd.onrender.com/api/invest/pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, asset, amount: parseFloat(amount) })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Successfully pledged ${amount} ${asset}`);
        setPledgeAmounts({ ...pledgeAmounts, [asset]: '' });
        fetchData();
      } else {
        setMessage(data.error || 'Failed to pledge');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRedeem = async (stakeId) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('https://goalign-mrkd.onrender.com/api/invest/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, stake_id: stakeId })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Redeemed! Earned ${data.earned}`);
        fetchData();
      } else {
        setMessage(data.error || 'Failed to redeem');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleBuyQuantify = async (plan) => {
    if (!user) {
      setMessage('Please login first');
      return;
    }
    const amount = quantifyAmounts[plan.id];
    if (!amount || parseFloat(amount) < plan.min || parseFloat(amount) > plan.max) {
      setMessage(`Amount must be between ${plan.min} and ${plan.max} USDT`);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('https://goalign-mrkd.onrender.com/api/invest/quantify/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid, planId: plan.id, amount: parseFloat(amount) })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Successfully purchased ${plan.title}`);
        setQuantifyAmounts({ ...quantifyAmounts, [plan.id]: '' });
        fetchData();
      } else {
        setMessage(data.error || 'Failed to buy plan');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const filteredPlans = quantifyFilter === 'All' 
    ? quantifyPlans 
    : quantifyPlans.filter(p => `${p.days} days` === quantifyFilter || (p.days === 1 && quantifyFilter === '1 days'));

  const durationFilters = ['All', '1 days', '2 days', '30 days', '90 days', '180 days', '360 days'];

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-gray-800 font-sans pb-24">
      {/* Top Navigation */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <h1 className="text-xl font-bold flex-1 text-center">Invest</h1>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-white px-4 pt-2 shadow-sm mb-2">
        <button
          onClick={() => setActiveMainTab('Quantify')}
          className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-colors ${
            activeMainTab === 'Quantify' ? 'border-[#2185ff] text-[#2185ff]' : 'border-transparent text-gray-500'
          }`}
        >
          Quantify
        </button>
        <button
          onClick={() => setActiveMainTab('Pledge')}
          className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-colors ${
            activeMainTab === 'Pledge' ? 'border-[#2185ff] text-[#2185ff]' : 'border-transparent text-gray-500'
          }`}
        >
          Pledge
        </button>
      </div>

      {/* Notification Toast */}
      {message && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap shadow-xl backdrop-blur-sm transition-all">
          {message}
        </div>
      )}

      {activeMainTab === 'Quantify' && (
        <>
          {/* Scrollable Duration Filter */}
          <div className="bg-white py-2 px-2 shadow-sm mb-4 overflow-x-auto whitespace-nowrap hide-scrollbar flex space-x-2">
            {durationFilters.map(filter => (
              <button
                key={filter}
                onClick={() => setQuantifyFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  quantifyFilter === filter 
                    ? 'bg-[#2185ff]/10 text-[#2185ff] border border-[#2185ff]/30' 
                    : 'bg-gray-100 text-gray-600 border border-transparent'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Quantify Plans List */}
          <div className="px-4 space-y-4">
            {filteredPlans.map(plan => (
              <div key={plan.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-50 text-[#2185ff] text-[10px] font-bold px-3 py-1 rounded-bl-xl border-b border-l border-blue-100">
                  {plan.days} Days
                </div>
                
                <h3 className="font-bold text-[15px] mb-3 text-gray-800 pr-12 leading-tight">{plan.title}</h3>
                
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="text-[11px] text-gray-500 mb-0.5">Daily Interest</div>
                    <div className="text-[#ff6b00] font-black text-xl">{plan.dailyInterest.toFixed(2)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-gray-500 mb-0.5">Investment limits</div>
                    <div className="text-gray-700 text-xs font-semibold">Min {plan.min} | Max {plan.max}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{plan.soldOut}% Sold out</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#2185ff] h-1.5 rounded-full" style={{ width: `${plan.soldOut}%` }}></div>
                  </div>
                </div>

                <div className="flex space-x-3 items-center border-t border-gray-50 pt-4 mt-2">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      placeholder={`Enter amount (USDT)`}
                      value={quantifyAmounts[plan.id] || ''}
                      onChange={(e) => setQuantifyAmounts({...quantifyAmounts, [plan.id]: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2185ff] focus:bg-white transition-colors"
                    />
                  </div>
                  <button 
                    onClick={() => handleBuyQuantify(plan)}
                    disabled={loading}
                    className="bg-[#2185ff] text-white px-8 py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))}
            {filteredPlans.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm">
                No plans found for this duration.
              </div>
            )}
          </div>
        </>
      )}

      {activeMainTab === 'Pledge' && (
        <div className="px-4 space-y-6 mt-4">
          {/* Pledge Products */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold mb-4 flex items-center">
              <span className="w-1 h-4 bg-[#00e676] rounded-full mr-2"></span>
              Available Pledge Products
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {PLEDGE_PRODUCTS.map(prod => (
                <div key={prod.asset} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg text-gray-800">{prod.asset}</span>
                    <span className="text-[#00e676] bg-[#00e676]/10 px-2 py-0.5 rounded text-sm font-bold">{(prod.apy * 100).toFixed(0)}% APY</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-4">
                    Available: <span className="font-bold text-gray-700">{balances[prod.asset] ? balances[prod.asset].toFixed(4) : '0.0000'}</span>
                  </div>
                  <div className="flex space-x-2">
                    <input 
                      type="number" 
                      placeholder={`Min ${prod.min}`}
                      value={pledgeAmounts[prod.asset] || ''}
                      onChange={(e) => setPledgeAmounts({...pledgeAmounts, [prod.asset]: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00e676]"
                    />
                    <button 
                      onClick={() => handlePledge(prod.asset)}
                      disabled={loading}
                      className="bg-[#00e676] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md shadow-green-500/20 hover:bg-green-500 disabled:opacity-50"
                    >
                      Pledge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Active Pledges */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold mb-4 flex items-center">
              <span className="w-1 h-4 bg-[#2185ff] rounded-full mr-2"></span>
              My Active Pledges
            </h2>
            {pledges.length === 0 ? (
              <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl text-sm border border-dashed border-gray-200">
                You have no active pledges.
              </div>
            ) : (
              <div className="space-y-3">
                {pledges.map(p => (
                  <div key={p.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between items-start gap-4">
                    <div className="flex justify-between w-full">
                      <div>
                        <div className="font-bold text-base text-gray-800">{p.asset} <span className="text-xs text-gray-500 font-normal ml-1 bg-white px-2 py-0.5 rounded border border-gray-100">{(parseFloat(p.apy)*100).toFixed(0)}% APY</span></div>
                        <div className="text-xs text-gray-500 mt-1">Principal: <span className="font-bold text-gray-700">{parseFloat(p.amount).toFixed(4)}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Earned Yield</div>
                        <div className="font-mono text-[#00e676] font-bold">+{p.earned}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRedeem(p.id)}
                      disabled={loading}
                      className="w-full bg-white border border-[#2185ff] text-[#2185ff] py-2.5 rounded-lg font-bold text-sm hover:bg-blue-50 transition disabled:opacity-50"
                    >
                      Redeem Early
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Invest;

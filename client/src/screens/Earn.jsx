import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';

const PRODUCTS = [
  { asset: 'USDT', apy: 12.00, tag: 'High Yield', color: 'text-green-400' },
  { asset: 'BTC', apy: 5.00, tag: 'Safe', color: 'text-orange-400' },
  { asset: 'ETH', apy: 4.00, tag: 'Safe', color: 'text-purple-400' }
];

const Earn = () => {
  const { user } = useAuthStore();
  const [balances, setBalances] = useState({});
  const [subscriptions, setSubscriptions] = useState([]);
  const [modal, setModal] = useState({ open: false, product: null, amount: '' });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    try {
      // Fetch Balances
      const resBal = await fetch(`https://goalign-mrkd.onrender.com/api/wallet/balances/${user.uid}`);
      const dataBal = await resBal.json();
      if (resBal.ok && dataBal.balances) {
        const balMap = {};
        dataBal.balances.forEach(b => {
          if (b.account_type === 'earn') balMap[b.asset] = parseFloat(b.available);
        });
        setBalances(balMap);
      }

      // Fetch Subscriptions
      const resSub = await fetch(`https://goalign-mrkd.onrender.com/api/earn/subscriptions/${user.uid}`);
      const dataSub = await resSub.json();
      if (resSub.ok && dataSub.subscriptions) {
        setSubscriptions(dataSub.subscriptions);
      }
    } catch (err) {
      console.error('Failed to fetch earn data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s for live APY calculation
    return () => clearInterval(interval);
  }, [user]);

  const handleSubscribe = async () => {
    if (!modal.amount || parseFloat(modal.amount) <= 0) {
      alert('Enter a valid amount');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('https://goalign-mrkd.onrender.com/api/earn/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          asset: modal.product.asset,
          amount: modal.amount
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert('Subscribed successfully!');
        setModal({ open: false, product: null, amount: '' });
        fetchData();
      } else {
        alert(data.error || 'Failed to subscribe');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (stakeId) => {
    try {
      const res = await fetch('https://goalign-mrkd.onrender.com/api/earn/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, stake_id: stakeId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Redeemed Principal: ${data.principal} + Profit: ${data.earned}!`);
        fetchData();
      } else {
        alert(data.error || 'Failed to redeem');
      }
    } catch (err) {
      alert('Network error during redemption');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-[#03045E] py-12 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Goalign <span className="text-accent">Earn</span></h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-8">
            Lock your idle assets into our institutional yield pools. Accrue daily interest automatically and redeem your principal anytime.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-12">
        {/* Products */}
        <div>
          <h2 className="text-2xl font-bold text-primary mb-6">Available Products (Flexible Term)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRODUCTS.map(prod => (
              <div key={prod.asset} className="bg-white rounded-xl shadow-sm border border-blue-50 p-6 flex flex-col hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-primary">{prod.asset[0]}</div>
                    <div>
                      <h3 className="font-bold text-primary text-lg">{prod.asset}</h3>
                      <span className="text-xs bg-blue-50 text-secondary px-2 py-1 rounded">Flexible</span>
                    </div>
                  </div>
                  <span className="text-xs bg-accent/10 text-accent font-bold px-2 py-1 rounded">{prod.tag}</span>
                </div>
                
                <div className="mb-6 flex-1">
                  <div className={`text-3xl font-extrabold ${prod.color}`}>{prod.apy}%</div>
                  <div className="text-sm text-secondary">Est. APR</div>
                </div>

                <div className="text-sm text-secondary mb-4">
                  Avail: <span className="font-mono text-primary font-bold">{(balances[prod.asset] || 0).toFixed(2)}</span> {prod.asset}
                </div>

                <button 
                  onClick={() => setModal({ open: true, product: prod, amount: '' })}
                  className="w-full py-3 rounded-lg font-bold text-white bg-[#00B4D8] hover:bg-opacity-90 shadow transition"
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* My Stakes */}
        <div>
          <h2 className="text-2xl font-bold text-primary mb-6">My Active Stakes</h2>
          <div className="bg-white rounded-xl shadow-sm border border-blue-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-50/50 text-secondary text-sm">
                    <th className="px-6 py-4 font-bold border-b border-blue-100">Asset</th>
                    <th className="px-6 py-4 font-bold border-b border-blue-100">Principal Locked</th>
                    <th className="px-6 py-4 font-bold border-b border-blue-100">APR</th>
                    <th className="px-6 py-4 font-bold border-b border-blue-100">Live Yield Accrued</th>
                    <th className="px-6 py-4 font-bold border-b border-blue-100 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {subscriptions.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-secondary">No active stakes. Subscribe above to start earning!</td></tr>
                  ) : (
                    subscriptions.map(sub => (
                      <tr key={sub.id} className="hover:bg-blue-50/30 transition">
                        <td className="px-6 py-4 font-bold text-primary">{sub.asset}</td>
                        <td className="px-6 py-4 font-mono text-secondary">{parseFloat(sub.amount).toFixed(4)}</td>
                        <td className="px-6 py-4 text-green-500 font-bold">{(parseFloat(sub.apy) * 100).toFixed(2)}%</td>
                        <td className="px-6 py-4 font-mono text-accent font-bold animate-pulse">+{sub.earned}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleRedeem(sub.id)}
                            className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-md text-sm font-bold transition"
                          >
                            Redeem
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Subscribe Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-primary">Subscribe {modal.product.asset}</h3>
              <button onClick={() => setModal({ open: false, product: null, amount: '' })} className="text-gray-400 hover:text-primary">&times;</button>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-secondary">APR</span>
                <span className={`font-bold ${modal.product.color}`}>{modal.product.apy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-secondary">Term</span>
                <span className="font-bold text-primary">Flexible</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-secondary font-bold">Subscription Amount</span>
                <span className="text-secondary">Avail: {(balances[modal.product.asset] || 0).toFixed(2)} {modal.product.asset}</span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg p-3 pr-16 focus:ring-accent focus:border-accent outline-none font-mono"
                  placeholder="0.00"
                  value={modal.amount}
                  onChange={(e) => setModal({...modal, amount: e.target.value})}
                />
                <button 
                  onClick={() => setModal({...modal, amount: balances[modal.product.asset] || 0})}
                  className="absolute right-2 top-2 bg-blue-100 text-primary text-xs font-bold px-2 py-1 rounded"
                >
                  MAX
                </button>
              </div>
            </div>

            <button 
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-white bg-[#00B4D8] hover:bg-opacity-90 shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Confirming...' : 'Confirm Subscription'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Earn;

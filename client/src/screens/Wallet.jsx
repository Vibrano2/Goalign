import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import Web3WalletView from '../components/web3/Web3WalletView';

const Wallet = () => {
  const { user } = useAuthStore();
  const [walletMode, setWalletMode] = useState('Exchange'); // 'Exchange' or 'Web3'
  const [activeTab, setActiveTab] = useState('Overview');
  const [depositMethod, setDepositMethod] = useState('Crypto');
  
  const [balances, setBalances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.dbId) {
      fetch(`https://goalign-mrkd.onrender.com/api/wallet/balances/${user.dbId}`)
        .then(res => res.json())
        .then(data => {
          if (data.balances) {
            setBalances(data.balances);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch balances", err);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const assetNames = { USDT: 'Tether', BTC: 'Bitcoin', ETH: 'Ethereum' };
  
  // Calculate Totals (Mock prices for now, ideally fetch from live ticker)
  const prices = { USDT: 1, BTC: 65000, ETH: 3500 };
  
  const spotBalances = balances.filter(b => b.account_type === 'spot');
  const futuresBalances = balances.filter(b => b.account_type === 'futures');
  const earnBalances = balances.filter(b => b.account_type === 'earn');

  const calculateTotalUSD = (accBalances) => {
    return accBalances.reduce((sum, b) => {
      const price = prices[b.asset] || 0;
      return sum + (parseFloat(b.total) * price);
    }, 0);
  };

  const spotTotalUSD = calculateTotalUSD(spotBalances);
  const futuresTotalUSD = calculateTotalUSD(futuresBalances);
  const earnTotalUSD = calculateTotalUSD(earnBalances);
  const totalBalanceUSD = spotTotalUSD + futuresTotalUSD + earnTotalUSD;
  const totalBalanceBTC = (totalBalanceUSD / prices.BTC).toFixed(8);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-50">
        <h3 className="text-secondary text-sm font-medium mb-2">Estimated Balance</h3>
        <div className="flex items-baseline space-x-3">
          <span className="text-4xl font-bold text-primary">{isLoading ? '...' : totalBalanceBTC}</span>
          <span className="text-xl font-medium text-secondary">BTC</span>
        </div>
        <div className="text-secondary mt-1">≈ ${totalBalanceUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="text-sm text-secondary mb-1">Spot Account</div>
            <div className="text-lg font-bold text-primary">${spotTotalUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="text-sm text-secondary mb-1">Futures Account</div>
            <div className="text-lg font-bold text-primary">${futuresTotalUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="text-sm text-secondary mb-1">Earn Account</div>
            <div className="text-lg font-bold text-primary">${earnTotalUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-50 overflow-hidden">
        <div className="p-4 border-b border-blue-50 flex justify-between items-center bg-blue-50/30">
          <h3 className="font-bold text-primary">My Spot Assets</h3>
          <input type="text" placeholder="Search Coin" className="px-3 py-1.5 text-sm border border-blue-200 rounded-md focus:outline-none focus:border-accent" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-secondary text-xs uppercase bg-gray-50/50">
                <th className="px-6 py-4 font-semibold">Coin</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Available</th>
                <th className="px-6 py-4 font-semibold">Value (USD)</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-secondary">Loading balances...</td>
                </tr>
              ) : spotBalances.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-secondary">No assets found.</td>
                </tr>
              ) : spotBalances.map(b => (
                <tr key={b.asset} className="hover:bg-blue-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-primary font-bold flex items-center justify-center text-xs mr-3">
                        {b.asset[0]}
                      </div>
                      <div>
                        <div className="font-bold text-primary">{b.asset}</div>
                        <div className="text-xs text-secondary">{assetNames[b.asset] || b.asset}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">{parseFloat(b.total).toFixed(6)}</td>
                  <td className="px-6 py-4 text-secondary">{parseFloat(b.available).toFixed(6)}</td>
                  <td className="px-6 py-4 text-secondary">${(parseFloat(b.total) * (prices[b.asset] || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => setActiveTab('Deposit')} className="text-accent font-medium hover:underline">Deposit</button>
                    <button onClick={() => setActiveTab('Withdraw')} className="text-secondary hover:text-primary font-medium hover:underline">Withdraw</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDeposit = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-50 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-primary mb-6">Deposit Funds</h3>
      
      <div className="flex space-x-4 mb-8">
        <button 
          onClick={() => setDepositMethod('Crypto')}
          className={`flex-1 py-3 rounded-md font-bold transition ${depositMethod === 'Crypto' ? 'bg-primary text-white' : 'bg-gray-100 text-secondary hover:bg-gray-200'}`}
        >
          Deposit Crypto
        </button>
        <button 
          onClick={() => setDepositMethod('Fiat')}
          className={`flex-1 py-3 rounded-md font-bold transition ${depositMethod === 'Fiat' ? 'bg-primary text-white' : 'bg-gray-100 text-secondary hover:bg-gray-200'}`}
        >
          Buy with Fiat
        </button>
      </div>

      {depositMethod === 'Crypto' ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Select Coin</label>
            <select className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent">
              <option>USDT (Tether)</option>
              <option>BTC (Bitcoin)</option>
              <option>ETH (Ethereum)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Select Network</label>
            <select className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent">
              <option>TRX (TRC20)</option>
              <option>ETH (ERC20)</option>
              <option>BSC (BEP20)</option>
            </select>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex flex-col items-center justify-center">
            <div className="w-40 h-40 bg-white border border-gray-200 p-2 mb-4 shadow-sm flex items-center justify-center">
              <span className="text-secondary text-sm">QR Code Placeholder</span>
            </div>
            <div className="w-full">
              <label className="block text-xs font-medium text-secondary mb-1 text-center">Deposit Address</label>
              <div className="flex items-center">
                <input readOnly value="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" className="w-full px-3 py-2 bg-white border border-blue-200 rounded-l-md text-sm text-primary font-mono text-center" />
                <button className="bg-accent text-primary px-4 py-2 rounded-r-md font-bold text-sm">Copy</button>
              </div>
            </div>
          </div>
          <p className="text-xs text-secondary text-center">
            Send only USDT to this deposit address. Sending coin or token other than USDT to this address may result in the loss of your deposit.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-secondary text-sm mb-6 text-center">Select a payment provider to buy crypto directly with your local currency.</p>
          <button onClick={() => alert("Redirecting to Bybit P2P...")} className="w-full flex items-center justify-between p-4 border border-blue-100 rounded-lg hover:border-accent hover:shadow-md transition group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#FFB11A] rounded-full flex items-center justify-center font-bold text-primary">B</div>
              <div className="text-left">
                <div className="font-bold text-primary">Bybit P2P / Fiat</div>
                <div className="text-xs text-secondary">Bank Transfer, Cards, Local Wallets</div>
              </div>
            </div>
            <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
          </button>
          
          <button onClick={() => alert("Redirecting to Ivorypay Checkout...")} className="w-full flex items-center justify-between p-4 border border-blue-100 rounded-lg hover:border-accent hover:shadow-md transition group">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#000000] rounded-full flex items-center justify-center font-bold text-white">IP</div>
              <div className="text-left">
                <div className="font-bold text-primary">Ivorypay Checkout</div>
                <div className="text-xs text-secondary">Stablecoin payments, Mobile Money</div>
              </div>
            </div>
            <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderWithdraw = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-50 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-primary mb-6">Withdraw Crypto</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Select Coin</label>
          <select className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent">
            <option>USDT (Tether)</option>
            <option>BTC (Bitcoin)</option>
            <option>ETH (Ethereum)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Send to Address</label>
          <input type="text" placeholder="Enter Destination Address" className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Select Network</label>
          <select className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent">
            <option>TRX (TRC20)</option>
            <option>ETH (ERC20)</option>
            <option>BSC (BEP20)</option>
          </select>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-medium text-secondary">Withdrawal Amount</label>
            <span className="text-xs text-primary font-medium cursor-pointer">Available: 0.00 USDT</span>
          </div>
          <div className="relative">
            <input type="number" placeholder="Minimum 10.00" className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent font-mono" />
            <button className="absolute right-3 top-3 text-accent font-bold text-sm">MAX</button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary">Network Fee</span>
            <span className="font-medium text-primary">1.00 USDT</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-primary">Receive Amount</span>
            <span className="text-primary">0.00 USDT</span>
          </div>
        </div>

        <button className="w-full py-4 bg-primary text-white rounded-md font-bold text-lg hover:bg-opacity-90 transition">
          Submit Withdrawal
        </button>
      </div>
    </div>
  );

  const renderExchangeView = () => (
    <div className="container mx-auto max-w-6xl px-4 -mt-10">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-blue-50 overflow-hidden">
            <div className="p-4 border-b border-blue-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-primary font-bold">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="font-bold text-primary truncate max-w-[150px]">{user?.displayName || 'User'}</div>
                  <div className="text-xs text-secondary">UID: 84920391</div>
                </div>
              </div>
            </div>
            <div className="p-2 space-y-1">
              {['Overview', 'Deposit', 'Withdraw', 'Transaction History'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                    activeTab === tab 
                    ? 'bg-blue-50 text-primary border-l-4 border-accent' 
                    : 'text-secondary hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === 'Overview' && renderOverview()}
          {activeTab === 'Deposit' && renderDeposit()}
          {activeTab === 'Withdraw' && renderWithdraw()}
          {activeTab === 'Transaction History' && (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-blue-50 text-center text-secondary">
              No recent transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary pt-10 pb-20 px-4 rounded-b-3xl md:rounded-none">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Wallet</h1>
          </div>
          
          {/* Master Toggle */}
          <div className="flex bg-white/10 rounded-xl p-1 max-w-xs mb-4">
            <button 
              onClick={() => setWalletMode('Exchange')} 
              className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors ${walletMode === 'Exchange' ? 'bg-white text-primary shadow-sm' : 'text-blue-100 hover:text-white'}`}
            >
              Exchange
            </button>
            <button 
              onClick={() => setWalletMode('Web3')} 
              className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors flex justify-center items-center space-x-1 ${walletMode === 'Web3' ? 'bg-white text-primary shadow-sm' : 'text-blue-100 hover:text-white'}`}
            >
              <span>Web3</span>
            </button>
          </div>
          <p className="text-blue-200 text-sm">
            {walletMode === 'Exchange' 
              ? 'Manage your centralized assets, deposit, and withdraw securely.' 
              : 'Your non-custodial gateway to the decentralized web.'}
          </p>
        </div>
      </div>

      {walletMode === 'Exchange' ? renderExchangeView() : (
        <div className="container mx-auto max-w-6xl px-4 -mt-10">
          <Web3WalletView />
        </div>
      )}
    </div>
  );
};

export default Wallet;

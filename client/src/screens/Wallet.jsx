import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { QRCodeSVG } from 'qrcode.react';
import { auth } from '../firebase';
import { API_BASE_URL } from '../utils/api';

const Wallet = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Overview');
  const [depositMethod, setDepositMethod] = useState('Crypto');
  
  const [balances, setBalances] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [withdrawAsset, setWithdrawAsset] = useState('USDT');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('TRX');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transfer States
  const [transferAsset, setTransferAsset] = useState('USDT');
  const [transferFrom, setTransferFrom] = useState('spot');
  const [transferTo, setTransferTo] = useState('futures');
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Deposit States
  const [depositAsset, setDepositAsset] = useState('USDT');
  
  const SUPPORTED_NETWORKS = {
    USDT: ['TRX (TRC20)', 'ETH (ERC20)', 'BSC (BEP20)'],
    BTC: ['BTC (Bitcoin)'],
    ETH: ['ETH (ERC20)']
  };
  
  const [depositNetwork, setDepositNetwork] = useState(SUPPORTED_NETWORKS['USDT'][0]);
  const [realDepositAddress, setRealDepositAddress] = useState('Generating address...');

  // Handle deposit coin change
  const handleDepositCoinChange = (e) => {
    const coin = e.target.value;
    setDepositAsset(coin);
    setDepositNetwork(SUPPORTED_NETWORKS[coin][0]); // Reset to first network of new coin
  };

  const fetchBalances = async () => {
    if (user?.dbId || user?.uid) {
      try {
        const targetId = user.dbId || user.uid;
        const res = await fetch(`${API_BASE_URL}/api/wallet/balances/${targetId}`);
        const data = await res.json();
        if (data.balances) setBalances(data.balances);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch balances", err);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    if (!auth.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/wallet/withdrawals`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.withdrawals) setWithdrawals(data.withdrawals);
      }
    } catch (err) {
      console.error("Failed to fetch withdrawals", err);
    }
  };

  const fetchDepositAddress = async (asset, network) => {
    if (!auth.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      // Extract the actual chain type if network has parentheses, e.g. "TRX (TRC20)" -> "TRX"
      const chainType = network.includes('(') ? network.split(' ')[0] : network;
      const res = await fetch(`${API_BASE_URL}/api/wallet/deposit-address?coin=${asset}&network=${chainType}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRealDepositAddress(data.address);
      }
    } catch (err) {
      console.error('Error fetching deposit address:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'Deposit' && depositMethod === 'Crypto' && user) {
      setRealDepositAddress('Generating address...');
      fetchDepositAddress(depositAsset, depositNetwork);
    } else if (activeTab === 'Transaction History' && user) {
      fetchWithdrawals();
    }
  }, [activeTab, depositMethod, depositAsset, depositNetwork, user]);

  useEffect(() => {
    fetchBalances();
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
            <select 
              value={depositAsset} 
              onChange={handleDepositCoinChange} 
              className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="USDT">USDT (Tether)</option>
              <option value="BTC">BTC (Bitcoin)</option>
              <option value="ETH">ETH (Ethereum)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Select Network</label>
            <select 
              value={depositNetwork} 
              onChange={(e) => setDepositNetwork(e.target.value)} 
              className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {SUPPORTED_NETWORKS[depositAsset].map(net => (
                <option key={net} value={net}>{net}</option>
              ))}
            </select>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex flex-col items-center justify-center">
            <div className="w-40 h-40 bg-white border border-gray-200 p-2 mb-4 shadow-sm flex items-center justify-center">
              {realDepositAddress === 'Generating address...' ? (
                <span className="text-secondary text-sm text-center px-4 animate-pulse">{realDepositAddress}</span>
              ) : (
                <QRCodeSVG value={realDepositAddress} size={140} />
              )}
            </div>
            <div className="w-full mb-4">
              <label className="block text-xs font-medium text-secondary mb-1 text-center">Deposit Address</label>
              <div className="flex items-center">
                <input readOnly value={realDepositAddress} className="w-full px-3 py-2 bg-white border border-blue-200 rounded-l-md text-sm text-primary font-mono text-center" />
                <button 
                  onClick={() => navigator.clipboard.writeText(realDepositAddress)}
                  className="bg-accent text-primary px-4 py-2 rounded-r-md font-bold text-sm hover:bg-opacity-90 transition"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-secondary text-center mt-2">
            Send only {depositAsset} to this deposit address. Sending coin or token other than {depositAsset} to this address may result in the loss of your deposit.
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

  const handleWithdrawSubmit = async () => {
    if (!withdrawAmount || !withdrawAddress) return alert("Please fill in all fields");
    if (!auth.currentUser) return alert("You must be logged in");

    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `wd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const res = await fetch(`${API_BASE_URL}/api/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({
          user_id: user.uid || user.dbId,
          asset: withdrawAsset,
          amount: parseFloat(withdrawAmount),
          address: withdrawAddress,
          network: withdrawNetwork,
          idempotencyKey
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Withdrawal request submitted! Status: ${data.status || 'pending'}`);
        setWithdrawAmount('');
        setWithdrawAddress('');
        fetchBalances();
        fetchWithdrawals();
      } else {
        alert(`Withdrawal Failed: ${data.error || 'Server rejected withdrawal'}`);
      }
    } catch (err) {
      alert("Network Error");
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const renderWithdraw = () => {
    const selectedAssetBalance = spotBalances.find(b => b.asset === withdrawAsset)?.available || "0.00";

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-50 max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-primary mb-6">Withdraw Crypto</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Select Coin</label>
            <select value={withdrawAsset} onChange={e => setWithdrawAsset(e.target.value)} className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="USDT">USDT (Tether)</option>
              <option value="BTC">BTC (Bitcoin)</option>
              <option value="ETH">ETH (Ethereum)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Send to Address</label>
            <input type="text" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder="Enter Destination Address" className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Select Network</label>
            <select value={withdrawNetwork} onChange={e => setWithdrawNetwork(e.target.value)} className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="TRX">TRX (TRC20)</option>
              <option value="ETH">ETH (ERC20)</option>
              <option value="BSC">BSC (BEP20)</option>
            </select>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-secondary">Withdrawal Amount</label>
              <span className="text-xs text-primary font-medium cursor-pointer" onClick={() => setWithdrawAmount(selectedAssetBalance)}>Available: {selectedAssetBalance} {withdrawAsset}</span>
            </div>
            <div className="relative">
              <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Minimum 10.00" className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent font-mono" />
              <button onClick={() => setWithdrawAmount(selectedAssetBalance)} className="absolute right-3 top-3 text-accent font-bold text-sm hover:opacity-80">MAX</button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">Network Fee</span>
              <span className="font-medium text-primary">1.00 {withdrawAsset}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-primary">Receive Amount</span>
              <span className="text-primary">{Math.max(0, (parseFloat(withdrawAmount) || 0) - 1).toFixed(2)} {withdrawAsset}</span>
            </div>
          </div>

          <button 
            onClick={handleWithdrawSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-white rounded-md font-bold text-lg hover:bg-opacity-90 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Submit Withdrawal'}
          </button>
        </div>
      </div>
    );
  };

  const handleTransferSubmit = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      alert("Please enter a valid transfer amount");
      return;
    }
    if (transferFrom === transferTo) {
      alert("From and To accounts must be different");
      return;
    }
    if (!user) {
      alert("You must be logged in");
      return;
    }

    setIsTransferring(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/wallet/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid || user.dbId,
          asset: transferAsset,
          from_account: transferFrom,
          to_account: transferTo,
          amount: parseFloat(transferAmount)
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Successfully transferred ${transferAmount} ${transferAsset} from ${transferFrom.toUpperCase()} to ${transferTo.toUpperCase()}!`);
        setTransferAmount('');
        fetchBalances();
      } else {
        alert(`Transfer Failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      alert("Network Error");
      console.error(err);
    }
    setIsTransferring(false);
  };

  const renderTransfer = () => {
    const availableBalance = balances.find(b => b.account_type === transferFrom && b.asset === transferAsset)?.available || "0.00000000";

    const swapAccounts = () => {
      const temp = transferFrom;
      setTransferFrom(transferTo);
      setTransferTo(temp);
    };

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-50 max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-primary mb-2">Internal Transfer</h3>
        <p className="text-secondary text-sm mb-6">Instantly move funds between your Spot, Futures, and Earn accounts with 0 fees.</p>

        <div className="space-y-6">
          {/* Account Route Box */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-secondary uppercase mb-1">From</label>
              <select
                value={transferFrom}
                onChange={e => setTransferFrom(e.target.value)}
                className="w-full bg-white px-3 py-2 rounded-lg border border-blue-200 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="spot">Spot Account</option>
                <option value="futures">Futures Account</option>
                <option value="earn">Earn Account</option>
              </select>
            </div>

            <button
              onClick={swapAccounts}
              title="Swap From / To"
              className="p-2.5 rounded-full bg-white shadow-sm border border-blue-200 text-accent hover:bg-blue-50 hover:scale-105 transition mt-4"
            >
              ⇄
            </button>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-secondary uppercase mb-1">To</label>
              <select
                value={transferTo}
                onChange={e => setTransferTo(e.target.value)}
                className="w-full bg-white px-3 py-2 rounded-lg border border-blue-200 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="futures">Futures Account</option>
                <option value="spot">Spot Account</option>
                <option value="earn">Earn Account</option>
              </select>
            </div>
          </div>

          {/* Select Coin */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Select Coin</label>
            <select
              value={transferAsset}
              onChange={e => setTransferAsset(e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent font-bold"
            >
              <option value="USDT">USDT (Tether)</option>
              <option value="BTC">BTC (Bitcoin)</option>
              <option value="ETH">ETH (Ethereum)</option>
              <option value="SOL">SOL (Solana)</option>
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-secondary">Transfer Amount</label>
              <span className="text-xs text-primary font-medium cursor-pointer" onClick={() => setTransferAmount(availableBalance)}>
                Available in {transferFrom.toUpperCase()}: <span className="font-bold text-accent">{parseFloat(availableBalance).toFixed(4)} {transferAsset}</span>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-base"
              />
              <button
                type="button"
                onClick={() => setTransferAmount(availableBalance)}
                className="absolute right-3 top-3 text-accent font-bold text-sm hover:opacity-80"
              >
                MAX
              </button>
            </div>
            
            {/* Quick Percentage Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[0.25, 0.5, 0.75, 1.0].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTransferAmount((parseFloat(availableBalance) * pct).toFixed(4))}
                  className="py-1 text-xs font-semibold bg-gray-100 hover:bg-blue-50 text-secondary hover:text-accent rounded transition"
                >
                  {pct * 100}%
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">Transfer Fee</span>
              <span className="font-bold text-green-600">0.00 {transferAsset} (Free)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Execution Speed</span>
              <span className="font-medium text-primary">Instant</span>
            </div>
          </div>

          <button
            onClick={handleTransferSubmit}
            disabled={isTransferring}
            className="w-full py-4 bg-accent text-primary rounded-md font-bold text-lg hover:bg-opacity-90 transition disabled:opacity-50 shadow-md"
          >
            {isTransferring ? 'Processing...' : 'Confirm Transfer'}
          </button>
        </div>
      </div>
    );
  };

  const renderTransactionHistory = () => (
    <div className="bg-white rounded-xl shadow-sm border border-blue-50 overflow-hidden">
      <div className="p-4 border-b border-blue-50 flex justify-between items-center bg-blue-50/20">
        <h3 className="font-bold text-primary">Withdrawal Requests & Settlements</h3>
        <button onClick={fetchWithdrawals} className="text-xs text-accent font-semibold hover:underline">Refresh</button>
      </div>
      {withdrawals.length === 0 ? (
        <div className="p-12 text-center text-secondary">No recent withdrawal transactions found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-500 text-xs uppercase bg-gray-50/50">
                <th className="p-3">Time</th>
                <th className="p-3">Asset</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Network</th>
                <th className="p-3">Destination</th>
                <th className="p-3">Status</th>
                <th className="p-3">Provider TXID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50 text-sm">
              {withdrawals.map((w, i) => (
                <tr key={w.withdrawal_uuid || i} className="hover:bg-blue-50/20">
                  <td className="p-3 text-xs text-secondary">{new Date(w.created_at).toLocaleString()}</td>
                  <td className="p-3 font-bold text-primary">{w.asset}</td>
                  <td className="p-3 font-mono">{parseFloat(w.amount).toFixed(4)}</td>
                  <td className="p-3 text-xs">{w.network}</td>
                  <td className="p-3 font-mono text-xs max-w-[120px] truncate" title={w.address}>{w.address}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      w.status === 'completed' ? 'bg-green-100 text-green-700' :
                      w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {w.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-secondary max-w-[140px] truncate" title={w.provider_txid || 'Pending Settlement'}>
                    {w.provider_txid || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
              {['Overview', 'Deposit', 'Withdraw', 'Transfer', 'Transaction History'].map(tab => (
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
          {activeTab === 'Transfer' && renderTransfer()}
          {activeTab === 'Transaction History' && renderTransactionHistory()}
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
          
          <p className="text-blue-200 text-sm">
            Manage your centralized assets, deposit, and withdraw securely.
          </p>
        </div>
      </div>

      {renderExchangeView()}
    </div>
  );
};

export default Wallet;

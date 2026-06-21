import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// List of popular pairs to track by default
const POPULAR_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 
  'XRPUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT',
  'LTCUSDT', 'BCHUSDT', 'AVAXUSDT', 'SHIBUSDT', 'TRXUSDT'
];

const Home = () => {
  const navigate = useNavigate();
  const [tickers, setTickers] = useState({});
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    // Initialize with default static data to prevent empty table before WS connects
    const initialTickers = {};
    POPULAR_PAIRS.forEach(pair => {
      initialTickers[pair] = { s: pair, c: '0.00', P: '0.00', v: '0.00' };
    });
    setTickers(initialTickers);

    // Connect to Binance WebSocket for all tickers
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (Array.isArray(data)) {
        setTickers(prev => {
          const updated = { ...prev };
          let changed = false;
          data.forEach(ticker => {
            // Only track pairs ending in USDT to keep the demo clean, or our popular pairs
            if (POPULAR_PAIRS.includes(ticker.s) || (activeTab !== 'All' && ticker.s.endsWith('USDT'))) {
              updated[ticker.s] = ticker;
              changed = true;
            }
          });
          return changed ? updated : prev;
        });
      }
    };

    return () => ws.close();
  }, [activeTab]);

  const filteredTickers = useMemo(() => {
    let result = Object.values(tickers);
    
    // Apply search filter
    if (search) {
      result = result.filter(t => t.s.toLowerCase().includes(search.toLowerCase()));
    }

    // Apply tab filter
    if (activeTab === 'Gainers') {
      result = result.sort((a, b) => parseFloat(b.P) - parseFloat(a.P)).slice(0, 20);
    } else if (activeTab === 'Losers') {
      result = result.sort((a, b) => parseFloat(a.P) - parseFloat(b.P)).slice(0, 20);
    } else {
      // Default 'All' or 'USDT' - sort by volume
      result = result.sort((a, b) => parseFloat(b.v) - parseFloat(a.v));
      // Only show top 30 if no search
      if (!search) result = result.slice(0, 30);
    }

    return result;
  }, [tickers, search, activeTab]);

  return (
    <div className="min-h-screen bg-background text-primary">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Buy, trade, and hold 350+ cryptocurrencies on Goalign
            </h1>
            <p className="text-lg text-blue-200 mb-8">
              Experience lightning-fast execution and smart yield strategies powered by decentralized escrow protection.
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="bg-accent text-primary px-8 py-3 rounded-md font-bold text-lg hover:bg-opacity-90 transition shadow-lg"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Market Data Section */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Market Trend</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
          {/* Controls */}
          <div className="p-4 border-b border-blue-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-blue-50/30">
            <div className="flex space-x-2">
              {['All', 'Gainers', 'Losers'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    activeTab === tab 
                    ? 'bg-primary text-white shadow' 
                    : 'bg-white text-secondary hover:bg-blue-50 border border-blue-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Search Coin" 
                className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider bg-gray-50/50">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Last Price</th>
                  <th className="px-6 py-4 font-semibold">24h Change</th>
                  <th className="px-6 py-4 font-semibold hidden sm:table-cell">24h Volume</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {filteredTickers.map((ticker) => {
                  const change = parseFloat(ticker.P);
                  const isPositive = change >= 0;
                  const price = parseFloat(ticker.c).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
                  const volume = parseFloat(ticker.v).toLocaleString('en-US', { maximumFractionDigits: 0 });
                  
                  return (
                    <tr key={ticker.s} className="hover:bg-blue-50/50 transition-colors group cursor-pointer" onClick={() => navigate('/trade')}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold text-xs mr-3">
                            {ticker.s.substring(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-primary">{ticker.s.replace('USDT', '')}</div>
                            <div className="text-xs text-gray-400">{ticker.s}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">${price}</td>
                      <td className={`px-6 py-4 font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{change.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">
                        ${volume}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-accent font-semibold text-sm hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                          Trade
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredTickers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      Loading market data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

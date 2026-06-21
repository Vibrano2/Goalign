import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h,7d')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCoins(data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching market data:', err);
        setIsLoading(false);
      });
  }, []);

  const filteredCoins = useMemo(() => {
    let result = [...coins];
    
    // Apply search filter
    if (search) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.symbol.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply tab filter
    if (activeTab === 'Gainers') {
      result = result.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    } else if (activeTab === 'Losers') {
      result = result.sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0));
    }

    return result;
  }, [coins, search, activeTab]);

  const Sparkline = ({ data, color }) => {
    if (!data || data.length === 0) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 100;
    const height = 30;
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-24 h-8 overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-background text-primary">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Buy, trade, and hold cryptocurrencies on Goalign
            </h1>
            <p className="text-lg text-blue-200 mb-8">
              Experience lightning-fast execution and smart yield strategies powered by decentralized escrow protection.
            </p>
            <button 
              onClick={() => navigate(user ? '/trade' : '/register')}
              className="bg-accent text-primary px-8 py-3 rounded-md font-bold text-lg hover:bg-opacity-90 transition shadow-lg"
            >
              {user ? 'Trade Now' : 'Get Started'}
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
                  <th className="px-6 py-4 font-semibold">Price</th>
                  <th className="px-6 py-4 font-semibold">24h Change</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Market Cap</th>
                  <th className="px-6 py-4 font-semibold hidden lg:table-cell">7d Trend</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {filteredCoins.map((coin) => {
                  const change24h = coin.price_change_percentage_24h || 0;
                  const isPositive24h = change24h >= 0;
                  const price = coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
                  const mcap = coin.market_cap ? coin.market_cap.toLocaleString('en-US') : '-';
                  
                  // Sparkline calculation
                  const sparklineData = coin.sparkline_in_7d?.price || [];
                  const sparklineColor = isPositive24h ? '#10B981' : '#EF4444'; // green : red

                  // Generate a distinct background color based on the symbol for fallback
                  const getCoinColor = (symbol) => {
                    const s = symbol.toLowerCase();
                    if (s === 'btc') return 'bg-[#3b2a1a] text-[#f7931a]';
                    if (s === 'eth') return 'bg-[#1a233b] text-[#627eea]';
                    if (s === 'sol') return 'bg-[#113125] text-[#14f195]';
                    if (s === 'xrp') return 'bg-[#1a1a1a] text-[#ffffff]';
                    if (s === 'ada') return 'bg-[#101935] text-[#0033ad]';
                    if (s === 'avax') return 'bg-[#3b1a1a] text-[#e84142]';
                    if (s === 'doge') return 'bg-[#3b351a] text-[#c2a633]';
                    return 'bg-blue-100 text-primary';
                  };

                  const coinColorClass = getCoinColor(coin.symbol);

                  return (
                    <tr key={coin.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer" onClick={() => navigate('/trade')}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <button className="text-gray-400 hover:text-accent mr-4 focus:outline-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                          
                          <div className="relative w-8 h-8 mr-3 rounded-full flex-shrink-0">
                            {/* Fallback Initial */}
                            <div className={`absolute inset-0 rounded-full flex items-center justify-center font-bold text-xs ${coinColorClass}`}>
                              {coin.symbol.charAt(0).toUpperCase()}
                            </div>
                            {/* Actual Image Logo */}
                            {coin.image && (
                              <img 
                                src={coin.image} 
                                alt={coin.name} 
                                className="absolute inset-0 w-8 h-8 rounded-full object-cover z-10 bg-transparent" 
                                referrerPolicy="no-referrer"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                          </div>

                          <div>
                            <div className="font-bold text-primary text-base">{coin.name}</div>
                            <div className="text-xs text-gray-400 uppercase font-semibold">{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">${price}</td>
                      <td className={`px-6 py-4 font-medium ${isPositive24h ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive24h ? '+' : ''}{change24h.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                        ${mcap}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <Sparkline data={sparklineData} color={sparklineColor} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-accent font-semibold text-sm hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                          Trade
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {isLoading && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Loading market data from CoinGecko...
                    </td>
                  </tr>
                )}
                {!isLoading && filteredCoins.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No coins found.
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

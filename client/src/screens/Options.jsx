import React, { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store/useAuthStore';
import { createOptionsChart, LineSeries, BaselineSeries } from 'lightweight-charts';
import { API_BASE_URL } from '../utils/api';

export default function Options() {
  const { user } = useAuthStore();
  const [chain, setChain] = useState([]);
  const [markPrice, setMarkPrice] = useState(0);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedOption, setSelectedOption] = useState(null); // { strike, type: 'call'|'put', side: 'buy', premium: num }
  const [size, setSize] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  
  const [positions, setPositions] = useState([]);

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const fetchChain = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/options/chain/${symbol}`);
      const data = await res.json();
      setChain(data.chain || []);
      setMarkPrice(data.markPrice || 0);
    } catch (err) {
      console.error('Failed to fetch chain:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPositions = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/options/positions/${user.uid}`);
      const data = await res.json();
      if (data.positions) setPositions(data.positions);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    }
  };

  useEffect(() => {
    fetchChain();
    fetchPositions();
  }, [symbol, user]);

  // Chart setup
  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createOptionsChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: '#ffffff' },
          textColor: '#64748b',
        },
        grid: {
          vertLines: { color: '#f8fafc' },
          horzLines: { color: '#f8fafc' },
        },
        rightPriceScale: {
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          tickMarkFormatter: (time) => `$${time}`, // Treat time axis as Price!
        },
        crosshair: {
          mode: 1, // Normal crosshair
        },
        width: chartContainerRef.current.clientWidth,
        height: 350,
      });

      chartRef.current = chart;

      const series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 0 },
        topFillColor1: 'rgba(38, 166, 154, 0.28)',
        topFillColor2: 'rgba(38, 166, 154, 0.05)',
        topLineColor: 'rgba(38, 166, 154, 1)',
        bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
        bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
        bottomLineColor: 'rgba(239, 83, 80, 1)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
      });
      seriesRef.current = series;

      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }
  }, []);

  // Update chart when selected option changes
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    if (!selectedOption) {
      seriesRef.current.setData([]);
      return;
    }

    const { strike, type, premium } = selectedOption;
    const contractSize = parseFloat(size) || 1;
    const maxLoss = premium * contractSize;
    
    // Generate price range for X-axis (from strike - 5000 to strike + 5000)
    const data = [];
    const step = 100; // $100 intervals
    const startPrice = strike - 5000;
    const endPrice = strike + 5000;

    for (let price = startPrice; price <= endPrice; price += step) {
      let profit = 0;
      if (type === 'call') {
        profit = (Math.max(0, price - strike) * contractSize) - maxLoss;
      } else {
        profit = (Math.max(0, strike - price) * contractSize) - maxLoss;
      }
      
      data.push({
        time: price, // X-axis is the underlying price
        value: profit // Y-axis is PNL
      });
    }

    seriesRef.current.setData(data);
    chartRef.current.timeScale().fitContent();
    
    // Add mark price line
    seriesRef.current.createPriceLine({
      price: 0,
      color: '#000',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: 'Breakeven',
    });

  }, [selectedOption, size]);

  const handleBuy = async () => {
    if (!user || !selectedOption || !size) return;
    try {
      setIsOrdering(true);
      const res = await fetch(`${API_BASE_URL}/api/options/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`
        },
        body: JSON.stringify({
          user_id: user.uid,
          symbol,
          type: selectedOption.type,
          strike_price: selectedOption.strike,
          size
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Order placed successfully! Cost: $${data.totalCost.toFixed(2)}`);
      setSelectedOption(null);
      fetchPositions();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-primary font-sans p-4 pb-20">
      <div className="container mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Options Chain</h1>
            <p className="text-secondary text-sm">Trade Crypto Options and visualize your payoff in real-time.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <div>
              <div className="text-xs text-secondary font-medium">Underlying Asset</div>
              <select 
                value={symbol} 
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-transparent font-bold text-primary focus:outline-none cursor-pointer"
              >
                <option value="BTCUSDT">BTC/USDT</option>
                <option value="ETHUSDT">ETH/USDT</option>
              </select>
            </div>
            <div className="h-8 w-px bg-blue-200"></div>
            <div>
              <div className="text-xs text-secondary font-medium">Mark Price</div>
              <div className="font-bold text-accent">${markPrice.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chain (Left / Center) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-blue-50 bg-blue-50/30 flex justify-center">
              <h3 className="font-bold text-primary">Expiring in 7 Days</h3>
            </div>
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full text-center text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-blue-100 text-xs text-secondary uppercase font-semibold">
                    <th className="py-3 px-2 border-r border-blue-50" colSpan="2">Calls</th>
                    <th className="py-3 px-2 bg-blue-50/50">Strike</th>
                    <th className="py-3 px-2 border-l border-blue-50" colSpan="2">Puts</th>
                  </tr>
                  <tr className="border-b border-blue-50 text-xs text-secondary">
                    <th className="py-2 px-2 font-medium">Bid</th>
                    <th className="py-2 px-2 border-r border-blue-50 font-medium">Ask</th>
                    <th className="py-2 px-2 bg-blue-50/30 font-bold text-primary">Price</th>
                    <th className="py-2 px-2 border-l border-blue-50 font-medium">Bid</th>
                    <th className="py-2 px-2 font-medium">Ask</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {isLoading ? (
                    <tr><td colSpan="5" className="py-8 text-secondary">Loading Options Chain...</td></tr>
                  ) : chain.map((row, idx) => {
                    const isATM = Math.abs(row.strike - markPrice) <= (symbol === 'BTCUSDT' ? 500 : 50);
                    return (
                      <tr key={row.strike} className={`hover:bg-blue-50/30 transition-colors ${isATM ? 'bg-yellow-50/30' : ''}`}>
                        {/* CALLS */}
                        <td className="py-3 px-2 text-red-500 font-medium">{row.call.bid.toFixed(2)}</td>
                        <td 
                          className="py-3 px-2 border-r border-blue-50 text-green-500 font-medium cursor-pointer hover:bg-green-50"
                          onClick={() => setSelectedOption({ strike: row.strike, type: 'call', side: 'buy', premium: row.call.ask })}
                        >
                          {row.call.ask.toFixed(2)}
                        </td>
                        
                        {/* STRIKE */}
                        <td className="py-3 px-2 font-bold text-primary bg-blue-50/20">
                          {row.strike.toLocaleString()}
                          {isATM && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">ATM</span>}
                        </td>
                        
                        {/* PUTS */}
                        <td 
                          className="py-3 px-2 border-l border-blue-50 text-red-500 font-medium cursor-pointer hover:bg-red-50"
                          onClick={() => setSelectedOption({ strike: row.strike, type: 'put', side: 'buy', premium: row.put.ask })}
                        >
                          {row.put.ask.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-green-500 font-medium">{row.put.bid.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 text-xs text-secondary text-center border-t border-blue-50 bg-gray-50/50">
              Click on an <span className="text-green-500 font-medium">Ask</span> price to Buy a contract.
            </div>
          </div>

          {/* Sidebar (Order Entry & Payoff) */}
          <div className="space-y-6">
            {/* Order Entry */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
              <div className="p-4 border-b border-blue-50 bg-blue-50/30">
                <h3 className="font-bold text-primary">Order Entry</h3>
              </div>
              <div className="p-4">
                {selectedOption ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-sm font-bold text-primary">
                        {selectedOption.type.toUpperCase()} @ {selectedOption.strike.toLocaleString()}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase">
                        {selectedOption.side}
                      </span>
                    </div>
                    
                    <div>
                      <label className="text-xs text-secondary font-medium mb-1 block">Contract Size</label>
                      <input 
                        type="number" 
                        min="0.1" 
                        step="0.1" 
                        value={size} 
                        onChange={e => setSize(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-100 rounded-lg focus:outline-none focus:border-accent font-medium text-sm"
                      />
                    </div>

                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Premium (Price)</span>
                        <span className="font-medium text-primary">${selectedOption.premium.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-primary">Total Cost</span>
                        <span className="text-accent">${(selectedOption.premium * (parseFloat(size)||1)).toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleBuy}
                      disabled={isOrdering}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors shadow-sm shadow-green-500/30"
                    >
                      {isOrdering ? 'Processing...' : `Buy ${selectedOption.type.toUpperCase()}`}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-secondary text-sm">
                    Select an option from the chain to place an order.
                  </div>
                )}
              </div>
            </div>

            {/* Payoff Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
              <div className="p-4 border-b border-blue-50 bg-blue-50/30">
                <h3 className="font-bold text-primary">Theoretical Payoff</h3>
              </div>
              <div className="p-4 relative">
                {!selectedOption && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 text-secondary text-sm">
                    Select an option to view payoff
                  </div>
                )}
                <div ref={chartContainerRef} className="w-full h-[250px]" />
                {selectedOption && (
                  <div className="mt-2 text-xs text-secondary text-center">
                    X-Axis: Underlying Price | Y-Axis: Estimated Profit/Loss
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Positions */}
        {user && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
            <div className="p-4 border-b border-blue-50 bg-blue-50/30">
              <h3 className="font-bold text-primary">Open Positions ({positions.length})</h3>
            </div>
            <div className="overflow-x-auto hide-scrollbar p-4">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="text-secondary border-b border-blue-50">
                  <tr>
                    <th className="pb-2 font-medium">Symbol</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Strike</th>
                    <th className="pb-2 font-medium">Size</th>
                    <th className="pb-2 font-medium">Premium Paid</th>
                    <th className="pb-2 font-medium">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {positions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-secondary">No active option positions.</td>
                    </tr>
                  ) : (
                    positions.map((pos) => (
                      <tr key={pos.id} className="hover:bg-blue-50/30">
                        <td className="py-3 font-bold text-primary">{pos.symbol}</td>
                        <td className={`py-3 font-bold uppercase ${pos.type === 'call' ? 'text-green-500' : 'text-red-500'}`}>{pos.type}</td>
                        <td className="py-3 font-medium">${parseFloat(pos.strike_price).toLocaleString()}</td>
                        <td className="py-3 text-secondary">{parseFloat(pos.size)}</td>
                        <td className="py-3 font-medium">${parseFloat(pos.premium_paid).toFixed(2)}</td>
                        <td className="py-3 text-secondary">{new Date(pos.expiry_date).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

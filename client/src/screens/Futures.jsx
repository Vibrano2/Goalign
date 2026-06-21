import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import useAuthStore from '../store/useAuthStore';

const SYMBOL = 'BTCUSDT';

const Futures = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [side, setSide] = useState('Long');
  const [leverage, setLeverage] = useState(10);
  const [margin, setMargin] = useState('');
  
  const [ticker, setTicker] = useState({ p: '0.00', c: '0.00', h: '0.00', l: '0.00', v: '0.00' });
  const [positions, setPositions] = useState([]);
  
  const { user } = useAuthStore();
  const [balances, setBalances] = useState({ USDT: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchBalancesAndPositions = async () => {
    if (!user) return;
    try {
      // Fetch Balances
      const resBal = await fetch(`https://goalign-mrkd.onrender.com/api/wallet/balances/${user.uid}`);
      const dataBal = await resBal.json();
      if (resBal.ok && dataBal.balances) {
        let usdt = 0;
        dataBal.balances.forEach(b => {
          if (b.account_type === 'futures' && b.asset === 'USDT') {
            usdt = parseFloat(b.available);
          }
        });
        setBalances({ USDT: usdt });
      }

      // Fetch Positions
      const resPos = await fetch(`https://goalign-mrkd.onrender.com/api/futures/positions/${user.uid}`);
      const dataPos = await resPos.json();
      if (resPos.ok && dataPos.positions) {
        setPositions(dataPos.positions);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchBalancesAndPositions();
    const interval = setInterval(fetchBalancesAndPositions, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [user]);

  const handleOpenPosition = async () => {
    if (!user) {
      setMessage('Please login first');
      return;
    }
    if (!margin || parseFloat(margin) <= 0) {
      setMessage('Enter a valid margin amount');
      return;
    }
    if (parseFloat(margin) > balances.USDT) {
      setMessage('Insufficient USDT in Futures Wallet');
      return;
    }
    
    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch('https://goalign-mrkd.onrender.com/api/futures/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          symbol: SYMBOL,
          side: side.toLowerCase(),
          leverage,
          margin: parseFloat(margin)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Success! Opened ${leverage}x ${side}`);
        fetchBalancesAndPositions();
        setMargin('');
      } else {
        setMessage(data.error || 'Failed to open position');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePosition = async (positionId) => {
    try {
      const res = await fetch('https://goalign-mrkd.onrender.com/api/futures/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          position_id: positionId
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Position Closed! PNL: ${data.pnl} USDT`);
        fetchBalancesAndPositions();
      } else {
        alert(data.error || 'Failed to close position');
      }
    } catch (err) {
      alert('Network error closing position');
    }
  };

  // Chart setup
  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#90E0EF' },
        grid: { vertLines: { color: 'rgba(144, 224, 239, 0.1)' }, horzLines: { color: 'rgba(144, 224, 239, 0.1)' } },
        timeScale: { timeVisible: true, secondsVisible: false },
        crosshair: { mode: 0 }
      });
      chartRef.current = chart;
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00B4D8', downColor: '#ef5350', borderVisible: false, wickUpColor: '#00B4D8', wickDownColor: '#ef5350'
      });

      // Mock historical data
      const data = [];
      let time = Math.floor(Date.now() / 1000) - 100 * 60;
      let price = 65000;
      for (let i = 0; i < 100; i++) {
        const volatility = price * 0.001;
        const open = price + (Math.random() - 0.5) * volatility;
        const high = open + Math.random() * volatility;
        const low = open - Math.random() * volatility;
        const close = open + (Math.random() - 0.5) * volatility;
        data.push({ time: time + i * 60, open, high, low, close });
        price = close;
      }
      candlestickSeries.setData(data);

      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${SYMBOL.toLowerCase()}@ticker`);
      ws.onmessage = (event) => {
        const d = JSON.parse(event.data);
        setTicker({ p: parseFloat(d.c).toFixed(2), c: parseFloat(d.p).toFixed(2), h: parseFloat(d.h).toFixed(2), l: parseFloat(d.l).toFixed(2), v: parseFloat(d.v).toFixed(2) });
      };

      return () => {
        ws.close();
        chart.remove();
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      {/* Ticker Header */}
      <div className="bg-[#03045E] border-b border-white/10 px-4 py-3 flex items-center space-x-6 overflow-x-auto text-sm">
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-white text-lg tracking-wider">{SYMBOL}</span>
          <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-bold border border-accent/30">Perpetual</span>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Mark Price</div>
          <div className={`font-mono font-bold ${parseFloat(ticker.c) >= 0 ? 'text-accent' : 'text-red-400'}`}>{ticker.p}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">24h Change</div>
          <div className={`font-mono ${parseFloat(ticker.c) >= 0 ? 'text-accent' : 'text-red-400'}`}>{ticker.c}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">24h High</div>
          <div className="text-white font-mono">{ticker.h}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">24h Low</div>
          <div className="text-white font-mono">{ticker.l}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Chart Area */}
        <div className="flex-1 border-r border-white/10 relative min-h-[400px] bg-[#020344]">
          <div ref={chartContainerRef} className="absolute inset-0" />
        </div>

        {/* Order Entry Panel */}
        <div className="w-full md:w-80 bg-[#03045E] flex flex-col p-4 border-l border-white/10">
          
          <div className="flex space-x-2 bg-[#020344] p-1 rounded-md mb-6">
            <button 
              className={`flex-1 py-2 text-sm font-bold rounded-md transition ${side === 'Long' ? 'bg-[#00B4D8] text-[#03045E] shadow-lg' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setSide('Long')}
            >
              Open Long
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-bold rounded-md transition ${side === 'Short' ? 'bg-[#ef5350] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setSide('Short')}
            >
              Open Short
            </button>
          </div>

          <div className="space-y-6 flex-1">
            {/* Leverage Slider */}
            <div>
              <div className="flex justify-between text-xs text-[#90E0EF] mb-2">
                <span>Leverage</span>
                <span className="font-bold">{leverage}x</span>
              </div>
              <input 
                type="range" min="1" max="100" value={leverage} 
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>1x</span><span>25x</span><span>50x</span><span>75x</span><span>100x</span>
              </div>
            </div>

            {/* Margin Input */}
            <div>
              <div className="flex justify-between text-xs text-[#90E0EF] mb-2">
                <span>Margin (USDT)</span>
                <span className="font-mono text-white">Avail: {balances.USDT.toFixed(2)}</span>
              </div>
              <div className="flex items-center bg-[#020344] border border-[#0077B6]/50 rounded-md px-3 py-2 focus-within:border-accent transition">
                <input 
                  type="number" 
                  className="flex-1 bg-transparent text-right text-white font-mono outline-none" 
                  placeholder="0.00" 
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                />
                <span className="text-[#90E0EF] text-sm ml-2 font-bold">USDT</span>
              </div>
            </div>

            {/* Position Preview */}
            <div className="bg-[#020344] rounded-md p-3 space-y-2 text-xs border border-white/5">
              <div className="flex justify-between text-gray-400">
                <span>Position Size</span>
                <span className="text-white font-mono">{(margin * leverage || 0).toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Est. Liq Price</span>
                <span className="text-orange-400 font-mono">
                  {margin ? (side === 'Long' ? (parseFloat(ticker.p) * (1 - 1/leverage + 0.005)).toFixed(2) : (parseFloat(ticker.p) * (1 + 1/leverage - 0.005)).toFixed(2)) : '--'}
                </span>
              </div>
            </div>

            {message && (
              <div className={`text-sm text-center py-2 rounded font-bold ${message.includes('Success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {message}
              </div>
            )}

            <button 
              onClick={handleOpenPosition}
              disabled={isLoading}
              className={`w-full py-4 rounded-md font-bold text-white text-lg transition shadow-lg ${side === 'Long' ? 'bg-[#00B4D8] hover:bg-opacity-90 text-[#03045E]' : 'bg-[#ef5350] hover:bg-opacity-90'} disabled:opacity-50`}
            >
              {isLoading ? 'Processing...' : (side === 'Long' ? `Long ${SYMBOL}` : `Short ${SYMBOL}`)}
            </button>
          </div>
        </div>
      </div>

      {/* Positions Dashboard */}
      <div className="h-64 bg-[#020344] border-t border-white/10 p-4 overflow-y-auto">
        <h3 className="text-white font-bold mb-4">Open Positions ({positions.length})</h3>
        <table className="w-full text-left text-sm">
          <thead className="text-gray-400 border-b border-white/10">
            <tr>
              <th className="pb-2 font-normal">Symbol</th>
              <th className="pb-2 font-normal">Size</th>
              <th className="pb-2 font-normal">Entry Price</th>
              <th className="pb-2 font-normal">Mark Price</th>
              <th className="pb-2 font-normal">Liq. Price</th>
              <th className="pb-2 font-normal">Margin Ratio</th>
              <th className="pb-2 font-normal">Unrealized PNL</th>
              <th className="pb-2 text-right font-normal">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {positions.length === 0 ? (
              <tr><td colSpan="8" className="py-8 text-center text-gray-500">No open positions</td></tr>
            ) : (
              positions.map(p => {
                const currentPrice = parseFloat(ticker.p);
                const entry = parseFloat(p.entry_price);
                const size = parseFloat(p.size);
                
                let pnl = 0;
                if (p.side === 'long') pnl = ((currentPrice - entry) / entry) * size;
                if (p.side === 'short') pnl = ((entry - currentPrice) / entry) * size;

                const pnlClass = pnl >= 0 ? 'text-green-400' : 'text-red-400';

                return (
                  <tr key={p.id} className="text-white hover:bg-white/5">
                    <td className="py-3">
                      <span className={`font-bold ${p.side === 'long' ? 'text-accent' : 'text-red-400'}`}>
                        {p.symbol} {p.leverage}x
                      </span>
                    </td>
                    <td className="py-3 font-mono">{size.toFixed(2)}</td>
                    <td className="py-3 font-mono">{entry.toFixed(2)}</td>
                    <td className="py-3 font-mono text-accent">{currentPrice.toFixed(2)}</td>
                    <td className="py-3 font-mono text-orange-400">{parseFloat(p.liquidation_price).toFixed(2)}</td>
                    <td className="py-3 font-mono">{(100 / p.leverage).toFixed(2)}%</td>
                    <td className={`py-3 font-mono font-bold ${pnlClass}`}>
                      {pnl > 0 ? '+' : ''}{pnl.toFixed(4)} USDT
                    </td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => handleClosePosition(p.id)}
                        className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-xs transition"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Futures;

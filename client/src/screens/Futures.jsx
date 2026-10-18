import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { toZonedTime } from 'date-fns-tz';
import useAuthStore from '../store/useAuthStore';
import { AVAILABLE_SYMBOLS } from '../utils/symbols';
import { API_BASE_URL } from '../utils/api';
const FUTURES_SYMBOLS = AVAILABLE_SYMBOLS.filter(sym => sym.endsWith('USDT') || sym.endsWith('PERP') || sym.endsWith('USD'));

const INTERVAL = '1'; // Bybit uses '1' instead of '1m'

function timeToTz(originalTime, timeZone) {
    const zonedDate = toZonedTime(new Date(originalTime * 1000), timeZone);
    return zonedDate.getTime() / 1000;
}

const Futures = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const priceLinesRef = useRef([]);
  const wsRef = useRef(null);
  
  const [symbol, setSymbol] = useState(FUTURES_SYMBOLS.includes('BTCUSDT') ? 'BTCUSDT' : (FUTURES_SYMBOLS[0] || 'BTCUSDT'));
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  
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
      const resBal = await fetch(`${API_BASE_URL}/api/wallet/balances/${user.uid}`);
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
      const resPos = await fetch(`${API_BASE_URL}/api/futures/positions/${user.uid}`);
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
      const res = await fetch(`${API_BASE_URL}/api/futures/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          symbol: symbol,
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
      const res = await fetch(`${API_BASE_URL}/api/futures/close`, {
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
        timeScale: { timeVisible: true, secondsVisible: false, borderColor: 'rgba(144, 224, 239, 0.2)' },
        crosshair: { mode: 0 },
        rightPriceScale: { borderColor: 'rgba(144, 224, 239, 0.2)' }
      });
      chartRef.current = chart;
      
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00B4D8', downColor: '#ef5350', borderVisible: false, wickUpColor: '#00B4D8', wickDownColor: '#ef5350'
      });
      seriesRef.current = candlestickSeries;

      // Create Tooltip DOM Element
      const toolTip = document.createElement('div');
      toolTip.style = `position: absolute; display: none; z-index: 50; pointer-events: none; background: #03045E; border: 1px solid rgba(144, 224, 239, 0.2); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); border-radius: 0.5rem; padding: 0.75rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.875rem; min-width: 130px; color: #90E0EF;`;
      chartContainerRef.current.appendChild(toolTip);

      chart.subscribeCrosshairMove((param) => {
        if (!param.time || param.point.x < 0 || param.point.x > chartContainerRef.current.clientWidth || param.point.y < 0 || param.point.y > chartContainerRef.current.clientHeight) {
          toolTip.style.display = 'none';
          return;
        }

        const data = param.seriesData.get(seriesRef.current);
        if (!data) {
          toolTip.style.display = 'none';
          return;
        }

        toolTip.style.display = 'block';
        const price = data.value !== undefined ? data.value : data.close;
        const open = data.open !== undefined ? data.open : price;
        const high = data.high !== undefined ? data.high : price;
        const low = data.low !== undefined ? data.low : price;
        
        toolTip.innerHTML = `
          <div style="font-weight: bold; color: #fff; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid rgba(144, 224, 239, 0.2);">${symbol}</div>
          <div style="display: flex; justify-content: space-between;"><span>O</span> <span style="color: #fff;">${open.toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>H</span> <span style="color: #fff;">${high.toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>L</span> <span style="color: #fff;">${low.toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;"><span>C</span> <span style="color: ${price >= open ? '#00B4D8' : '#ef5350'}; font-weight: bold;">${price.toFixed(2)}</span></div>
        `;

        let x = param.point.x + 15;
        let y = param.point.y + 15;
        if (x > chartContainerRef.current.clientWidth - 150) x = param.point.x - 150;
        if (y > chartContainerRef.current.clientHeight - 150) y = param.point.y - 150;
        
        toolTip.style.left = x + 'px';
        toolTip.style.top = y + 'px';
      });

      // Fetch historical data from Bybit via Vite proxy
      fetch(`/bybit-api/v5/market/kline?category=linear&symbol=${symbol}&interval=${INTERVAL}&limit=200`)
        .then(res => res.json())
        .then(data => {
          if (data.retCode === 0 && data.result.list) {
            // Bybit returns newest to oldest, we need oldest to newest
            const reversedList = [...data.result.list].reverse();
            const formattedData = reversedList.map(d => {
              const rawTime = parseInt(d[0]) / 1000;
              const time = timeToTz(rawTime, 'America/New_York');
              return {
                time,
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
              };
            });
            candlestickSeries.setData(formattedData);
            chart.timeScale().fitContent();
          }
        });

      // Connect WebSockets for Ticker and Klines via Vite proxy
      if (wsRef.current) wsRef.current.close();
      
      const ws = new WebSocket('wss://stream.bybit.com/v5/public/linear');
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          "op": "subscribe",
          "args": [
            `kline.${INTERVAL}.${symbol}`,
            `tickers.${symbol}`
          ]
        }));
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        
        if (payload.topic === `kline.${INTERVAL}.${symbol}`) {
          const klines = payload.data;
          klines.forEach(k => {
            const rawTime = parseInt(k.start) / 1000;
            const time = timeToTz(rawTime, 'America/New_York');
            candlestickSeries.update({
              time: time,
              open: parseFloat(k.open),
              high: parseFloat(k.high),
              low: parseFloat(k.low),
              close: parseFloat(k.close),
            });
          });
        }
        
        if (payload.topic === `tickers.${symbol}`) {
          const d = payload.data;
          setTicker(prev => ({
            p: d.lastPrice ? parseFloat(d.lastPrice).toFixed(2) : prev.p,
            c: d.price24hPcnt ? (parseFloat(d.price24hPcnt) * 100).toFixed(2) : prev.c,
            h: d.highPrice24h ? parseFloat(d.highPrice24h).toFixed(2) : prev.h,
            l: d.lowPrice24h ? parseFloat(d.lowPrice24h).toFixed(2) : prev.l,
            v: d.volume24h ? parseFloat(d.volume24h).toFixed(2) : prev.v
          }));
        }
      };

      return () => {
        if (wsRef.current) wsRef.current.close();
        if (toolTip && toolTip.parentNode) {
            toolTip.parentNode.removeChild(toolTip);
        }
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
      };
    }
  }, [symbol]); // Re-run effect when symbol changes

  // Sync positions to chart lines
  useEffect(() => {
      if (!seriesRef.current) return;
      
      // Clear previous lines
      priceLinesRef.current.forEach(line => {
          seriesRef.current.removePriceLine(line);
      });
      priceLinesRef.current = [];

      // Add new lines
      positions.forEach(p => {
          const entryLine = seriesRef.current.createPriceLine({
              price: parseFloat(p.entry_price),
              color: p.side === 'long' ? '#00B4D8' : '#ef5350',
              lineWidth: 2,
              lineStyle: 0,
              axisLabelVisible: true,
              title: `Entry (${p.leverage}x)`,
          });
          const liqLine = seriesRef.current.createPriceLine({
              price: parseFloat(p.liquidation_price),
              color: '#f97316', // orange-500
              lineWidth: 2,
              lineStyle: 2, // Dashed
              axisLabelVisible: true,
              title: 'Liq',
          });
          priceLinesRef.current.push(entryLine, liqLine);
      });
  }, [positions]);

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      {/* Ticker Header */}
      <div className="bg-[#03045E] border-b border-white/10 px-4 py-3 flex items-center space-x-6 text-sm relative z-50 flex-wrap gap-y-2">
        <div className="relative">
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition group"
            onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
          >
            <span className="font-extrabold text-white text-lg tracking-wider">{symbol}</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showSymbolDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          
          {showSymbolDropdown && (
              <div className="absolute top-full mt-2 left-0 w-56 bg-[#020344] border border-white/10 rounded-md shadow-2xl z-[100] max-h-96 overflow-y-auto">
              {FUTURES_SYMBOLS.map(sym => (
                <div 
                  key={sym} 
                  className={`px-4 py-2 cursor-pointer hover:bg-white/10 font-bold transition ${symbol === sym ? 'text-accent bg-white/5' : 'text-white'}`}
                  onClick={() => {
                    setSymbol(sym);
                    setTicker({ p: '0.00', c: '0.00', h: '0.00', l: '0.00', v: '0.00' });
                    setShowSymbolDropdown(false);
                  }}
                >
                  {sym}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-bold border border-accent/30 shrink-0">Perpetual</div>
        
        <div>
          <div className="text-gray-400 text-xs">Mark Price</div>
          <div className={`font-mono font-bold ${parseFloat(ticker.c) >= 0 ? 'text-accent' : 'text-red-400'}`}>{ticker.p}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">24h Change</div>
          <div className={`font-mono ${parseFloat(ticker.c) >= 0 ? 'text-accent' : 'text-red-400'}`}>{ticker.c}%</div>
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
              {isLoading ? 'Processing...' : (side === 'Long' ? `Long ${symbol}` : `Short ${symbol}`)}
            </button>
          </div>
        </div>
      </div>

      {/* Positions Dashboard */}
      <div className="h-64 bg-[#020344] border-t border-white/10 p-4 overflow-y-auto">
        <h3 className="text-white font-bold mb-4">Open Positions ({positions.length})</h3>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left text-sm min-w-[800px]">
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
    </div>
  );
};

export default Futures;

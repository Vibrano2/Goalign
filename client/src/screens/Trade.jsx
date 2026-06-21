import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

const SYMBOL = 'BTCUSDT';
const INTERVAL = '1m';

const Trade = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const [orderType, setOrderType] = useState('Limit');
  const [side, setSide] = useState('Buy');
  const [price, setPrice] = useState('0.00');
  const [amount, setAmount] = useState('');
  
  const [ticker, setTicker] = useState({ p: '0.00', c: '0.00', h: '0.00', l: '0.00', v: '0.00' });
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });

  // Chart setup & WebSocket
  useEffect(() => {
    if (chartContainerRef.current) {
      const handleResize = () => {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      };

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: '#03045E' }, // Goalign Primary Dark
          textColor: '#CAF0F8', // Goalign Very Light Cyan
        },
        grid: {
          vertLines: { color: 'rgba(0, 119, 182, 0.2)' },
          horzLines: { color: 'rgba(0, 119, 182, 0.2)' },
        },
        crosshair: { mode: 0 },
        rightPriceScale: { borderColor: 'rgba(144, 224, 239, 0.4)' },
        timeScale: { borderColor: 'rgba(144, 224, 239, 0.4)', timeVisible: true },
        width: chartContainerRef.current.clientWidth,
        height: 500,
      });
      chartRef.current = chart;

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#00B4D8', // Goalign Accent Cyan
        downColor: '#ef5350', // Red for down
        borderVisible: false,
        wickUpColor: '#00B4D8',
        wickDownColor: '#ef5350',
      });
      seriesRef.current = candlestickSeries;

      // Fetch historical data
      fetch(`https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${INTERVAL}&limit=100`)
        .then(res => res.json())
        .then(data => {
          const formattedData = data.map(d => ({
            time: d[0] / 1000,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          }));
          candlestickSeries.setData(formattedData);
        });

      // Connect WebSockets
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${SYMBOL.toLowerCase()}@kline_${INTERVAL}/${SYMBOL.toLowerCase()}@ticker/${SYMBOL.toLowerCase()}@depth20@100ms`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Kline data
        if (data.e === 'kline') {
          const k = data.k;
          candlestickSeries.update({
            time: k.t / 1000,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
          });
        }
        
        // Ticker data
        if (data.e === '24hrTicker') {
          setTicker({
            p: parseFloat(data.c).toFixed(2),
            c: parseFloat(data.p).toFixed(2),
            h: parseFloat(data.h).toFixed(2),
            l: parseFloat(data.l).toFixed(2),
            v: parseFloat(data.v).toFixed(2)
          });
          // Update order input price if it's currently 0
          setPrice(prev => prev === '0.00' ? parseFloat(data.c).toFixed(2) : prev);
        }

        // Depth data
        if (data.lastUpdateId) { // depth payload
          setOrderBook({
            bids: data.bids.slice(0, 15),
            asks: data.asks.slice(0, 15).reverse()
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        ws.close();
        chart.remove();
      };
    }
  }, []);

  const total = (parseFloat(price) * parseFloat(amount || 0)).toFixed(2);

  return (
    <div className="flex flex-col min-h-screen bg-[#03045E] text-[#CAF0F8] font-sans">
      {/* Ticker Header */}
      <div className="flex items-center px-4 py-2 border-b border-[#0077B6] bg-[#020344]">
        <div className="flex items-center space-x-6">
          <div className="text-xl font-bold text-white">BTC/USDT <span className="text-sm font-normal text-[#90E0EF] ml-1">Bitcoin</span></div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[#00B4D8]">{ticker.p}</span>
            <span className="text-xs text-[#90E0EF]">${ticker.p}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[#90E0EF]">24h Change</span>
            <span className={`text-sm font-semibold ${parseFloat(ticker.c) >= 0 ? 'text-[#00B4D8]' : 'text-[#ef5350]'}`}>
              {parseFloat(ticker.c) > 0 ? '+' : ''}{ticker.c}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[#90E0EF]">24h High</span>
            <span className="text-sm font-semibold text-white">{ticker.h}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[#90E0EF]">24h Low</span>
            <span className="text-sm font-semibold text-white">{ticker.l}</span>
          </div>
          <div className="flex flex-col hidden md:flex">
            <span className="text-xs text-[#90E0EF]">24h Vol(BTC)</span>
            <span className="text-sm font-semibold text-white">{ticker.v}</span>
          </div>
        </div>
      </div>

      {/* Main Trading Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left: Chart */}
        <div className="flex-1 border-r border-[#0077B6] flex flex-col">
          <div className="flex items-center px-4 py-2 border-b border-[#0077B6] bg-[#020344] space-x-4 text-sm font-medium">
            <span className="text-[#00B4D8] cursor-pointer">Time</span>
            <span className="text-[#90E0EF] hover:text-white cursor-pointer">1m</span>
            <span className="text-[#90E0EF] hover:text-white cursor-pointer">15m</span>
            <span className="text-[#90E0EF] hover:text-white cursor-pointer">1H</span>
            <span className="text-[#90E0EF] hover:text-white cursor-pointer">4H</span>
            <span className="text-[#90E0EF] hover:text-white cursor-pointer">1D</span>
          </div>
          <div ref={chartContainerRef} className="flex-1 w-full bg-[#03045E]" />
        </div>

        {/* Middle: Order Book */}
        <div className="w-full lg:w-80 border-r border-[#0077B6] bg-[#020344] flex flex-col h-[500px] lg:h-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#0077B6] text-sm font-medium">
            <span>Order Book</span>
          </div>
          <div className="flex px-4 py-2 text-xs text-[#90E0EF]">
            <span className="flex-1">Price(USDT)</span>
            <span className="flex-1 text-right">Amount(BTC)</span>
          </div>
          <div className="flex-1 overflow-y-hidden font-mono text-xs px-2 space-y-0.5">
            {/* Asks */}
            <div className="flex flex-col space-y-0.5 mt-1">
              {orderBook.asks.map((ask, i) => {
                const width = Math.min((parseFloat(ask[1]) / 5) * 100, 100);
                return (
                  <div key={`ask-${i}`} className="flex relative cursor-pointer hover:bg-[#0077B6] px-2" onClick={() => setPrice(parseFloat(ask[0]).toFixed(2))}>
                    <div className="absolute right-0 top-0 bottom-0 bg-[#ef5350] opacity-20" style={{ width: `${width}%` }}></div>
                    <span className="flex-1 text-[#ef5350] z-10">{parseFloat(ask[0]).toFixed(2)}</span>
                    <span className="flex-1 text-right z-10 text-white">{parseFloat(ask[1]).toFixed(4)}</span>
                  </div>
                )
              })}
            </div>
            {/* Current Price */}
            <div className="py-2 px-2 flex items-center justify-center border-y border-[#0077B6] my-1">
              <span className="text-lg font-bold text-[#00B4D8]">{ticker.p}</span>
            </div>
            {/* Bids */}
            <div className="flex flex-col space-y-0.5">
              {orderBook.bids.map((bid, i) => {
                const width = Math.min((parseFloat(bid[1]) / 5) * 100, 100);
                return (
                  <div key={`bid-${i}`} className="flex relative cursor-pointer hover:bg-[#0077B6] px-2" onClick={() => setPrice(parseFloat(bid[0]).toFixed(2))}>
                    <div className="absolute right-0 top-0 bottom-0 bg-[#00B4D8] opacity-20" style={{ width: `${width}%` }}></div>
                    <span className="flex-1 text-[#00B4D8] z-10">{parseFloat(bid[0]).toFixed(2)}</span>
                    <span className="flex-1 text-right z-10 text-white">{parseFloat(bid[1]).toFixed(4)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Order Placement */}
        <div className="w-full lg:w-80 bg-[#020344] flex flex-col p-4">
          <div className="flex space-x-4 text-lg font-bold mb-4">
            <button className={`flex-1 pb-2 ${side === 'Buy' ? 'text-[#00B4D8] border-b-2 border-[#00B4D8]' : 'text-[#90E0EF]'}`} onClick={() => setSide('Buy')}>Buy</button>
            <button className={`flex-1 pb-2 ${side === 'Sell' ? 'text-[#ef5350] border-b-2 border-[#ef5350]' : 'text-[#90E0EF]'}`} onClick={() => setSide('Sell')}>Sell</button>
          </div>
          
          <div className="flex space-x-2 mb-4 bg-[#03045E] border border-[#0077B6] rounded-md p-1">
            {['Limit', 'Market', 'Stop-Limit'].map((type) => (
              <button 
                key={type}
                className={`flex-1 py-1 text-sm rounded ${orderType === type ? 'bg-[#0077B6] text-white' : 'text-[#90E0EF]'}`}
                onClick={() => setOrderType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex justify-between text-xs text-[#90E0EF] mb-2">
            <span>Avail</span>
            <span className="font-mono text-white">0.00 USDT</span>
          </div>

          <div className="space-y-4">
            {orderType !== 'Market' && (
              <div className="flex items-center bg-[#03045E] border border-[#0077B6] rounded-md px-3 py-2 focus-within:border-[#00B4D8]">
                <span className="text-[#90E0EF] text-sm w-16">Price</span>
                <input 
                  type="text" 
                  className="flex-1 bg-transparent text-right text-white font-mono outline-none" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <span className="text-[#90E0EF] text-sm ml-2">USDT</span>
              </div>
            )}
            
            <div className="flex items-center bg-[#03045E] border border-[#0077B6] rounded-md px-3 py-2 focus-within:border-[#00B4D8]">
              <span className="text-[#90E0EF] text-sm w-16">Amount</span>
              <input 
                type="text" 
                className="flex-1 bg-transparent text-right text-white font-mono outline-none" 
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="text-[#90E0EF] text-sm ml-2">BTC</span>
            </div>

            {/* Slider */}
            <div className="px-2">
              <input type="range" className="w-full h-1 bg-[#0077B6] rounded-lg appearance-none cursor-pointer accent-[#00B4D8]" />
              <div className="flex justify-between text-xs text-[#90E0EF] mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {orderType !== 'Market' && (
              <div className="flex items-center bg-[#03045E] border border-[#0077B6] rounded-md px-3 py-2 opacity-70 cursor-not-allowed">
                <span className="text-[#90E0EF] text-sm w-16">Total</span>
                <input type="text" className="flex-1 bg-transparent text-right text-white font-mono outline-none cursor-not-allowed" disabled value={total} />
                <span className="text-[#90E0EF] text-sm ml-2">USDT</span>
              </div>
            )}

            <button className={`w-full py-3 rounded-md font-bold text-white text-lg ${side === 'Buy' ? 'bg-[#00B4D8] hover:bg-opacity-90 text-[#03045E]' : 'bg-[#ef5350] hover:bg-opacity-90'}`}>
              {side === 'Buy' ? 'Buy BTC' : 'Sell BTC'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;

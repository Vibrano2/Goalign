import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

const Futures = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  const [orderType, setOrderType] = useState('Limit');
  const [side, setSide] = useState('Long');
  const [leverage, setLeverage] = useState(20);
  const [marginMode, setMarginMode] = useState('Cross');

  useEffect(() => {
    if (chartContainerRef.current) {
      const handleResize = () => {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      };

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: '#131722' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
        },
        crosshair: { mode: 0 },
        rightPriceScale: { borderColor: 'rgba(197, 203, 206, 0.8)' },
        timeScale: { borderColor: 'rgba(197, 203, 206, 0.8)', timeVisible: true, secondsVisible: false },
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });
      chartRef.current = chart;

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      });

      const data = [
        { time: '2023-10-01', open: 60000, high: 61000, low: 59000, close: 60500 },
        { time: '2023-10-02', open: 60500, high: 62000, low: 60000, close: 61500 },
        { time: '2023-10-03', open: 61500, high: 61800, low: 60200, close: 60800 },
        { time: '2023-10-04', open: 60800, high: 63000, low: 60500, close: 62500 },
        { time: '2023-10-05', open: 62500, high: 64000, low: 62000, close: 63800 },
        { time: '2023-10-06', open: 63800, high: 65000, low: 63000, close: 64500 },
        { time: '2023-10-07', open: 64500, high: 64800, low: 63500, close: 64000 },
      ];
      candlestickSeries.setData(data);

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0e11] text-[#b7bdc6] font-sans">
      {/* Ticker Header */}
      <div className="flex items-center px-4 py-2 border-b border-[#2b3139] bg-[#181a20]">
        <div className="flex items-center space-x-6">
          <div className="text-xl font-bold text-white flex items-center gap-2">
            BTCUSDT <span className="bg-[#fcd535] text-black text-[10px] px-1 rounded font-bold">Perp</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[#2ebd85]">64,231.50</span>
            <span className="text-xs text-[#848e9c]">$64,231.50</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[#848e9c]">Mark Price</span>
            <span className="text-sm font-semibold text-white">64,235.10</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[#848e9c]">Index Price</span>
            <span className="text-sm font-semibold text-white">64,230.90</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[#848e9c]">Funding / Countdown</span>
            <span className="text-sm font-semibold text-[#fcd535]">0.0100% / 03:45:12</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[#848e9c]">24h Change</span>
            <span className="text-sm text-[#2ebd85] font-semibold">+2.45%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Chart & Positions */}
        <div className="flex-1 border-r border-[#2b3139] flex flex-col">
          <div className="flex items-center px-4 py-2 border-b border-[#2b3139] bg-[#181a20] space-x-4 text-sm font-medium">
            <span className="text-[#fcd535] cursor-pointer">Time</span>
            <span className="hover:text-white cursor-pointer">15m</span>
            <span className="hover:text-white cursor-pointer">1H</span>
            <span className="hover:text-white cursor-pointer">4H</span>
            <span className="hover:text-white cursor-pointer">1D</span>
            <span className="hover:text-white cursor-pointer">1W</span>
          </div>
          
          <div ref={chartContainerRef} className="w-full bg-[#131722]" style={{ height: '400px' }} />
          
          {/* Positions & Orders Tabs */}
          <div className="flex-1 bg-[#181a20] flex flex-col border-t border-[#2b3139]">
            <div className="flex space-x-6 px-4 pt-2 border-b border-[#2b3139]">
              <button className="pb-2 text-[#fcd535] border-b-2 border-[#fcd535] font-semibold">Positions (1)</button>
              <button className="pb-2 text-[#848e9c] hover:text-white">Open Orders (0)</button>
              <button className="pb-2 text-[#848e9c] hover:text-white">Order History</button>
              <button className="pb-2 text-[#848e9c] hover:text-white">Trade History</button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {/* Dummy Position Row */}
              <div className="flex justify-between items-center text-sm border border-[#2b3139] rounded-md p-3 bg-[#0b0e11]">
                <div className="flex flex-col gap-1 w-1/5">
                  <span className="text-white font-bold flex items-center gap-2">
                    <span className="w-1 h-3 bg-[#2ebd85]"></span> BTCUSDT
                  </span>
                  <span className="text-[#2ebd85] bg-[#2ebd85]/10 px-1 py-0.5 rounded text-xs w-fit">20x Cross</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#848e9c] text-xs">Size</span>
                  <span className="text-[#2ebd85]">0.500</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#848e9c] text-xs">Entry Price</span>
                  <span className="text-white">63,100.50</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#848e9c] text-xs">Mark Price</span>
                  <span className="text-white">64,235.10</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#848e9c] text-xs">Liq. Price</span>
                  <span className="text-[#f6465d]">54,200.00</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#848e9c] text-xs">Margin Ratio</span>
                  <span className="text-white">4.2%</span>
                </div>
                <div className="flex flex-col gap-1 items-end w-1/5">
                  <span className="text-[#848e9c] text-xs">Unrealized PnL (ROE%)</span>
                  <span className="text-[#2ebd85] font-bold">+567.30 (+17.98%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Order Book */}
        <div className="w-72 border-r border-[#2b3139] bg-[#181a20] flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#2b3139] text-sm font-medium">
            <span>Order Book</span>
          </div>
          <div className="flex px-4 py-2 text-xs text-[#848e9c]">
            <span className="flex-1">Price</span>
            <span className="flex-1 text-right">Size</span>
            <span className="flex-1 text-right">Total</span>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-xs px-4 space-y-1">
            <div className="flex flex-col-reverse space-y-reverse space-y-1">
              {[...Array(12)].map((_, i) => (
                <div key={`ask-${i}`} className="flex relative group cursor-pointer hover:bg-[#2b3139]">
                  <div className="absolute right-0 top-0 bottom-0 bg-[#f6465d] opacity-10" style={{ width: `${Math.random() * 100}%` }}></div>
                  <span className="flex-1 text-[#f6465d]">{(64250 + i * 10).toFixed(1)}</span>
                  <span className="flex-1 text-right">{(Math.random() * 2).toFixed(3)}</span>
                  <span className="flex-1 text-right">{(Math.random() * 10).toFixed(3)}</span>
                </div>
              ))}
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-lg font-bold text-[#2ebd85]">64,231.5</span>
              <span className="text-sm underline decoration-dashed underline-offset-2 decoration-[#848e9c]">64,235.1</span>
            </div>
            <div className="flex flex-col space-y-1">
              {[...Array(12)].map((_, i) => (
                <div key={`bid-${i}`} className="flex relative group cursor-pointer hover:bg-[#2b3139]">
                  <div className="absolute right-0 top-0 bottom-0 bg-[#2ebd85] opacity-10" style={{ width: `${Math.random() * 100}%` }}></div>
                  <span className="flex-1 text-[#2ebd85]">{(64230 - i * 10).toFixed(1)}</span>
                  <span className="flex-1 text-right">{(Math.random() * 2).toFixed(3)}</span>
                  <span className="flex-1 text-right">{(Math.random() * 10).toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order Placement (Futures) */}
        <div className="w-[320px] bg-[#181a20] flex flex-col p-4">
          
          {/* Margin & Leverage Selection */}
          <div className="flex space-x-2 mb-4">
            <button 
              className="flex-1 py-1 text-sm bg-[#2b3139] rounded text-white font-semibold hover:bg-[#474d57]"
              onClick={() => setMarginMode(marginMode === 'Cross' ? 'Isolated' : 'Cross')}
            >
              {marginMode}
            </button>
            <button 
              className="flex-1 py-1 text-sm bg-[#2b3139] rounded text-white font-semibold hover:bg-[#474d57]"
              onClick={() => setLeverage(leverage === 20 ? 50 : 20)}
            >
              {leverage}x
            </button>
          </div>

          <div className="flex space-x-4 text-base font-bold mb-4 border-b border-[#2b3139]">
            <button className={`pb-2 ${side === 'Long' ? 'text-[#2ebd85] border-b-2 border-[#2ebd85]' : 'text-[#848e9c]'}`} onClick={() => setSide('Long')}>Open Long</button>
            <button className={`pb-2 ${side === 'Short' ? 'text-[#f6465d] border-b-2 border-[#f6465d]' : 'text-[#848e9c]'}`} onClick={() => setSide('Short')}>Open Short</button>
          </div>
          
          <div className="flex space-x-2 mb-4 bg-[#2b3139] rounded p-1">
            {['Limit', 'Market', 'Stop'].map((type) => (
              <button 
                key={type}
                className={`flex-1 py-1 text-xs rounded ${orderType === type ? 'bg-[#474d57] text-white' : 'text-[#848e9c]'}`}
                onClick={() => setOrderType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex justify-between text-xs text-[#848e9c] mb-2">
            <span>Avail</span>
            <span className="font-mono text-white">1,250.00 USDT</span>
          </div>

          <div className="space-y-4">
            {orderType !== 'Market' && (
              <div className="flex items-center bg-[#2b3139] rounded px-3 py-2 border border-transparent focus-within:border-[#fcd535]">
                <span className="text-[#848e9c] text-xs w-12">Price</span>
                <input type="text" className="flex-1 bg-transparent text-right text-white font-mono text-sm outline-none" defaultValue="64231.50" />
                <span className="text-[#848e9c] text-xs ml-2">USDT</span>
              </div>
            )}
            
            <div className="flex items-center bg-[#2b3139] rounded px-3 py-2 border border-transparent focus-within:border-[#fcd535]">
              <span className="text-[#848e9c] text-xs w-12">Size</span>
              <input type="text" className="flex-1 bg-transparent text-right text-white font-mono text-sm outline-none" placeholder="0.000" />
              <span className="text-[#848e9c] text-xs ml-2">BTC</span>
            </div>

            {/* Slider */}
            <div className="px-2 pt-2">
              <input type="range" className="w-full h-1 bg-[#474d57] rounded-lg appearance-none cursor-pointer" />
              <div className="flex justify-between text-[10px] text-[#848e9c] mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <input type="checkbox" id="tp-sl" className="rounded bg-[#2b3139] border-none text-[#fcd535] focus:ring-0 cursor-pointer" />
              <label htmlFor="tp-sl" className="text-xs text-[#848e9c] cursor-pointer">TP/SL</label>
            </div>

            <div className="space-y-1 mt-4">
              <div className="flex justify-between text-xs text-[#848e9c]">
                <span>Cost</span>
                <span className="text-white">0.00 USDT</span>
              </div>
              <div className="flex justify-between text-xs text-[#848e9c]">
                <span>Max</span>
                <span className="text-white">0.000 BTC</span>
              </div>
            </div>

            <div className="pt-2">
              <button className={`w-full py-3 rounded font-bold text-white text-sm ${side === 'Long' ? 'bg-[#2ebd85] hover:bg-[#26a69a]' : 'bg-[#f6465d] hover:bg-[#ef5350]'}`}>
                {side === 'Long' ? 'Buy / Long' : 'Sell / Short'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Futures;

import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, AreaSeries, BarSeries, BaselineSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { toZonedTime } from 'date-fns-tz';
import useAuthStore from '../store/useAuthStore';
import { AVAILABLE_SYMBOLS } from '../utils/symbols';
import { API_BASE_URL } from '../utils/api';
const SPOT_SYMBOLS = AVAILABLE_SYMBOLS.filter(sym => !sym.includes('-') && !sym.endsWith('PERP'));

const INTERVAL = '1'; // Bybit uses '1' instead of '1m'

function timeToTz(originalTime, timeZone) {
    const zonedDate = toZonedTime(new Date(originalTime * 1000), timeZone);
    return zonedDate.getTime() / 1000;
}

const Trade = () => {
  const chartContainerRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const chartRef = useRef(null);
  const volumeChartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const markersRef = useRef([]);
  const priceLinesRef = useRef([]);
  const wsRef = useRef(null);

  const [symbol, setSymbol] = useState(SPOT_SYMBOLS.includes('BTCUSDT') ? 'BTCUSDT' : (SPOT_SYMBOLS[0] || 'BTCUSDT'));
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);

  const [chartType, setChartType] = useState('Candles'); // 'Candles', 'Area', 'Bars', 'Baseline', 'Histogram', 'Line'
  const [orderType, setOrderType] = useState('Limit');
  const [side, setSide] = useState('Buy');
  const [price, setPrice] = useState('0.00');
  const [amount, setAmount] = useState('');
  
  const [ticker, setTicker] = useState({ p: '0.00', c: '0.00', h: '0.00', l: '0.00', v: '0.00' });
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });

  const { user } = useAuthStore();
  const [balances, setBalances] = useState({ USDT: 0, BTC: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sliderValue, setSliderValue] = useState(0);

  const fetchBalances = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/wallet/balances/${user.uid}`);
      const data = await res.json();
      if (res.ok && data.balances) {
        const newBalances = { USDT: 0, BTC: 0 };
        data.balances.forEach(b => {
          if (b.account_type === 'spot') {
            if (b.asset === 'USDT') newBalances.USDT = parseFloat(b.available);
            if (b.asset === 'BTC') newBalances.BTC = parseFloat(b.available);
          }
        });
        setBalances(newBalances);
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [user]);

  const handleSliderChange = (e) => {
    const percentage = parseFloat(e.target.value);
    setSliderValue(percentage);
    
    const currentPrice = orderType === 'Market' ? parseFloat(ticker.p) : parseFloat(price);
    
    if (side === 'Buy') {
      if (currentPrice > 0 && balances.USDT > 0) {
        const maxBuyAmount = balances.USDT / currentPrice;
        setAmount(((percentage / 100) * maxBuyAmount).toFixed(6));
      } else {
        setAmount('');
      }
    } else {
      if (balances.BTC > 0) {
        setAmount(((percentage / 100) * balances.BTC).toFixed(6));
      } else {
        setAmount('');
      }
    }
  };

  // Keep total updated (handled in render)

  const handlePlaceOrder = async () => {
    if (!user) {
      setMessage('Please login first');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Enter a valid amount');
      return;
    }
    
    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/trade/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          symbol: symbol,
          side: side.toLowerCase(),
          type: orderType.toLowerCase(),
          price: orderType === 'Market' ? 0 : parseFloat(price),
          amount: parseFloat(amount)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Order placed successfully!`);
        fetchBalances();
        setAmount('');
        
        // Add a marker for the newly placed trade!
        if (seriesRef.current) {
           const currentTime = Math.floor(Date.now() / 1000);
           const tzTime = timeToTz(currentTime, 'America/New_York');
           const isBuy = side === 'Buy';
           const executionPrice = orderType === 'Market' ? ticker.p : price;
           
           const newMarker = {
              time: tzTime,
              position: isBuy ? 'belowBar' : 'aboveBar',
              color: isBuy ? '#22c55e' : '#ef4444',
              shape: isBuy ? 'arrowUp' : 'arrowDown',
              text: `${isBuy ? 'Buy' : 'Sell'} @ ${executionPrice}`
           };
           
           markersRef.current = [...markersRef.current, newMarker].sort((a, b) => a.time - b.time);
           if (typeof seriesRef.current.setMarkers === 'function') {
               seriesRef.current.setMarkers(markersRef.current);
           }

           // Create Horizontal Price Line
           const newLineOptions = {
               price: parseFloat(executionPrice),
               color: isBuy ? '#22c55e' : '#ef4444',
               lineWidth: 2,
               lineStyle: 0, // Solid
               axisLabelVisible: true,
               title: isBuy ? 'Buy Entry' : 'Sell Entry',
           };
           priceLinesRef.current.push(newLineOptions);
           seriesRef.current.createPriceLine(newLineOptions);
        }
      } else {
        setMessage(data.error || 'Failed to place order');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Chart setup & WebSocket
  useEffect(() => {
    if (chartContainerRef.current) {
      const handleResize = () => {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      };

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: '#ffffff' },
          textColor: '#64748b',
        },
        grid: {
          vertLines: { color: '#f8fafc' },
          horzLines: { color: '#f8fafc' },
        },
        crosshair: { mode: 0 },
        rightPriceScale: { borderColor: '#e2e8f0' },
        timeScale: { borderColor: '#e2e8f0', timeVisible: true },
        width: chartContainerRef.current.clientWidth,
        height: 350,
      });
      
      // Create Volume Sub-chart
      const volumeChart = createChart(volumeContainerRef.current, {
        layout: { background: { type: 'solid', color: '#ffffff' }, textColor: '#64748b' },
        grid: { vertLines: { color: '#f8fafc' }, horzLines: { color: '#f8fafc' } },
        crosshair: { mode: 0 },
        rightPriceScale: { borderColor: '#e2e8f0', scaleMargins: { top: 0.1, bottom: 0 } },
        timeScale: { borderColor: '#e2e8f0', timeVisible: true },
        width: volumeContainerRef.current.clientWidth,
        height: 150,
      });
      const volumeSeries = volumeChart.addSeries(HistogramSeries, {
          color: '#26a69a',
          priceFormat: { type: 'volume' },
      });
      
      volumeChartRef.current = volumeChart;
      volumeSeriesRef.current = volumeSeries;

      // Two-way TimeScale Synchronization
      function syncVolumeToMain(logicalRange) {
          if (logicalRange) {
              volumeChart.timeScale().setVisibleLogicalRange(logicalRange);
          }
      }
      function syncMainToVolume(logicalRange) {
          if (logicalRange) {
              chart.timeScale().setVisibleLogicalRange(logicalRange);
          }
      }
      chart.timeScale().subscribeVisibleLogicalRangeChange(syncVolumeToMain);
      volumeChart.timeScale().subscribeVisibleLogicalRangeChange(syncMainToVolume);

      // Create Tooltip DOM Element
      const toolTip = document.createElement('div');
      toolTip.style = `position: absolute; display: none; z-index: 50; pointer-events: none; background: white; border: 1px solid #eff6ff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 0.75rem; padding: 0.75rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.875rem; min-width: 130px;`;
      chartContainerRef.current.appendChild(toolTip);

      chart.subscribeCrosshairMove((param) => {
        if (!param.time || param.point.x < 0 || param.point.x > chartContainerRef.current.clientWidth || param.point.y < 0 || param.point.y > 500) {
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
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid #eff6ff;">${symbol}</div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">O</span> <span style="color: #0f172a;">${open.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">H</span> <span style="color: #0f172a;">${high.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">L</span> <span style="color: #0f172a;">${low.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span style="color: #64748b;">C</span> <span style="color: ${price >= open ? '#22c55e' : '#ef4444'}; font-weight: bold;">${price.toFixed(2)}</span>
          </div>
        `;

        let x = param.point.x + 15;
        let y = param.point.y + 15;
        
        // prevent tooltip from going off-screen on the right/bottom
        const chartWidth = chartContainerRef.current.clientWidth;
        const chartHeight = 500; // Fixed chart height in JSX
        
        if (x > chartWidth - 150) x = Math.max(0, param.point.x - 150);
        if (y > chartHeight - 150) y = Math.max(0, param.point.y - 120);
        
        toolTip.style.left = x + 'px';
        toolTip.style.top = y + 'px';
      });

      // Removed invalid removeSeries call since chart is recreated

      let series;
      if (chartType === 'Candles') {
        series = chart.addSeries(CandlestickSeries, {
          upColor: 'red',
          downColor: 'blue',
          borderVisible: false,
          wickUpColor: 'red',
          wickDownColor: 'blue',
        });
      } else if (chartType === 'Bars') {
        series = chart.addSeries(BarSeries, {
          upColor: '#26a69a',
          downColor: '#ef5350',
        });
      } else if (chartType === 'Baseline') {
        series = chart.addSeries(BaselineSeries, {
          topLineColor: 'rgba(38, 166, 154, 1)', 
          topFillColor1: 'rgba(38, 166, 154, 0.28)', 
          topFillColor2: 'rgba(38, 166, 154, 0.05)', 
          bottomLineColor: 'rgba(239, 83, 80, 1)', 
          bottomFillColor1: 'rgba(239, 83, 80, 0.05)', 
          bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
          lineWidth: 2,
        });
      } else if (chartType === 'Histogram') {
        series = chart.addSeries(HistogramSeries, {
          color: '#26a69a',
        });
      } else if (chartType === 'Line') {
        series = chart.addSeries(LineSeries, {
          color: '#2962FF',
          lineWidth: 2,
        });
      } else {
        series = chart.addSeries(AreaSeries, {
          lineColor: '#2962FF', 
          topColor: '#2962FF',
          bottomColor: 'rgba(41, 98, 255, 0.28)',
          lineWidth: 2,
        });
      }
      
      seriesRef.current = series;

      // Fetch historical data from Bybit via Vite proxy
      fetch(`/bybit-api/v5/market/kline?category=spot&symbol=${symbol}&interval=${INTERVAL}&limit=200`)
        .then(res => res.json())
        .then(resData => {
          const data = (resData.retCode === 0 && resData.result.list) ? [...resData.result.list].reverse() : [];
          
          if (chartType === 'Baseline' && data.length > 0) {
            series.applyOptions({
              baseValue: { type: 'price', price: parseFloat(data[0][4]) }
            });
          }

          const formattedData = data.map(d => {
            const rawTime = parseInt(d[0]) / 1000;
            const time = timeToTz(rawTime, 'America/New_York');
            const open = parseFloat(d[1]);
            const close = parseFloat(d[4]);
            
            if (chartType === 'Area' || chartType === 'Baseline' || chartType === 'Line') {
              return { time, value: close };
            } else if (chartType === 'Histogram') {
              return { 
                time, 
                value: parseFloat(d[5]), // Volume
                color: close >= open ? '#26a69a' : '#ef5350'
              };
            }
            return {
              time,
              open,
              high: parseFloat(d[2]),
              low: parseFloat(d[3]),
              close,
            };
          });

          series.setData(formattedData);
          
          const volumeData = data.map(d => {
             const rawTime = d[0] / 1000;
             const time = timeToTz(rawTime, 'America/New_York');
             const open = parseFloat(d[1]);
             const close = parseFloat(d[4]);
             return {
                 time,
                 value: parseFloat(d[5]),
                 color: close >= open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
             };
          });
          volumeSeries.setData(volumeData);
          
          // Generate some random historical trade markers on initial load
          if (markersRef.current.length === 0) {
              const generatedMarkers = [];
              for (let i = 15; i < formattedData.length - 5; i += Math.floor(Math.random() * 20) + 10) {
                 const isBuy = Math.random() > 0.5;
                 generatedMarkers.push({
                     time: formattedData[i].time,
                     position: isBuy ? 'belowBar' : 'aboveBar',
                     color: isBuy ? '#22c55e' : '#ef4444',
                     shape: isBuy ? 'arrowUp' : 'arrowDown',
                     text: isBuy ? 'Buy @ ' + formattedData[i].close : 'Sell @ ' + formattedData[i].close,
                 });
              }
              markersRef.current = generatedMarkers;
          }
          if (typeof series.setMarkers === 'function') {
              series.setMarkers(markersRef.current);
          }

          // Generate Support/Resistance Price Lines
          if (priceLinesRef.current.length === 0 && formattedData.length > 0) {
              const lastClose = formattedData[formattedData.length - 1].close;
              priceLinesRef.current.push({
                  price: lastClose * 1.002,
                  color: '#ef4444',
                  lineWidth: 2,
                  lineStyle: 2, // Dashed
                  axisLabelVisible: true,
                  title: 'Resistance',
              });
              priceLinesRef.current.push({
                  price: lastClose * 0.998,
                  color: '#22c55e',
                  lineWidth: 2,
                  lineStyle: 2, // Dashed
                  axisLabelVisible: true,
                  title: 'Support',
              });
          }
          priceLinesRef.current.forEach(options => {
              series.createPriceLine(options);
          });
          
          chart.timeScale().fitContent();
        });

      // Connect WebSockets for Ticker and Klines via Vite proxy
      if (wsRef.current) wsRef.current.close();
      
      const ws = new WebSocket('wss://stream.bybit.com/v5/public/spot');
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          "op": "subscribe",
          "args": [
            `kline.${INTERVAL}.${symbol}`,
            `tickers.${symbol}`,
            `orderbook.50.${symbol}`
          ]
        }));
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        
        // Kline data
        if (payload.topic === `kline.${INTERVAL}.${symbol}`) {
          const klines = payload.data;
          klines.forEach(k => {
            const rawTime = parseInt(k.start) / 1000;
            const time = timeToTz(rawTime, 'America/New_York');
            const close = parseFloat(k.close);
            const open = parseFloat(k.open);
            
            if (chartType === 'Area' || chartType === 'Baseline' || chartType === 'Line') {
              series.update({
                time: time,
                value: close,
              });
            } else if (chartType === 'Histogram') {
              series.update({
                time: time,
                value: parseFloat(k.volume),
                color: close >= open ? '#26a69a' : '#ef5350'
              });
            } else {
              series.update({
                time: time,
                open,
                high: parseFloat(k.high),
                low: parseFloat(k.low),
                close,
              });
            }
            
            volumeSeries.update({
               time: time,
               value: parseFloat(k.volume),
               color: close >= open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
            });
          });
        }
        
        // Ticker data
        if (payload.topic === `tickers.${symbol}`) {
          const d = payload.data;
          setTicker(prev => {
            const newP = d.lastPrice ? parseFloat(d.lastPrice).toFixed(2) : prev.p;
            if (prev.p !== newP && price === '0.00') {
               setPrice(newP);
            }
            return {
              p: newP,
              c: d.price24hPcnt ? (parseFloat(d.price24hPcnt) * 100).toFixed(2) : prev.c,
              h: d.highPrice24h ? parseFloat(d.highPrice24h).toFixed(2) : prev.h,
              l: d.lowPrice24h ? parseFloat(d.lowPrice24h).toFixed(2) : prev.l,
              v: d.volume24h ? parseFloat(d.volume24h).toFixed(2) : prev.v
            };
          });
        }

        // Depth data
        if (payload.topic === `orderbook.50.${symbol}`) {
          const d = payload.data;
          setOrderBook(prev => ({
            bids: d.b && d.b.length > 0 ? d.b.slice(0, 15) : prev.bids,
            asks: d.a && d.a.length > 0 ? [...d.a].reverse().slice(0, 15) : prev.asks
          }));
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (wsRef.current) wsRef.current.close();
        if (toolTip && toolTip.parentNode) {
            toolTip.parentNode.removeChild(toolTip);
        }
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
        if (volumeChartRef.current) {
          volumeChartRef.current.remove();
          volumeChartRef.current = null;
        }
      };
    }
  }, [chartType, symbol]); // Re-run effect when symbol changes

  const total = (parseFloat(price) * parseFloat(amount || 0)).toFixed(2);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background text-primary font-sans p-4">
      <div className="container mx-auto max-w-7xl bg-white rounded-2xl shadow-sm border border-blue-50 overflow-visible flex flex-col">
        {/* Ticker Header */}
        <div className="flex flex-wrap gap-6 items-center px-6 py-4 border-b border-blue-50 bg-white relative z-50">
          <div className="flex items-center space-x-6 relative">
            <div 
              className="text-xl font-bold text-primary cursor-pointer hover:opacity-80 transition group flex items-center"
              onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
            >
              {symbol}
              <svg className={`ml-1 w-4 h-4 text-gray-400 transition-transform ${showSymbolDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            
            {showSymbolDropdown && (
              <div className="absolute top-full mt-2 left-0 w-48 bg-white border border-blue-100 rounded-md shadow-2xl z-[100] max-h-96 overflow-y-auto">
                {SPOT_SYMBOLS.map(sym => (
                  <div 
                    key={sym} 
                    className={`px-4 py-2 cursor-pointer hover:bg-blue-50 font-bold transition ${symbol === sym ? 'text-accent bg-blue-50' : 'text-primary'}`}
                    onClick={() => {
                      setSymbol(sym);
                      setTicker({ p: '0.00', c: '0.00', h: '0.00', l: '0.00', v: '0.00' });
                      setPrice('0.00');
                      setShowSymbolDropdown(false);
                    }}
                  >
                    {sym}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">{ticker.p}</span>
              <span className="text-xs text-secondary">${ticker.p}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-secondary">24h Change</span>
              <span className={`text-sm font-semibold ${parseFloat(ticker.c) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {parseFloat(ticker.c) > 0 ? '+' : ''}{ticker.c}
              </span>
            </div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-xs text-secondary">24h High</span>
              <span className="text-sm font-semibold text-primary">{ticker.h}</span>
            </div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-xs text-secondary">24h Low</span>
              <span className="text-sm font-semibold text-primary">{ticker.l}</span>
            </div>
            <div className="flex flex-col hidden md:flex">
              <span className="text-xs text-secondary">24h Vol(BTC)</span>
              <span className="text-sm font-semibold text-primary">{ticker.v}</span>
            </div>
          </div>
        </div>

        {/* Main Trading Area */}
        <div className="flex flex-col xl:flex-row flex-1">
          {/* Left: Chart */}
          <div className="flex-1 border-b xl:border-b-0 xl:border-r border-blue-50 flex flex-col min-h-[500px]">
            <div className="flex overflow-x-auto hide-scrollbar whitespace-nowrap items-center px-6 py-3 border-b border-blue-50 bg-white space-x-4">
              <div className="flex items-center space-x-4 text-sm font-medium shrink-0">
                <span className="text-accent font-semibold cursor-pointer border-b-2 border-accent pb-1">Time</span>
                <span className="text-secondary hover:text-primary transition-colors cursor-pointer pb-1">1m</span>
                <span className="text-secondary hover:text-primary transition-colors cursor-pointer pb-1">15m</span>
                <span className="text-secondary hover:text-primary transition-colors cursor-pointer pb-1">1H</span>
                <span className="text-secondary hover:text-primary transition-colors cursor-pointer pb-1">4H</span>
                <span className="text-secondary hover:text-primary transition-colors cursor-pointer pb-1">1D</span>
              </div>
              <div className="flex space-x-2 bg-gray-50 rounded-lg p-1 border border-blue-50">
                {['Candles', 'Area', 'Bars', 'Baseline', 'Histogram', 'Line'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${chartType === type ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => {
                  if (chartRef.current) {
                    chartRef.current.timeScale().resetTimeScale();
                  }
                }}
                className="px-3 py-1 text-xs font-semibold rounded-md bg-gray-50 border border-blue-50 text-secondary hover:text-primary hover:bg-gray-100 transition-colors ml-2"
              >
                Reset View
              </button>
              <button 
                onClick={() => {
                  if (chartRef.current) {
                    const vr = chartRef.current.timeScale().getVisibleLogicalRange();
                    if (vr) chartRef.current.timeScale().setVisibleLogicalRange({ from: vr.from + 2, to: vr.to - 2 });
                  }
                }}
                className="px-3 py-1 text-xs font-semibold rounded-md bg-gray-50 border border-blue-50 text-secondary hover:text-primary hover:bg-gray-100 transition-colors ml-2"
              >
                Zoom In
              </button>
              <button 
                onClick={() => {
                  if (chartRef.current) {
                    const vr = chartRef.current.timeScale().getVisibleLogicalRange();
                    if (vr) chartRef.current.timeScale().setVisibleLogicalRange({ from: vr.from - 2, to: vr.to + 2 });
                  }
                }}
                className="px-3 py-1 text-xs font-semibold rounded-md bg-gray-50 border border-blue-50 text-secondary hover:text-primary hover:bg-gray-100 transition-colors ml-2"
              >
                Zoom Out
              </button>
            </div>
            <div className="flex flex-col flex-1 relative">
                <div ref={chartContainerRef} className="w-full bg-white relative" style={{ height: '350px' }} />
                <div ref={volumeContainerRef} className="w-full bg-white relative border-t border-blue-50" style={{ height: '150px' }} />
            </div>
          </div>

          {/* Middle: Order Book */}
          <div className="w-full xl:w-80 border-b xl:border-b-0 xl:border-r border-blue-50 bg-white flex flex-col h-[400px] xl:h-auto">
            <div className="flex items-center justify-between px-6 py-3 border-b border-blue-50 text-sm font-semibold text-primary">
              <span>Order Book</span>
            </div>
            <div className="flex px-6 py-2 text-xs text-secondary font-medium uppercase tracking-wider bg-gray-50/50">
              <span className="flex-1">Price(USDT)</span>
              <span className="flex-1 text-right">Amount(BTC)</span>
            </div>
            <div className="flex-1 overflow-y-hidden font-mono text-xs px-4 space-y-0.5">
              {/* Asks */}
              <div className="flex flex-col justify-end space-y-0.5 mt-2 h-[calc(50%-2rem)]">
                {orderBook.asks.map((ask, i) => {
                  const width = Math.min((parseFloat(ask[1]) / 5) * 100, 100);
                  return (
                    <div key={`ask-${i}`} className="flex relative cursor-pointer hover:bg-red-50/50 px-2 py-0.5 rounded transition-colors" onClick={() => setPrice(parseFloat(ask[0]).toFixed(2))}>
                      <div className="absolute right-0 top-0 bottom-0 bg-red-100 opacity-40 rounded-r" style={{ width: `${width}%` }}></div>
                      <span className="flex-1 text-red-500 z-10 font-semibold">{parseFloat(ask[0]).toFixed(2)}</span>
                      <span className="flex-1 text-right z-10 text-gray-600">{parseFloat(ask[1]).toFixed(4)}</span>
                    </div>
                  )
                })}
              </div>
              {/* Current Price */}
              <div className="py-3 px-2 flex items-center justify-center border-y border-blue-50 my-2 bg-blue-50/30 rounded-lg">
                <span className="text-xl font-bold text-primary">{ticker.p}</span>
                <span className={`ml-2 text-sm ${parseFloat(ticker.c) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseFloat(ticker.c) > 0 ? '↑' : '↓'}
                </span>
              </div>
              {/* Bids */}
              <div className="flex flex-col space-y-0.5 h-[calc(50%-2rem)]">
                {orderBook.bids.map((bid, i) => {
                  const width = Math.min((parseFloat(bid[1]) / 5) * 100, 100);
                  return (
                    <div key={`bid-${i}`} className="flex relative cursor-pointer hover:bg-green-50/50 px-2 py-0.5 rounded transition-colors" onClick={() => setPrice(parseFloat(bid[0]).toFixed(2))}>
                      <div className="absolute right-0 top-0 bottom-0 bg-green-100 opacity-40 rounded-r" style={{ width: `${width}%` }}></div>
                      <span className="flex-1 text-green-500 z-10 font-semibold">{parseFloat(bid[0]).toFixed(2)}</span>
                      <span className="flex-1 text-right z-10 text-gray-600">{parseFloat(bid[1]).toFixed(4)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: Order Placement */}
          <div className="w-full xl:w-96 bg-white flex flex-col p-6">
            <div className="flex bg-blue-50/50 rounded-xl p-1 mb-6">
              <button className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all shadow-sm ${side === 'Buy' ? 'bg-white text-green-500 border border-blue-100' : 'text-secondary hover:bg-white/50'}`} onClick={() => setSide('Buy')}>Buy</button>
              <button className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all shadow-sm ${side === 'Sell' ? 'bg-white text-red-500 border border-blue-100' : 'text-secondary hover:bg-white/50'}`} onClick={() => setSide('Sell')}>Sell</button>
            </div>
            
            <div className="flex space-x-2 mb-6">
              {['Limit', 'Market', 'Stop'].map((type) => (
                <button 
                  key={type}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors border ${orderType === type ? 'bg-primary text-white border-primary' : 'bg-white text-secondary border-blue-100 hover:border-blue-200'}`}
                  onClick={() => setOrderType(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-secondary mb-3 font-medium">
              <span>Available</span>
              <span className="font-mono text-primary font-bold">
                {side === 'Buy' ? `${balances.USDT.toFixed(2)} USDT` : `${balances.BTC.toFixed(6)} BTC`}
              </span>
            </div>

            <div className="space-y-4">
              {orderType !== 'Market' && (
                <div className="flex items-center bg-white border border-blue-100 rounded-xl px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                  <span className="text-secondary text-sm font-medium w-16">Price</span>
                  <input 
                    type="text" 
                    className="flex-1 bg-transparent text-right text-primary font-mono font-semibold outline-none" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <span className="text-secondary text-sm font-medium ml-3">USDT</span>
                </div>
              )}
              
              <div className="flex items-center bg-white border border-blue-100 rounded-xl px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                <span className="text-secondary text-sm font-medium w-16">Amount</span>
                <input 
                  type="text" 
                  className="flex-1 bg-transparent text-right text-primary font-mono font-semibold outline-none" 
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="text-secondary text-sm font-medium ml-3">{symbol.replace('USDT', '')}</span>
              </div>

              {/* Slider */}
              <div className="px-2 pt-2 pb-4">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={sliderValue} 
                  onChange={handleSliderChange}
                  className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-accent" 
                />
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {orderType !== 'Market' && (
                <div className="flex items-center bg-gray-50 border border-blue-50 rounded-xl px-4 py-3">
                  <span className="text-secondary text-sm font-medium w-16">Total</span>
                  <input type="text" className="flex-1 bg-transparent text-right text-primary font-mono font-semibold outline-none cursor-not-allowed" disabled value={total} />
                  <span className="text-secondary text-sm font-medium ml-3">USDT</span>
                </div>
              )}

              {message && (
                <div className={`text-sm text-center py-2 px-4 rounded-lg font-medium border ${message.includes('success') ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  {message}
                </div>
              )}

              <button 
                onClick={handlePlaceOrder}
                disabled={isLoading}
                className={`w-full mt-2 py-4 rounded-xl font-extrabold text-white text-lg transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${side === 'Buy' ? 'bg-green-500 hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-red-500 hover:bg-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]'}`}
              >
                {isLoading ? 'Processing...' : (side === 'Buy' ? `Buy ${symbol.replace('USDT', '')}` : `Sell ${symbol.replace('USDT', '')}`)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;

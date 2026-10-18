import React, { useEffect, useRef } from 'react';
import { createYieldCurveChart, LineSeries } from 'lightweight-charts';

export default function Yields() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartContainerRef.current) {
      // Create the new Yield Curve Chart
      const chart = createYieldCurveChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: '#ffffff' },
          textColor: '#64748b',
        },
        yieldCurve: { baseResolution: 1, minimumTimeRange: 10, startTimeRange: 3 },
        handleScroll: false, 
        handleScale: false,
        grid: {
          vertLines: { color: '#f8fafc' },
          horzLines: { color: '#f8fafc' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
      });

      chartRef.current = chart;

      // Add a Line Series for the Yield Curve
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#2962FF',
        lineWidth: 3,
        crosshairMarkerVisible: true,
      });

      // Sample Treasury Yield Curve Data (Maturity vs Yield)
      const data = [
        { time: 1, value: 5.378 }, 
        { time: 2, value: 5.372 }, 
        { time: 3, value: 5.271 }, 
        { time: 6, value: 5.094 }, 
        { time: 12, value: 4.739 }, 
        { time: 24, value: 4.237 }, 
        { time: 36, value: 4.036 }, 
        { time: 60, value: 3.887 }, 
        { time: 84, value: 3.921 }, 
        { time: 120, value: 4.007 }, 
        { time: 240, value: 4.366 }, 
        { time: 360, value: 4.290 }
      ];

      lineSeries.setData(data);
      chart.timeScale().fitContent();

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

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background text-primary font-sans p-4">
      <div className="container mx-auto max-w-7xl bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden flex flex-col p-6">
        <h1 className="text-2xl font-bold text-primary mb-2">Treasury Yield Curve</h1>
        <p className="text-secondary mb-6">Visualizing Interest Rates vs. Maturities</p>
        <div ref={chartContainerRef} className="w-full h-[500px]" />
      </div>
    </div>
  );
}

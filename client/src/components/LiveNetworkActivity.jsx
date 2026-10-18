import React, { useState, useEffect } from 'react';
import { Activity, ArrowRightLeft, DollarSign, Lock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const mockEvents = [
  { id: 1, type: 'trade', text: 'User 0x7A...4b2 bought 2.5 ETH', time: 'Just now', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-100' },
  { id: 2, type: 'transfer', text: 'Large Transfer: 1,000,000 USDT on Tron', time: '2 mins ago', icon: ArrowRightLeft, color: 'text-blue-500', bg: 'bg-blue-100' },
  { id: 3, type: 'stake', text: 'New Staking: User 0x1F...9c3 staked 500 SOL', time: '5 mins ago', icon: Lock, color: 'text-purple-500', bg: 'bg-purple-100' },
  { id: 4, type: 'liquidity', text: 'Liquidity Added: 10 BTC to BTC/USDT', time: '12 mins ago', icon: DollarSign, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  { id: 5, type: 'trade', text: 'User 0x4D...1a9 sold 150 AVAX', time: '15 mins ago', icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-100' }
];

const generateRandomEvent = (id) => {
  const types = ['trade', 'transfer', 'stake', 'liquidity'];
  const type = types[Math.floor(Math.random() * types.length)];
  const hash = '0x' + Math.floor(Math.random()*16777215).toString(16).toUpperCase() + '...' + Math.floor(Math.random()*4095).toString(16).toLowerCase();
  
  switch(type) {
    case 'trade':
      const coins = ['BTC', 'ETH', 'SOL', 'AVAX', 'ADA'];
      const coin = coins[Math.floor(Math.random() * coins.length)];
      const amt = (Math.random() * 10).toFixed(2);
      const isBuy = Math.random() > 0.5;
      return { 
        id, type, 
        text: `User ${hash} ${isBuy ? 'bought' : 'sold'} ${amt} ${coin}`, 
        time: 'Just now', 
        icon: TrendingUp, 
        color: isBuy ? 'text-green-500' : 'text-red-500', 
        bg: isBuy ? 'bg-green-100' : 'bg-red-100' 
      };
    case 'transfer':
      return { id, type, text: `Large Transfer: ${(Math.random() * 500000 + 100000).toLocaleString('en-US', {maximumFractionDigits:0})} USDT`, time: 'Just now', icon: ArrowRightLeft, color: 'text-blue-500', bg: 'bg-blue-100' };
    case 'stake':
      return { id, type, text: `New Staking: User ${hash} staked ${(Math.random() * 1000).toFixed(0)} ADA`, time: 'Just now', icon: Lock, color: 'text-purple-500', bg: 'bg-purple-100' };
    case 'liquidity':
      return { id, type, text: `Liquidity Added: ${(Math.random() * 50).toFixed(1)} ETH to pool`, time: 'Just now', icon: DollarSign, color: 'text-yellow-500', bg: 'bg-yellow-100' };
    default:
      return mockEvents[0];
  }
};

const LiveNetworkActivity = () => {
  const [events, setEvents] = useState(mockEvents);

  useEffect(() => {
    let counter = 6;
    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvent = generateRandomEvent(counter++);
        return [newEvent, ...prev.slice(0, 4)]; // Keep 5 events
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-blue-50 flex items-center justify-between bg-blue-50/30">
        <div className="flex items-center space-x-2">
          <Activity className="text-accent" size={20} />
          <h3 className="font-bold text-lg text-primary">Live Activity</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-xs text-secondary font-medium uppercase tracking-wider hidden sm:inline">Live</span>
        </div>
      </div>
      
      <div className="p-0 flex-1 overflow-hidden">
        <ul className="divide-y divide-blue-50">
          <AnimatePresence initial={false}>
            {events.map((event) => {
              const Icon = event.icon;
              return (
                <motion.li 
                  key={event.id} 
                  initial={{ opacity: 0, y: -20, backgroundColor: '#f0fdf4' }}
                  animate={{ opacity: 1, y: 0, backgroundColor: '#ffffff' }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="p-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${event.bg}`}>
                      <Icon className={event.color} size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary line-clamp-1">{event.text}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{event.time}</p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
      <div className="p-3 border-t border-blue-50 bg-gray-50 text-center mt-auto">
        <button className="text-sm font-medium text-accent hover:text-opacity-80 transition">
          View Block Explorer
        </button>
      </div>
    </div>
  );
};

export default LiveNetworkActivity;

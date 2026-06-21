import React, { useState } from 'react';

const Earn = () => {
  const [activeTab, setActiveTab] = useState('All');

  const products = [
    { coin: 'USDT', name: 'Tether', type: 'Flexible', apy: '8.50%', min: '10 USDT', popular: true },
    { coin: 'BTC', name: 'Bitcoin', type: 'Fixed - 30 Days', apy: '4.20%', min: '0.01 BTC', popular: false },
    { coin: 'BTC', name: 'Bitcoin', type: 'Fixed - 90 Days', apy: '6.00%', min: '0.01 BTC', popular: true },
    { coin: 'ETH', name: 'Ethereum', type: 'Flexible', apy: '3.50%', min: '0.1 ETH', popular: false },
    { coin: 'ETH', name: 'Ethereum', type: 'Fixed - 60 Days', apy: '5.25%', min: '0.1 ETH', popular: false },
    { coin: 'SOL', name: 'Solana', type: 'Flexible', apy: '7.10%', min: '1 SOL', popular: false },
  ];

  const filteredProducts = activeTab === 'All' 
    ? products 
    : products.filter(p => p.type.includes(activeTab));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="bg-[#03045E] py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto text-white">
            <h1 className="text-4xl font-extrabold mb-4">Goalign Earn</h1>
            <p className="text-lg text-blue-200 mb-8">Put your idle assets to work. Earn daily yields with flexible and fixed term staking products.</p>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex justify-around">
              <div className="text-center">
                <div className="text-blue-200 text-sm mb-1">Total Assets (USD)</div>
                <div className="text-3xl font-bold text-accent">$0.00</div>
              </div>
              <div className="w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-blue-200 text-sm mb-1">30-Day Cumulative Profit</div>
                <div className="text-3xl font-bold text-white">+$0.00</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold text-primary">Staking Products</h2>
          
          <div className="flex bg-white rounded-lg shadow-sm border border-blue-50 p-1">
            {['All', 'Flexible', 'Fixed'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-md font-medium text-sm transition ${
                  activeTab === tab 
                  ? 'bg-blue-50 text-primary font-bold shadow-sm' 
                  : 'text-secondary hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-blue-50 hover:border-accent transition group relative overflow-hidden">
              {product.popular && (
                <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-bl-lg">
                  HOT
                </div>
              )}
              
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-primary font-bold">
                  {product.coin[0]}
                </div>
                <div>
                  <div className="font-bold text-primary text-lg">{product.coin}</div>
                  <div className="text-xs text-secondary">{product.name}</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-secondary mb-1">Est. APY</div>
                <div className="text-3xl font-bold text-accent">{product.apy}</div>
              </div>

              <div className="flex justify-between text-sm mb-6 pb-6 border-b border-gray-100">
                <div className="text-secondary">
                  Term: <span className="text-primary font-medium">{product.type}</span>
                </div>
                <div className="text-secondary">
                  Min: <span className="text-primary font-medium">{product.min}</span>
                </div>
              </div>

              <button className="w-full py-3 bg-blue-50 text-primary font-bold rounded-md group-hover:bg-primary group-hover:text-white transition">
                Stake Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Earn;

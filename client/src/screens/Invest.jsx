import React, { useState } from 'react';
import useAuthStore from '../store/useAuthStore';

const Invest = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Quantify');
  
  // Mock VIP level
  const userVipLevel = 0;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Invest</h1>
        
        {/* Tab Controls */}
        <div className="flex space-x-4 mb-16">
          <button
            onClick={() => setActiveTab('Quantify')}
            className={`flex-1 py-4 px-6 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'Quantify'
                ? 'bg-[#00e676] text-black shadow-[0_0_15px_rgba(0,230,118,0.3)]'
                : 'bg-[#151a24] text-gray-400 border border-gray-800 hover:border-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span>Quantify</span>
          </button>
          
          <button
            onClick={() => setActiveTab('Pledge')}
            className={`flex-1 py-4 px-6 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'Pledge'
                ? 'bg-[#00e676] text-black shadow-[0_0_15px_rgba(0,230,118,0.3)]'
                : 'bg-[#151a24] text-gray-400 border border-gray-800 hover:border-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.642 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.358-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
            <span>Pledge</span>
          </button>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 mt-12">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">📬</span>
            <h2 className="text-3xl text-gray-300 font-medium tracking-wide">No Plans Found</h2>
          </div>
          <p className="text-gray-400 text-lg mt-2">
            No investment products currently available for VIP Level {userVipLevel}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Invest;

import React from 'react';
import useAuthStore from '../store/useAuthStore';

const VIP = () => {
  const { user } = useAuthStore();
  const currentVolume = 12450;
  const nextTierVolume = 50000;
  const progressPercent = Math.min((currentVolume / nextTierVolume) * 100, 100);

  const tiers = [
    { level: 'VIP 0', volReq: '$0', maker: '0.100%', taker: '0.100%', withdrawal: '$50,000' },
    { level: 'VIP 1', volReq: '$50K', maker: '0.080%', taker: '0.090%', withdrawal: '$100,000' },
    { level: 'VIP 2', volReq: '$500K', maker: '0.060%', taker: '0.080%', withdrawal: '$500,000' },
    { level: 'VIP 3', volReq: '$5M', maker: '0.040%', taker: '0.060%', withdrawal: '$2,000,000' },
    { level: 'VIP 4', volReq: '$25M', maker: '0.020%', taker: '0.040%', withdrawal: '$5,000,000' },
    { level: 'VIP 5', volReq: '$100M', maker: '0.000%', taker: '0.020%', withdrawal: '$10,000,000' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-[#03045E] py-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white max-w-xl">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Goalign VIP Program</h1>
              <p className="text-lg text-blue-200 mb-6">Enjoy lower trading fees, higher withdrawal limits, and exclusive institutional benefits.</p>
              <button className="bg-accent text-primary px-8 py-3 rounded-md font-bold hover:bg-opacity-90 transition">
                View My Privileges
              </button>
            </div>
            
            {/* User Progress Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl w-full md:w-96 text-white">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-xl border border-accent/50">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{user?.displayName || 'User'}</div>
                    <div className="text-sm text-accent font-medium">Current: VIP 0</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-blue-200">30-Day Volume</span>
                  <span className="font-bold">${currentVolume.toLocaleString()} / ${nextTierVolume.toLocaleString()}</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2 mb-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="text-xs text-blue-200 text-right">
                  Upgrade to VIP 1 requires ${ (nextTierVolume - currentVolume).toLocaleString() } more volume.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Table */}
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-primary mb-8 text-center">VIP Tier Benefits</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-blue-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-50/50 text-secondary text-sm">
                  <th className="px-6 py-4 font-bold border-b border-blue-100">Tier Level</th>
                  <th className="px-6 py-4 font-bold border-b border-blue-100">30-Day Trading Vol</th>
                  <th className="px-6 py-4 font-bold border-b border-blue-100 text-center">Maker Fee</th>
                  <th className="px-6 py-4 font-bold border-b border-blue-100 text-center">Taker Fee</th>
                  <th className="px-6 py-4 font-bold border-b border-blue-100 text-right">Daily Withdrawal Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {tiers.map((tier, idx) => (
                  <tr key={tier.level} className={`hover:bg-blue-50/30 transition ${idx === 0 ? 'bg-blue-50/20' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {idx === 0 && <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>}
                        <span className={`font-bold ${idx === 0 ? 'text-accent' : 'text-primary'}`}>{tier.level}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-secondary font-medium">&ge; {tier.volReq}</td>
                    <td className="px-6 py-4 text-center font-mono text-secondary">{tier.maker}</td>
                    <td className="px-6 py-4 text-center font-mono text-secondary">{tier.taker}</td>
                    <td className="px-6 py-4 text-right font-medium text-primary">{tier.withdrawal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-xl">1</div>
            <h3 className="font-bold text-primary mb-2">Dedicated Account Manager</h3>
            <p className="text-secondary text-sm">VIP 3+ users receive 24/7 priority support and a dedicated institutional account manager.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-xl">2</div>
            <h3 className="font-bold text-primary mb-2">Exclusive OTC Access</h3>
            <p className="text-secondary text-sm">Execute large block trades privately with zero slippage via our secure OTC desk.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-xl">3</div>
            <h3 className="font-bold text-primary mb-2">Custom API Limits</h3>
            <p className="text-secondary text-sm">Unlock higher frequency API rate limits for your quantitative trading algorithms.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VIP;

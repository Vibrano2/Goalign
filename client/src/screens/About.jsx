import React from 'react';
import { Shield, Lock, Activity } from 'lucide-react';

const About = () => {
  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-primary text-white pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20 z-0 pointer-events-none"></div>
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Goalign</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            We're on a mission to democratize finance by building the most powerful, transparent, and secure crypto trading platform in the world.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto max-w-4xl px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-blue-50">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} />
              </div>
              <h3 className="font-bold text-primary text-lg mb-2">Secure by Design</h3>
              <p className="text-secondary text-sm">Industry-leading encryption, cold storage, and non-custodial Web3 options.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity size={32} />
              </div>
              <h3 className="font-bold text-primary text-lg mb-2">Lightning Fast</h3>
              <p className="text-secondary text-sm">Institutional-grade matching engine capable of millions of trades per second.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h3 className="font-bold text-primary text-lg mb-2">Fully Compliant</h3>
              <p className="text-secondary text-sm">Working with regulators globally to ensure a safe ecosystem for all users.</p>
            </div>
          </div>

          <div className="prose prose-blue max-w-none text-secondary">
            <h2 className="text-2xl font-bold text-primary mb-4">Our Story</h2>
            <p className="mb-6 leading-relaxed">
              Founded in 2024, Goalign was built by a team of Wall Street quantitative analysts and blockchain engineers who saw a gap in the market. While there were many crypto exchanges, none offered the seamless blend of centralized institutional liquidity with decentralized Web3 autonomy.
            </p>
            <p className="mb-6 leading-relaxed">
              Today, Goalign serves traders globally, offering a comprehensive suite of tools ranging from zero-fee spot trading and high-leverage derivatives to automated copy trading and passive yield generation.
            </p>
            
            <h2 className="text-2xl font-bold text-primary mb-4 mt-8">Our Core Values</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-accent mr-3 mt-1 font-bold">1.</span>
                <span><strong>User First:</strong> Every product decision we make starts with how it benefits our users.</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-3 mt-1 font-bold">2.</span>
                <span><strong>Radical Transparency:</strong> We publish real-time proof of reserves and maintain open communication channels.</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-3 mt-1 font-bold">3.</span>
                <span><strong>Relentless Innovation:</strong> We move fast, ship daily, and constantly push the boundaries of DeFi and CeFi.</span>
              </li>
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default About;

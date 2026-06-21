import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Copy, Send, QrCode, LogOut, ExternalLink, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Web3Dashboard = ({ walletConfig, onClearWallet }) => {
  const [balance, setBalance] = useState('0.0000');
  const [loading, setLoading] = useState(true);
  const [hasCopied, setHasCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('tokens'); // 'tokens' or 'nfts'

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        // Using ethers default provider to fetch real Mainnet ETH balance
        const provider = ethers.getDefaultProvider('mainnet');
        const balanceWei = await provider.getBalance(walletConfig.address);
        // Format down to 4 decimal places for clean UI
        const formatted = Number(ethers.formatEther(balanceWei)).toFixed(4);
        setBalance(formatted);
      } catch (err) {
        console.error("Failed to fetch balance", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [walletConfig.address]);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletConfig.address);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Network & Disconnect Header */}
      <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Ethereum Mainnet</span>
        </div>
        <button 
          onClick={onClearWallet}
          className="flex items-center space-x-1 text-gray-400 hover:text-red-500 transition px-3 py-1 text-xs font-bold"
        >
          <LogOut size={14} />
          <span>Disconnect</span>
        </button>
      </div>

      {/* Main Balance Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-br from-[#2185ff] to-[#1c73e8] rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <button 
            onClick={copyAddress}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 transition px-4 py-2 rounded-full backdrop-blur-sm mb-6"
          >
            <span className="font-mono text-sm tracking-wider">{formatAddress(walletConfig.address)}</span>
            {hasCopied ? <span className="text-xs font-bold text-green-300">Copied!</span> : <Copy size={14} />}
          </button>

          <div className="text-blue-100 font-medium mb-1">Total Balance</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-5xl font-black tracking-tight">{loading ? '...' : balance}</span>
            <span className="text-xl font-bold text-blue-200">ETH</span>
          </div>
          {/* Mock USD value for aesthetic */}
          <div className="mt-2 text-blue-100/80 font-medium tracking-wide">
            ≈ ${loading ? '...' : (parseFloat(balance) * 3500).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
          </div>

          <div className="flex space-x-4 mt-8 w-full justify-center">
            <button className="flex-1 max-w-[140px] bg-white text-[#2185ff] py-3.5 rounded-2xl font-bold flex flex-col items-center justify-center space-y-1 hover:bg-blue-50 transition shadow-lg">
              <Send size={20} />
              <span className="text-xs">Send</span>
            </button>
            <button className="flex-1 max-w-[140px] bg-[#1a66d4] border border-blue-400 text-white py-3.5 rounded-2xl font-bold flex flex-col items-center justify-center space-y-1 hover:bg-[#1556b8] transition shadow-lg">
              <QrCode size={20} />
              <span className="text-xs">Receive</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Assets / Activity Tabs */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('tokens')}
            className={`flex-1 py-4 text-sm font-bold transition ${activeTab === 'tokens' ? 'text-[#2185ff] border-b-2 border-[#2185ff]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Tokens
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-4 text-sm font-bold transition ${activeTab === 'activity' ? 'text-[#2185ff] border-b-2 border-[#2185ff]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Activity
          </button>
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'tokens' && (
              <motion.div 
                key="tokens"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {/* Native ETH Token Row */}
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-[#627EEA] flex items-center justify-center text-white font-bold text-[10px]">
                        ETH
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">Ethereum</div>
                      <div className="text-xs text-gray-400">Native</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">{loading ? '...' : balance}</div>
                    <div className="text-xs text-gray-400">${loading ? '...' : (parseFloat(balance) * 3500).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  </div>
                </div>

                {/* Example ERC20 Token (0 balance) */}
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer group opacity-60">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-[#26A17B] flex items-center justify-center text-white font-bold text-[10px]">
                        USDT
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">Tether USD</div>
                      <div className="text-xs text-gray-400">ERC-20</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">0.0000</div>
                    <div className="text-xs text-gray-400">$0.00</div>
                  </div>
                </div>
                
                <button className="w-full mt-4 py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 text-xs font-bold hover:bg-gray-50 transition flex items-center justify-center space-x-2">
                  <span>Manage Tokens</span>
                </button>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div 
                key="activity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-3"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                  <Activity size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-700">No recent activity</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">Transactions will appear here once you send or receive tokens.</p>
                </div>
                <a 
                  href={`https://etherscan.io/address/${walletConfig.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-[#2185ff] text-xs font-bold mt-2 hover:underline"
                >
                  <span>View on Etherscan</span>
                  <ExternalLink size={12} />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Web3Dashboard;

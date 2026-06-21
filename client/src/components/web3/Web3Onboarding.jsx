import React, { useState } from 'react';
import { Wallet } from 'ethers';
import { ShieldAlert, KeyRound, ArrowRight, ShieldCheck, Copy, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Web3Onboarding = ({ onWalletCreated }) => {
  const [step, setStep] = useState(1);
  const [mnemonic, setMnemonic] = useState('');
  const [address, setAddress] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const generateWallet = () => {
    // Generate a random wallet using ethers.js
    const newWallet = Wallet.createRandom();
    setMnemonic(newWallet.mnemonic.phrase);
    setAddress(newWallet.address);
    setPrivateKey(newWallet.privateKey);
    setStep(2);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mnemonic);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const confirmBackup = () => {
    onWalletCreated({
      address,
      privateKey,
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-xl mx-auto p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 z-0 pointer-events-none"></div>
      
      <div className="relative z-10 min-h-[400px] flex flex-col">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-center items-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-[#2185ff] shadow-inner mb-2">
                <ShieldCheck size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Gateway to Web3</h2>
                <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                  Create a non-custodial wallet to take full control of your assets. You hold the keys, you own your crypto.
                </p>
              </div>
              
              <div className="w-full space-y-3 mt-8">
                <button 
                  onClick={generateWallet}
                  className="w-full bg-[#2185ff] text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-600 transition shadow-lg shadow-blue-500/30"
                >
                  <KeyRound size={18} />
                  <span>Create New Wallet</span>
                </button>
                <button 
                  onClick={() => alert('Import Wallet coming soon!')}
                  className="w-full bg-gray-50 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-100 transition border border-gray-200"
                >
                  I already have a wallet
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="backup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Secure Your Wallet</h2>
                  <p className="text-xs text-gray-500">Write down these 12 words in order.</p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-6 flex items-start space-x-3">
                <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                <p className="text-xs text-orange-800 leading-relaxed">
                  Never share this phrase with anyone. If you lose it, you will permanently lose access to your funds. Goalign cannot recover it for you.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {mnemonic.split(' ').map((word, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg flex items-center space-x-2">
                    <span className="text-[10px] text-gray-400 font-mono w-4">{index + 1}.</span>
                    <span className="text-sm font-bold text-gray-800">{word}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto space-y-4">
                <button 
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center space-x-2 text-[#2185ff] font-bold text-sm hover:bg-blue-50 py-3 rounded-lg transition"
                >
                  <Copy size={16} />
                  <span>{hasCopied ? 'Copied to Clipboard!' : 'Copy Phrase'}</span>
                </button>
                <button 
                  onClick={confirmBackup}
                  className="w-full bg-[#2185ff] text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-600 transition shadow-lg shadow-blue-500/30"
                >
                  <span>I've Saved It Safely</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Web3Onboarding;

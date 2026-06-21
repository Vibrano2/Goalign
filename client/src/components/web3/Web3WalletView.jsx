import React, { useState, useEffect } from 'react';
import Web3Onboarding from './Web3Onboarding';
import Web3Dashboard from './Web3Dashboard';
import { motion, AnimatePresence } from 'framer-motion';

const Web3WalletView = () => {
  const [walletConfig, setWalletConfig] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check local storage for wallet
    try {
      const stored = localStorage.getItem('goalign_web3_wallet');
      if (stored) {
        setWalletConfig(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to parse local wallet", err);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const handleWalletCreated = (config) => {
    try {
      localStorage.setItem('goalign_web3_wallet', JSON.stringify(config));
      setWalletConfig(config);
    } catch (err) {
      console.error("Failed to save wallet to local storage", err);
    }
  };

  const handleClearWallet = () => {
    if (window.confirm("Are you sure you want to disconnect? Make sure you have your backup phrase saved!")) {
      localStorage.removeItem('goalign_web3_wallet');
      setWalletConfig(null);
    }
  };

  if (isInitializing) return null;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!walletConfig ? (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Web3Onboarding onWalletCreated={handleWalletCreated} />
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Web3Dashboard walletConfig={walletConfig} onClearWallet={handleClearWallet} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Web3WalletView;

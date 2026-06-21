import React, { useState, useEffect } from 'react';
import { ChevronDown, Filter, BadgeCheck, X, ArrowRightLeft } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

const Transfer = () => {
  const { user } = useAuthStore();
  const [view, setView] = useState('market'); // 'market', 'orders', 'post'
  
  // Market State
  const [side, setSide] = useState('buy'); // 'buy' means user wants to buy (so they see 'sell' ads)
  const [asset, setAsset] = useState('USDT');
  const [fiat, setFiat] = useState('USD');
  const [selectedAd, setSelectedAd] = useState(null);
  const [amount, setAmount] = useState('');
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Orders State
  const [myOrders, setMyOrders] = useState([]);

  // Post Ad State
  const [postType, setPostType] = useState('sell');
  const [postPrice, setPostPrice] = useState('');
  const [postTotal, setPostTotal] = useState('');
  const [postMin, setPostMin] = useState('');
  const [postMax, setPostMax] = useState('');
  const [postMethod, setPostMethod] = useState('Bank Transfer');

  // Fetch ads from API
  useEffect(() => {
    if (view === 'market') {
      const fetchAds = async () => {
        setLoading(true);
        try {
          const queryType = side === 'buy' ? 'sell' : 'buy';
          const res = await fetch(`https://goalign-mrkd.onrender.com/api/p2p/ads?type=${queryType}&asset=${asset}&fiat=${fiat}`);
          if (res.ok) {
            const data = await res.json();
            setAds(data.ads);
          }
        } catch (err) {
          console.error("Failed to fetch P2P ads", err);
        } finally {
          setLoading(false);
        }
      };
      fetchAds();
    }
  }, [side, asset, fiat, view]);

  // Fetch Orders
  useEffect(() => {
    if (view === 'orders' && user) {
      const fetchOrders = async () => {
        try {
          const res = await fetch(`https://goalign-mrkd.onrender.com/api/p2p/orders/${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            setMyOrders(data.orders);
          }
        } catch (err) {
          console.error("Failed to fetch orders", err);
        }
      };
      fetchOrders();
    }
  }, [view, user]);

  const handleAction = (ad) => {
    setSelectedAd(ad);
    setAmount('');
  };

  const submitOrder = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      const res = await fetch('https://goalign-mrkd.onrender.com/api/p2p/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          adId: selectedAd.id,
          amount: amount,
          method: selectedAd.methods[0] || 'Bank Transfer'
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Order placed successfully! Transaction ID: ${data.orderId}`);
        setSelectedAd(null);
        setView('orders'); // switch to orders view to see the new order
      } else {
        alert(`Error placing order: ${data.error}`);
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const handlePostAd = async () => {
    if (!user) return alert('Please login first');
    if (!postPrice || !postTotal || !postMin || !postMax || !postMethod) {
      return alert('Please fill in all fields');
    }
    
    try {
      const res = await fetch('https://goalign-mrkd.onrender.com/api/p2p/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          type: postType,
          asset,
          fiat,
          price: parseFloat(postPrice),
          available: parseFloat(postTotal),
          min: parseFloat(postMin),
          max: parseFloat(postMax),
          methods: [postMethod]
        })
      });
      if (res.ok) {
        alert('Ad posted successfully!');
        setPostPrice('');
        setPostTotal('');
        setPostMin('');
        setPostMax('');
        setView('market');
      } else {
        const data = await res.json();
        alert('Error posting ad: ' + data.error);
      }
    } catch (err) {
      alert('Network error while posting ad');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-[#f5f6fa] pb-24 font-sans"
    >
      {/* Top Nav for P2P Sections */}
      <div className="bg-[#1c73e8] pt-6 pb-2 px-4 text-white flex justify-between text-xs font-bold shadow-md z-30 relative">
        <button onClick={() => setView('market')} className={`pb-1 px-2 ${view === 'market' ? 'border-b-2 border-white opacity-100' : 'opacity-70'}`}>Marketplace</button>
        <button onClick={() => setView('orders')} className={`pb-1 px-2 ${view === 'orders' ? 'border-b-2 border-white opacity-100' : 'opacity-70'}`}>My Orders</button>
        <button onClick={() => setView('post')} className={`pb-1 px-2 ${view === 'post' ? 'border-b-2 border-white opacity-100' : 'opacity-70'}`}>Post an Ad</button>
      </div>

      {view === 'market' && (
        <>
          {/* Blue Header matching VIP aesthetic */}
          <div className="bg-[#2185ff] pt-4 pb-16 px-4 rounded-b-3xl text-white sticky top-0 z-20 shadow-lg">
            <div className="flex justify-center space-x-8 text-sm font-bold mb-2">
              {['buy', 'sell'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setSide(tab)}
                  className={`relative pb-2 transition-all ${side === tab ? 'text-white' : 'text-white/70 hover:text-white'}`}
                >
                  {tab === 'buy' ? 'Buy Crypto' : 'Sell Crypto'}
                  {side === tab && (
                    <motion.div 
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
            
            <div className="mt-4 flex items-center justify-between opacity-90">
              <div className="text-xs">
                <span className="opacity-70">Current Asset:</span> <strong className="text-sm ml-1">{asset}</strong>
              </div>
              <div className="text-xs text-right">
                <span className="opacity-70">Fiat Currency:</span> <strong className="text-sm ml-1">{fiat}</strong>
              </div>
            </div>
          </div>

          <div className="px-4 relative z-10">
            {/* Floating Filters Card */}
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="-mt-8 bg-white rounded-xl shadow-md p-4 mb-6 flex items-center justify-between"
            >
              <div className="flex space-x-2">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center space-x-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition-colors">
                  <span>{asset}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center space-x-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition-colors">
                  <span>{fiat}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </motion.button>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="flex items-center justify-center bg-blue-50 text-[#2185ff] w-8 h-8 rounded-full transition">
                <Filter size={14} />
              </motion.button>
            </motion.div>

            {/* Section Title */}
            <div className="flex items-center space-x-1 mb-4">
              <div className="w-1 h-4 bg-[#2185ff] rounded-full"></div>
              <h3 className="font-bold text-gray-700 text-sm">P2P Merchants</h3>
            </div>

            {/* Ads List */}
            <div className="space-y-4">
              {loading ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-gray-400 font-bold">
                   <div className="animate-pulse">Loading merchants...</div>
                 </motion.div>
              ) : ads.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <div className="text-4xl mb-4 opacity-50 flex justify-center text-gray-300"><ArrowRightLeft /></div>
                  <h3 className="font-bold text-gray-700">No Ads Found</h3>
                  <p className="text-xs text-gray-400 mt-2">No merchants matching your criteria</p>
                </motion.div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  key={side + asset + fiat}
                  className="space-y-3"
                >
                  <AnimatePresence>
                    {ads.map((ad) => (
                      <motion.div 
                        variants={itemVariants}
                        layout
                        whileHover={{ y: -2, scale: 1.01 }}
                        key={ad.id} 
                        className="bg-white rounded-2xl p-4 relative overflow-hidden shadow-sm border border-gray-100 transition-all"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#2185ff] to-[#afeeee]"></div>

                        <div className="flex justify-between items-start mb-4 ml-2 relative z-10">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 flex items-center justify-center font-bold text-lg border border-gray-200 shadow-inner">
                              {ad.merchant.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1">
                                <span className="font-bold text-gray-800 text-sm">{ad.merchant}</span>
                                {ad.verified && <BadgeCheck size={14} className="text-[#2185ff]" />}
                              </div>
                              <div className="text-[10px] text-gray-500 flex items-center space-x-2 mt-0.5">
                                <span>{ad.orders} orders</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>{ad.completion}% completion</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-gray-500 mb-0.5">Price</div>
                            <div className="text-lg font-black text-orange-500">{ad.price.toFixed(2)} <span className="text-xs font-bold text-gray-500">{ad.fiat}</span></div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 ml-2">
                          <div className="text-[11px] space-y-1 text-gray-600">
                            <div className="flex items-center space-x-2">
                              <span className="w-14">Available</span>
                              <span className="font-mono font-bold text-gray-800">{ad.available.toLocaleString()} {ad.asset}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="w-14">Limit</span>
                              <span className="font-mono font-bold text-gray-800">{ad.min.toLocaleString()} - {ad.max.toLocaleString()} {ad.fiat}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end space-x-3 mt-3 border-t border-gray-50 pt-3">
                            <div className="flex flex-wrap gap-1">
                              {ad.methods.map((m, i) => (
                                <span key={i} className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {m}
                                </span>
                              ))}
                            </div>
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAction(ad)}
                              className={`px-5 py-1.5 rounded-full font-bold text-xs text-white shadow-md transition-colors ${side === 'buy' ? 'bg-[#2185ff] shadow-blue-500/30' : 'bg-orange-500 shadow-orange-500/30'}`}
                            >
                              {side === 'buy' ? 'Buy' : 'Sell'}
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </>
      )}

      {view === 'orders' && (
        <>
          <div className="bg-[#2185ff] pt-4 pb-16 px-4 rounded-b-3xl text-white sticky top-0 z-20 shadow-lg">
            <h2 className="text-xl font-bold text-center">Order History</h2>
          </div>
          <div className="px-4 relative z-10 -mt-8">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {myOrders.map(order => (
                <motion.div variants={itemVariants} key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gray-200 to-gray-300"></div>
                  <div className="ml-2">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${order.role === 'buyer' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {order.role === 'buyer' ? 'Buy' : 'Sell'} {order.asset}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-lg font-black text-gray-800">{order.cryptoAmount} <span className="text-sm text-gray-500">{order.asset}</span></div>
                        <div className="text-xs text-gray-500 mt-1">with <span className="font-bold text-gray-700">{order.counterparty}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#2185ff]">{order.fiatAmount} <span className="text-sm">{order.fiat}</span></div>
                        <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mt-1">{order.status}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {myOrders.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-4 opacity-50 flex justify-center text-gray-300">📋</div>
                  <p className="text-sm font-bold text-gray-500">No orders found.</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </>
      )}

      {view === 'post' && (
        <>
          <div className="bg-[#2185ff] pt-4 pb-16 px-4 rounded-b-3xl text-white sticky top-0 z-20 shadow-lg">
            <h2 className="text-xl font-bold text-center">Post an Ad</h2>
          </div>
          <div className="px-4 relative z-10 -mt-8">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-3xl shadow-lg p-6 border border-gray-50"
            >
              <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setPostType('sell')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${postType === 'sell' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Sell Crypto</button>
                <button onClick={() => setPostType('buy')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${postType === 'buy' ? 'bg-white text-[#2185ff] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Buy Crypto</button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">Price ({fiat})</label>
                  <input type="number" placeholder="0.00" value={postPrice} onChange={e=>setPostPrice(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#2185ff] transition mt-1"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">Total Amount ({asset})</label>
                  <input type="number" placeholder="0.00" value={postTotal} onChange={e=>setPostTotal(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#2185ff] transition mt-1"/>
                </div>
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Min Limit</label>
                    <input type="number" placeholder="10" value={postMin} onChange={e=>setPostMin(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#2185ff] transition mt-1"/>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Max Limit</label>
                    <input type="number" placeholder="1000" value={postMax} onChange={e=>setPostMax(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#2185ff] transition mt-1"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">Payment Method</label>
                  <input type="text" placeholder="e.g. Bank Transfer" value={postMethod} onChange={e=>setPostMethod(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#2185ff] transition mt-1"/>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePostAd} 
                  className={`w-full text-white rounded-full py-4 font-bold mt-2 shadow-lg transition-colors ${postType === 'sell' ? 'bg-orange-500 shadow-orange-500/30' : 'bg-[#2185ff] shadow-blue-500/30'}`}
                >
                  Publish Advertisement
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Action Modal (Only for market view) */}
      <AnimatePresence>
        {selectedAd && view === 'market' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#f5f6fa] w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <div className="w-1 h-5 bg-[#2185ff] rounded-full"></div>
                  <span>{side === 'buy' ? 'Buy' : 'Sell'} {selectedAd.asset}</span>
                </h3>
                <motion.button 
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedAd(null)} 
                  className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 mb-6 text-sm border border-gray-100">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Price</span>
                  <span className="font-bold text-orange-500">{selectedAd.price.toFixed(2)} {selectedAd.fiat}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Limit</span>
                  <span className="font-bold text-gray-800">{selectedAd.min} - {selectedAd.max} {selectedAd.fiat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Window</span>
                  <span className="font-bold text-gray-800">15 Minutes</span>
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <div className="bg-gray-100 rounded-lg py-3 px-4 flex items-center justify-between text-sm">
                  <span className="text-gray-600">I want to {side === 'buy' ? 'pay' : 'sell'}</span>
                  <span className="font-bold text-gray-800">{side === 'buy' ? selectedAd.fiat : selectedAd.asset}</span>
                </div>

                <input 
                  type="number"
                  placeholder={`Amount (${selectedAd.min} - ${selectedAd.max})`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#2185ff] transition"
                />
              </div>

              <AnimatePresence>
                {amount && !isNaN(amount) && parseFloat(amount) > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="flex justify-between items-center text-sm mb-6 bg-[#e6f2ff] text-[#2185ff] p-4 rounded-xl border border-blue-100"
                  >
                    <span className="font-bold">You will receive</span>
                    <span className="font-black text-lg">
                      {side === 'buy' ? 
                        (parseFloat(amount) / selectedAd.price).toFixed(4) + ' ' + selectedAd.asset :
                        (parseFloat(amount) * selectedAd.price).toFixed(2) + ' ' + selectedAd.fiat
                      }
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submitOrder}
                className="w-full bg-[#2185ff] text-white rounded-full py-3.5 font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition"
              >
                Confirm Order
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Transfer;

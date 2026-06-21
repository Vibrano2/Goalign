import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import BottomNav from './components/BottomNav';
import Home from './screens/Home';
import Trade from './screens/Trade';
import Futures from './screens/Futures';
import Invest from './screens/Invest';
import Transfer from './screens/Transfer';
import VIP from './screens/VIP';
import Wallet from './screens/Wallet';
import Earn from './screens/Earn';
import Profile from './screens/Profile';
import Login from './screens/Login';
import Register from './screens/Register';
import Admin from './screens/Admin';
import KYC from './screens/KYC';
import useAuthStore from './store/useAuthStore';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const initAuthListener = useAuthStore(state => state.initAuthListener);
  const loading = useAuthStore(state => state.loading);

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, [initAuthListener]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary font-bold">Loading Goalign...</div>;
  }

  return (
    <Router>
      <div className="app-container min-h-screen bg-background flex flex-col pb-16 md:pb-0">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Protected Routes */}
            <Route path="/trade" element={<ProtectedRoute><Trade /></ProtectedRoute>} />
            <Route path="/futures" element={<ProtectedRoute><Futures /></ProtectedRoute>} />
            <Route path="/invest" element={<ProtectedRoute><Invest /></ProtectedRoute>} />
            <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
            <Route path="/vip" element={<ProtectedRoute><VIP /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/earn" element={<ProtectedRoute><Earn /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
            
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import Home from './screens/Home';
import Trade from './screens/Trade';
import Futures from './screens/Futures';
import Invest from './screens/Invest';

import VIP from './screens/VIP';
import Wallet from './screens/Wallet';
import Earn from './screens/Earn';
import Profile from './screens/Profile';
import Login from './screens/Login';
import Register from './screens/Register';
import Admin from './screens/Admin';
import KYC from './screens/KYC';
import Yields from './screens/Yields';
import Options from './screens/Options';
import CustomPlugin from './screens/CustomPlugin';
import P2P from './screens/P2P';
import CopyTrading from './screens/CopyTrading';
import ProtectedRoute from './components/ProtectedRoute';
import ComingSoon from './screens/ComingSoon';
import About from './screens/About';
import TermsOfService from './screens/TermsOfService';
import PrivacyPolicy from './screens/PrivacyPolicy';
import HelpCenter from './screens/HelpCenter';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
        <div className="app-container min-h-screen bg-background flex flex-col pb-16 md:pb-0">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              
              {/* Protected Routes */}
              <Route path="/trade" element={<ProtectedRoute><Trade /></ProtectedRoute>} />
              <Route path="/futures" element={<ProtectedRoute><Futures /></ProtectedRoute>} />
              <Route path="/invest" element={<ProtectedRoute><Invest /></ProtectedRoute>} />

              <Route path="/vip" element={<ProtectedRoute><VIP /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/earn" element={<ProtectedRoute><Earn /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
              <Route path="/yields" element={<ProtectedRoute><Yields /></ProtectedRoute>} />
              <Route path="/options" element={<ProtectedRoute><Options /></ProtectedRoute>} />
              <Route path="/plugin" element={<ProtectedRoute><CustomPlugin /></ProtectedRoute>} />
              <Route path="/p2p" element={<ProtectedRoute><P2P /></ProtectedRoute>} />
              <Route path="/copy-trading" element={<ProtectedRoute><CopyTrading /></ProtectedRoute>} />
              
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Static Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/help" element={<HelpCenter />} />
              
              {/* Catch-all for coming soon pages */}
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="*" element={<ComingSoon />} />
            </Routes>
          </main>
          <Footer />
          <BottomNav />
        </div>
    </Router>
  );
}

export default App;

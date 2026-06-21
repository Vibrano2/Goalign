import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const isActive = (path) => location.pathname === path ? 'text-accent border-b-2 border-accent' : 'text-white hover:text-accent';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-primary text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-wider text-white">
                Goal<span className="text-accent">ign</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link to="/" className={`pb-1 ${isActive('/')}`}>Markets</Link>
              <Link to="/trade" className={`pb-1 ${isActive('/trade')}`}>Trade</Link>
              <Link to="/futures" className={`pb-1 ${isActive('/futures')}`}>Derivatives</Link>
              <Link to="/invest" className={`pb-1 ${isActive('/invest')}`}>Invest</Link>
              <Link to="/transfer" className={`pb-1 ${isActive('/transfer')}`}>P2P</Link>
              <Link to="/vip" className={`pb-1 ${isActive('/vip')}`}>VIP</Link>
              <Link to="/earn" className={`pb-1 ${isActive('/earn')}`}>Earn</Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/wallet" className="text-white hover:text-accent text-sm font-medium hidden md:block">Wallet</Link>
            
            <div className="flex items-center space-x-3 ml-2">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="flex items-center gap-2 text-white hover:text-accent text-sm font-medium">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                      {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:block">{user?.displayName || 'My Profile'}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-gray-300 hover:text-white text-sm font-medium ml-4">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-white hover:text-accent text-sm font-medium">Log In</Link>
                  <Link to="/register" className="bg-accent text-primary px-4 py-1.5 rounded-md text-sm font-bold hover:bg-opacity-90 transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

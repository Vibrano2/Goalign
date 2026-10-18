import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAuthenticated = !!user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'text-accent border-b-2 border-accent' : 'text-white hover:text-accent transition-colors duration-300';

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
          <div className="flex items-center space-x-4 lg:space-x-8">
            <Link to="/" className="flex items-center shrink-0">
              <img src="/logo.svg" alt="Goalign" className="h-10 lg:h-12" />
            </Link>
            
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-4 text-[13px] xl:text-sm font-medium whitespace-nowrap overflow-hidden">
              <Link to="/" className={`pb-1 ${isActive('/')}`}>Markets</Link>
              <Link to="/trade" className={`pb-1 ${isActive('/trade')}`}>Trade</Link>
              
              {/* Labs Dropdown */}
              <div className="relative group py-1">
                <button className="flex items-center text-white hover:text-accent transition-colors duration-300">
                  Labs
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div className="absolute left-0 mt-1 w-36 bg-[#001433] border border-blue-900 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 overflow-hidden">
                  <Link to="/yields" className={`block px-4 py-2 text-sm hover:bg-blue-900 hover:bg-opacity-50 ${isActive('/yields').replace('pb-1', '')}`}>Yields</Link>
                  <Link to="/options" className={`block px-4 py-2 text-sm hover:bg-blue-900 hover:bg-opacity-50 ${isActive('/options').replace('pb-1', '')}`}>Options</Link>
                  <Link to="/plugin" className={`block px-4 py-2 text-sm hover:bg-blue-900 hover:bg-opacity-50 ${isActive('/plugin').replace('pb-1', '')}`}>Custom Plugin</Link>
                </div>
              </div>

              <Link to="/futures" className={`pb-1 ${isActive('/futures')}`}>Derivatives</Link>
              <Link to="/earn" className={`pb-1 ${isActive('/earn')}`}>Earn</Link>
              <Link to="/wallet" className={`pb-1 ${isActive('/wallet')}`}>Wallet</Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            
            <div className="flex items-center space-x-3 ml-2">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="flex items-center gap-2 text-white hover:text-accent text-sm font-medium whitespace-nowrap">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold shrink-0">
                      {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:block whitespace-nowrap">{user?.displayName || 'My Profile'}</span>
                  </Link>
                  <button onClick={handleLogout} className="hidden md:block text-gray-300 hover:text-white text-sm font-medium ml-4">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hidden lg:block text-white hover:text-accent transition-colors duration-300 text-sm font-medium whitespace-nowrap">Log In</Link>
                  <Link to="/register" className="hidden lg:block bg-accent text-primary px-4 py-1.5 rounded-md text-sm font-bold hover:bg-opacity-100 hover:shadow-[0_0_15px_rgba(0,180,216,0.4)] hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap">
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center ml-2">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="text-white hover:text-accent focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-primary border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
            <Link to="/" className={`px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'text-accent' : 'text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>Markets</Link>
            <Link to="/trade" className={`px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/trade' ? 'text-accent' : 'text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>Trade</Link>
            <Link to="/futures" className={`px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/futures' ? 'text-accent' : 'text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>Derivatives</Link>
            <Link to="/earn" className={`px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/earn' ? 'text-accent' : 'text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>Earn</Link>
            <Link to="/wallet" className={`px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/wallet' ? 'text-accent' : 'text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>Wallet</Link>
            
            <div className="border-t border-gray-700 pt-4 pb-2 mt-4">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="px-3 py-2 rounded-md text-base font-medium text-white hover:text-accent block" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white w-full text-left">
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 px-3">
                  <Link to="/login" className="text-white hover:text-accent text-base font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
                  <Link to="/register" className="bg-accent text-primary px-4 py-2 rounded-md text-base font-bold hover:bg-opacity-90 transition-colors text-center" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

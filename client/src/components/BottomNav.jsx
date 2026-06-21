import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Activity, PieChart, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Trade', path: '/trade', icon: TrendingUp },
    { name: 'Derivatives', path: '/futures', icon: Activity },
    { name: 'Wallet', path: '/wallet', icon: PieChart },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const isActive = (path) => location.pathname === path ? 'text-accent' : 'text-gray-400 hover:text-white';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-primary border-t border-blue-900 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} to={item.path} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive(item.path)}`}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

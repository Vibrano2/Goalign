import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-white pt-16 pb-24 md:pb-12 mt-auto border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <img src="/logo.svg" alt="Goalign" className="h-10 opacity-90 hover:opacity-100 transition" />
            </Link>
            <p className="text-sm text-white/60 mb-8 leading-relaxed pr-4">
              Empowering global trading with seamless access to digital assets, staking, and advanced market tools.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-accent hover:bg-white/10 transition">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-accent hover:bg-white/10 transition">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-accent hover:bg-white/10 transition">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-accent hover:bg-white/10 transition">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-6 text-white">Platform</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><Link to="/trade" className="hover:text-accent transition">Spot Trading</Link></li>
              <li><Link to="/futures" className="hover:text-accent transition">Futures</Link></li>
              <li><Link to="/invest" className="hover:text-accent transition">Earn & Staking</Link></li>
              <li><Link to="/vip" className="hover:text-accent transition">VIP Program</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-6 text-white">Support</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><Link to="/help" className="hover:text-accent transition">Help Center</Link></li>
              <li><Link to="/coming-soon" className="hover:text-accent transition">API Documentation</Link></li>
              <li><Link to="/coming-soon" className="hover:text-accent transition">Trading Fees</Link></li>
              <li><a href="mailto:support@goalign.com" className="hover:text-accent transition">Submit a Ticket</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-6 text-white">Company</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><Link to="/about" className="hover:text-accent transition">About Us</Link></li>
              <li><Link to="/coming-soon" className="hover:text-accent transition">Careers</Link></li>
              <li><Link to="/terms" className="hover:text-accent transition">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-accent transition">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-white/40">
          <p className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} Goalign Platform. All rights reserved.</p>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

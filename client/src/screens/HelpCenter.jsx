import React, { useState } from 'react';
import { Search, BookOpen, ShieldCheck, CreditCard, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const HelpCenter = () => {
  const [openFaq, setOpenFaq] = useState(null);
  
  const faqs = [
    {
      question: "How long does KYC verification take?",
      answer: "Standard KYC verification typically takes 5-10 minutes. In some cases where manual review is required, it may take up to 24-48 hours. Please ensure your submitted documents are clear and readable."
    },
    {
      question: "What are the fees for trading?",
      answer: "Goalign offers highly competitive fees. Spot trading begins at 0.1% maker/taker, and Futures trading begins at 0.02% maker and 0.05% taker. VIP users enjoy even lower tier-based fees."
    },
    {
      question: "How do I withdraw my funds to a bank account?",
      answer: "Currently, direct fiat withdrawals are supported in select regions via our P2P market or integrated payment gateways. Alternatively, you can withdraw crypto directly to your personal wallet."
    },
    {
      question: "Is my cryptocurrency safe on Goalign?",
      answer: "Yes. Goalign uses bank-grade encryption and stores 95% of user funds in offline cold storage. We also offer non-custodial Web3 wallet options for users who wish to hold their own private keys."
    }
  ];

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Hero Search Section */}
      <div className="bg-primary text-white pt-24 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-[120px] opacity-20 -mr-20 -mt-20 z-0 pointer-events-none"></div>
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">How can we help you?</h1>
          
          <div className="max-w-2xl mx-auto relative mt-8 shadow-2xl">
            <input 
              type="text" 
              placeholder="Search for articles, guides, or questions..." 
              className="w-full px-6 py-5 rounded-2xl text-gray-800 text-lg focus:outline-none focus:ring-4 focus:ring-accent/50 pr-16"
            />
            <button className="absolute right-3 top-3 w-12 h-12 bg-primary rounded-xl flex items-center justify-center hover:bg-blue-900 transition text-white">
              <Search size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 -mt-10 relative z-20">
        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: <User size={24} />, title: "Account & Setup", desc: "Registration, Login, KYC", route: "/profile" },
            { icon: <CreditCard size={24} />, title: "Deposits & Withdrawals", desc: "Funding, Fiat, Crypto", route: "/wallet" },
            { icon: <BookOpen size={24} />, title: "Trading & Markets", desc: "Spot, Futures, Margin", route: "/trade" },
            { icon: <ShieldCheck size={24} />, title: "Security & Privacy", desc: "2FA, Anti-Phishing", route: "/kyc" }
          ].map((cat, idx) => (
            <Link to={cat.route} key={idx} className="block bg-white p-6 rounded-2xl shadow-lg border border-blue-50 hover:-translate-y-1 transition cursor-pointer group">
              <div className="w-12 h-12 bg-blue-50 text-accent rounded-full flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition">
                {cat.icon}
              </div>
              <h3 className="font-bold text-primary text-lg mb-1">{cat.title}</h3>
              <p className="text-secondary text-sm">{cat.desc}</p>
            </Link>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-blue-50 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex justify-between items-center bg-gray-50 hover:bg-blue-50 transition text-left"
                >
                  <span className="font-bold text-primary">{faq.question}</span>
                  {openFaq === idx ? <ChevronUp className="text-accent" /> : <ChevronDown className="text-secondary" />}
                </button>
                {openFaq === idx && (
                  <div className="px-6 py-5 bg-white text-secondary leading-relaxed border-t border-gray-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Contact Support CTA */}
        <div className="bg-blue-50 rounded-2xl p-8 text-center border border-blue-100">
          <h3 className="text-2xl font-bold text-primary mb-3">Still need help?</h3>
          <p className="text-secondary mb-6 max-w-lg mx-auto">Our dedicated support team is available 24/7 to assist you with any advanced queries.</p>
          <a href="mailto:support@goalign.com" className="inline-block bg-accent text-primary px-8 py-3 rounded-lg font-bold hover:bg-opacity-90 transition shadow-[0_0_20px_rgba(0,180,216,0.3)]">
            Submit a Ticket
          </a>
        </div>

      </div>
    </div>
  );
};

export default HelpCenter;

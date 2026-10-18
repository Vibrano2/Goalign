import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-accent mb-6">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      </div>
      <h1 className="text-4xl font-bold text-primary mb-4">Coming Soon</h1>
      <p className="text-secondary max-w-md mx-auto mb-8">
        We're working hard to bring you this page. Please check back later!
      </p>
      <button 
        onClick={() => navigate(-1)}
        className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition"
      >
        Go Back
      </button>
    </div>
  );
};

export default ComingSoon;

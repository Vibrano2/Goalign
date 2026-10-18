import React from 'react';

const TermsOfService = () => {
  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="bg-primary text-white pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-blue-100">Last updated: June 26, 2026</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-blue-50 prose prose-blue max-w-none text-secondary">
          <p className="lead text-lg mb-8">
            Please read these Terms of Service carefully before using the Goalign platform. By accessing or using our services, you agree to be bound by these terms.
          </p>

          <h2 className="text-2xl font-bold text-primary mb-4">1. Acceptance of Terms</h2>
          <p className="mb-6">
            By registering for an account and accessing the Goalign platform, you agree that you have read, understood, and accept all of the terms and conditions contained in this Agreement as well as our Privacy Policy. If you do not agree to these terms, you may not use our services.
          </p>

          <h2 className="text-2xl font-bold text-primary mb-4 mt-8">2. Eligibility</h2>
          <p className="mb-6">
            To use Goalign, you must be at least 18 years old and reside in a jurisdiction where cryptocurrency trading is legal and permitted by our platform. We reserve the right to refuse service to anyone at our sole discretion.
          </p>

          <h2 className="text-2xl font-bold text-primary mb-4 mt-8">3. Risks of Trading</h2>
          <p className="mb-6">
            Trading cryptocurrencies and digital assets involves a high degree of risk. Prices are highly volatile, and you can lose part or all of your investment. You acknowledge that Goalign is not responsible for any losses incurred through trading on our platform.
          </p>

          <h2 className="text-2xl font-bold text-primary mb-4 mt-8">4. Prohibited Activities</h2>
          <p className="mb-4">You agree not to engage in any of the following prohibited activities:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Using the platform for any illegal purpose, including money laundering or terrorism financing.</li>
            <li>Attempting to hack, disrupt, or manipulate our systems or trading matching engine.</li>
            <li>Using automated trading bots or API access without express authorization.</li>
            <li>Providing false information during the KYC/AML verification process.</li>
          </ul>

          <h2 className="text-2xl font-bold text-primary mb-4 mt-8">5. Account Termination</h2>
          <p className="mb-6">
            We reserve the right to suspend, restrict, or terminate your account and access to the platform at any time, with or without cause, and without notice.
          </p>

          <h2 className="text-2xl font-bold text-primary mb-4 mt-8">6. Modifications to Terms</h2>
          <p className="mb-6">
            Goalign reserves the right to modify these terms at any time. We will notify users of significant changes, but it is your responsibility to review these terms periodically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

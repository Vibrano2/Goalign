import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="bg-primary text-white pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-blue-100">Last updated: June 26, 2026</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-blue-50 prose prose-blue max-w-none text-secondary">
          <p className="lead text-lg mb-8">
            At Goalign, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform.
          </p>

          <h2 className="text-2xl font-bold text-primary mb-4">1. Information We Collect</h2>
          <p className="mb-4">We may collect information about you in a variety of ways, including:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Personal Data:</strong> Name, email address, phone number, and identity verification documents (KYC).</li>
            <li><strong>Financial Data:</strong> Wallet addresses, bank account details, and transaction history.</li>
            <li><strong>Derivative Data:</strong> IP address, browser type, operating system, and access times.</li>
          </ul>

          <h2 className="text-2xl font-bold text-primary mb-4 mt-8">2. Use of Your Information</h2>
          <p className="mb-4">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Platform to:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Create and manage your account.</li>
            <li>Process transactions and send notices about your transactions.</li>
            <li>Comply with regulatory requirements (AML/KYC).</li>
            <li>Improve our platform's performance and security.</li>
          </ul>

          <h2 className="text-2xl font-bold text-primary mb-4 mt-8">3. Disclosure of Your Information</h2>
          <p className="mb-6">
            We do not sell your personal data. We may share information we have collected about you in certain situations, such as by law or to protect rights, or with third-party service providers that perform services for us (e.g., payment processing, identity verification).
          </p>

          <h2 className="text-2xl font-bold text-primary mb-4 mt-8">4. Security of Your Information</h2>
          <p className="mb-6">
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
          </p>

          <h2 className="text-2xl font-bold text-primary mb-4 mt-8">5. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please contact us at: <br/>
            <strong>Email:</strong> privacy@goalign.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

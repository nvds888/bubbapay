import React from 'react';

function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-2 mb-4">
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Terms of Service & Privacy Policy</h2>
        <p className="text-gray-600">Last updated: September 7, 2025</p>
      </div>

      <div className="prose prose-lg max-w-none">
        {/* Terms of Service */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Terms of Service</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-4">1. Service Description</h3>
          <p className="text-gray-700 mb-6">
            BubbaPay is a decentralized application (dApp) built on the Algorand blockchain that enables users to send cryptocurrency 
            to others through shareable links. Our service facilitates the creation of smart contracts that hold funds until they are 
            claimed by recipients or reclaimed by senders.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">2. User Responsibilities</h3>
          <div className="text-gray-700 mb-6">
            <p className="mb-3">By using BubbaPay, you acknowledge and agree that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are solely responsible for the security of your wallet and private keys</li>
              <li>You understand the risks associated with cryptocurrency transactions</li>
              <li>You will not use the service for any illegal or unauthorized purposes</li>
              <li>You are responsible for any transaction fees incurred</li>
              <li>You understand that blockchain transactions are irreversible once confirmed</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">3. Limitation of Liability</h3>
          <div className="text-gray-700 mb-6">
            <p className="mb-3">BubbaPay and its operators are NOT responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Lost funds</strong> due to user error, forgotten passwords, or lost private keys</li>
              <li>Network issues or blockchain congestion affecting transaction processing</li>
              <li>Third-party wallet malfunctions or security breaches</li>
              <li>Market volatility affecting the value of transferred assets</li>
              <li>Any damages arising from the use or inability to use our service</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">4. Fund Recovery</h3>
          <p className="text-gray-700 mb-6">
            BubbaPay created Apps always allow fund recovery by the creator account, which is set in global storage during App creation. This provides a safety mechanism, but users 
            must actively monitor transaction they sign. And funds could be inaccessible for a while if there appears to be a bug in the BubbaPay App.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">5. Service Availability</h3>
          <p className="text-gray-700 mb-6">
            We strive to maintain service availability but make no guarantees regarding uptime. The service may be temporarily 
            unavailable for maintenance, updates, or due to circumstances beyond our control.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">6. Modifications</h3>
          <p className="text-gray-700 mb-6">
            We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes 
            acceptance of the new terms.
          </p>
        </section>

        {/* Privacy Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h2>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">1. Data Collection</h3>
          <div className="text-gray-700 mb-6">
            <p className="mb-3">BubbaPay collects minimal data to provide our service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Transaction metadata:</strong> Amount, recipient email (if provided), and transaction status</li>
              <li><strong>Wallet addresses:</strong> Public Algorand addresses for transaction processing</li>
              <li><strong>Usage analytics:</strong> Basic service usage statistics (anonymized)</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">2. What We DON'T Store</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="text-green-800 font-medium mb-3">We prioritize your security and privacy:</p>
            <ul className="list-disc pl-6 space-y-2 text-green-700">
              <li><strong>Private keys:</strong> Never stored or transmitted through our servers</li>
              <li><strong>Wallet mnemonics:</strong> We cannot access your wallet recovery phrases</li>
              <li><strong>Personal identifying information:</strong> No KYC data, government IDs, or personal documents</li>
              <li><strong>Detailed transaction contents:</strong> Only metadata necessary for service operation</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">3. Data Usage</h3>
          <div className="text-gray-700 mb-6">
            <p className="mb-3">Collected data is used exclusively for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Processing and managing cryptocurrency transfers</li>
              <li>Sending email notifications (when email addresses are provided)</li>
              <li>Improving service performance and user experience</li>
              <li>Maintaining transaction history for user reference</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">4. Data Sharing</h3>
          <p className="text-gray-700 mb-6">
            We do not sell, rent, or share your data with third parties except as necessary to provide our service 
            (e.g., email delivery services) or as required by law.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">5. Data Security</h3>
          <p className="text-gray-700 mb-6">
            We implement industry-standard security measures to protect stored data. However, no system is completely 
            secure, and users should take their own precautions to protect sensitive information.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">6. Data Retention</h3>
          <p className="text-gray-700 mb-6">
            Transaction metadata is retained to maintain service functionality and user transaction history. 
            Users can request data deletion by contacting us, subject to legal and operational requirements.
          </p>
        </section>

        {/* Contact and Legal */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact & Legal</h2>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-3">
              For questions, concerns, or support regarding BubbaPay:
            </p>
            <div className="flex items-center space-x-2 text-gray-700">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
              <span><strong>X:</strong> @BubbaPay_</span>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">Disclaimer</h3>
          <p className="text-gray-700 mb-6">
            BubbaPay is provided "as is" without warranties of any kind. Cryptocurrency transactions carry inherent risks, 
            and users should only transfer amounts they can afford to lose. This service is not intended as financial advice.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">Governing Law</h3>
          <p className="text-gray-700 mb-6">
            These terms are governed by applicable law and any disputes will be resolved through binding arbitration.
          </p>
        </section>

        {/* Footer */}
        <section className="border-t border-gray-200 pt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <h4 className="text-lg font-semibold text-blue-800">Important Reminder</h4>
            </div>
            <p className="text-blue-700">
              Always verify recipient addresses and amounts before confirming transactions. Blockchain transactions are 
              irreversible.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default TermsOfService;
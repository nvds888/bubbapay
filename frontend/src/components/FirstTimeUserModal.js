import React, { useState } from 'react';

function FirstTimeUserModal({ isOpen, onAccept, onClose }) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleAccept = () => {
    if (termsAccepted) {
      onAccept();
    }
  };

  const handleTermsClick = () => {
    // Open terms in new tab
    window.open('/terms', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Welcome to BubbaPay</h2>
              <p className="text-sm text-gray-600">Important information before you start</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Mobile Warning Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Mobile Users: Important Notice</h3>
                <div className="text-amber-700 text-sm space-y-2">
                  <p>
                    Creating claim links can sometimes fail on mobile devices if the webpage unmounts during the wallet signing process. This can happen when switching between apps or browsers.
                  </p>
                  <p className="font-medium">
                    For best results: Use desktop, or ensure a stable mobile session without switching apps during signing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">What happens if something goes wrong?</h3>
                <div className="text-blue-700 text-sm space-y-2">
                  <p>
                    In rare cases where the session is lost during signing, a smart contract may be created without a valid claim URL. This results in a loss of ~0.1 ALGO (platform fee).
                  </p>
                  <p>
                    <span className="font-medium">Good news:</span> You can always reclaim your funds or delete incomplete apps from the "Manage Links" page. If you see a "network error", simply refresh and use the cleanup option.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Features */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-green-800 mb-2">Your funds are always safe</h3>
                <div className="text-green-700 text-sm space-y-1">
                  <p>• Smart contracts ensure you can always reclaim unclaimed funds</p>
                  <p>• All transactions are on the Algorand blockchain</p>
                  <p>• We never store your private keys</p>
                  <p>• Maximum risk is limited to small platform fees (~0.1 ALGO)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms of Service */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Terms of Service & Privacy Policy</h3>
            <p className="text-gray-600 text-sm mb-4">
              By using BubbaPay, you acknowledge the risks of cryptocurrency transactions and agree to our terms. 
              Please read our full terms and privacy policy to understand your rights and responsibilities.
            </p>
            
            <div className="flex items-start space-x-3 mb-4">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="terms-checkbox" className="text-sm text-gray-700 cursor-pointer">
                I have read and agree to the{' '}
                <button
                  onClick={handleTermsClick}
                  className="text-purple-600 hover:text-purple-700 underline font-medium"
                >
                  Terms of Service & Privacy Policy
                </button>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium transition-colors"
            >
              I'll read this later
            </button>
            <button
              onClick={handleAccept}
              disabled={!termsAccepted}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                termsAccepted
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue to BubbaPay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FirstTimeUserModal;
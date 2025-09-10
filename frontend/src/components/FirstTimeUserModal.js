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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Welcome to BubbaPay</h2>
              <p className="text-sm text-gray-600">Quick setup before you start</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 space-y-4">
          {/* Mobile Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Mobile Users</p>
                <p className="text-amber-700">
                  Creating links may fail if your browser session is unmounted during the signing process. 
                  To prevent this, make sure you have a fresh connection, or use desktop for the best experience.
                </p>
              </div>
            </div>
          </div>

          {/* Risk Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">If Something Goes Wrong</p>
                <p className="text-blue-700">
                  You could lose the platform fee - even if you didn't get a claim link. Your funds can always be reclaimed. For more information, please see the Docs & Terms of Service.
                </p>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="terms-checkbox" className="text-sm text-gray-700 cursor-pointer">
                I agree to the{' '}
                <button
                  onClick={handleTermsClick}
                  className="text-purple-600 hover:text-purple-700 underline font-medium"
                >
                  Terms of Service
                </button>
                {' '}and understand the risks of crypto transactions
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleAccept}
              disabled={!termsAccepted}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
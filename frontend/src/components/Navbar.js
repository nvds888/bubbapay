import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import { WalletButton } from '@txnlab/use-wallet-ui-react';

function Navbar({ hideWalletConnection = false }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeAddress } = useWallet();

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <div className="flex items-center space-x-2">
                {/* Replace SVG logo with image */}
                <img
                  src="/bubbapay.jpg"
                  alt="Bubbapay Logo"
                  className="w-7 h-7 rounded-lg object-cover group-hover:scale-110 transition-transform duration-200"
                />
                {/* Keep the bubbapay text (assuming it's here, if not, keep as is) */}
                <div className="flex items-center space-x-1">
                  <span className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                    Bubba<span className="gradient-text">Pay</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 rounded">
                    Beta
                  </span>
                </div>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {/* How It Works Button */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>How it works?</span>
              </button>
              {/* Campaigns Link */}
<Link 
  to="/campaigns" 
  className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-50"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
  <span>Campaigns</span>
</Link>


              {/* Technical Docs Link */}
              <Link 
                to="/docs" 
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Docs</span>
              </Link>

              {/* My Transactions Link - Only when wallet connected */}
              {!hideWalletConnection && activeAddress && (
                <Link 
                  to="/transactions" 
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>History</span>
                </Link>
              )}
              
              {!hideWalletConnection && (
                <div className="flex items-center">
                  {/* Use-wallet button with explicit styling */}
                  <div data-wallet-ui className="wallet-button-container">
                    <WalletButton className="btn-primary px-4 py-2 text-sm font-medium" />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className={`md:hidden transition-all duration-200 overflow-hidden ${
            isMobileMenuOpen ? 'max-h-64 opacity-100 pb-4' : 'max-h-0 opacity-0'
          }`}>
            <div className="pt-2 space-y-2 border-t border-gray-200">
              {/* How It Works Button - Mobile */}
              <button 
                onClick={() => {
                  setIsModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 font-medium py-2 px-3 rounded-lg text-left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>How it works?</span>
              </button>
              {/* Campaigns Link - Mobile */}
<Link 
  to="/campaigns" 
  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 font-medium py-2 px-3 rounded-lg"
  onClick={() => setIsMobileMenuOpen(false)}
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
  <span>Campaigns</span>
</Link>

              {/* Technical Docs Link */}
              <Link 
                to="/docs" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 font-medium py-2 px-3 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Docs</span>
              </Link>

              {/* My Transactions Link */}
              {!hideWalletConnection && activeAddress && (
                <Link 
                  to="/transactions" 
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 font-medium py-2 px-3 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>My Transactions</span>
                </Link>
              )}
              
              {!hideWalletConnection && (
                <div className="pt-2">
                  {/* Mobile wallet button */}
                  <div data-wallet-ui className="w-full">
                    <WalletButton />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* How It Works Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Modal content */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How BubbaPay Works</h2>
              <img 
                src="/bubbaillustration.png" 
                alt="How BubbaPay Works" 
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import { WalletButton } from '@txnlab/use-wallet-ui-react';

function Navbar({ hideWalletConnection = false }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { activeAddress } = useWallet();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                   style={{background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)'}}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                  Nomizo<span className="gradient-text">Pay</span>
                </span>
                <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 rounded">
                  Beta
                </span>
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
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
            {/* Technical Docs Link */}
            <Link 
              to="/docs" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 font-medium py-2 px-3 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Technical Docs</span>
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
  );
}

export default Navbar;
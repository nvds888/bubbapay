import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar({ accountAddress, onConnectWallet, onDisconnectWallet, hideWalletConnection = false }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Format account address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className="relative">
      {/* Gradient background with blur effect */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-lg border-b border-purple-500/20"></div>
      
      <div className="relative container mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">
                Nomizo <span className="gradient-text">Pay</span>
              </span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Technical Docs Link - Always visible */}
            <Link 
              to="/docs" 
              className="text-gray-300 hover:text-white transition-colors duration-300 font-medium relative group flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Technical Docs</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-600 group-hover:w-full transition-all duration-300"></span>
            </Link>

            {/* My Transactions Link - Only when wallet connected and not on claim page */}
            {!hideWalletConnection && accountAddress && (
              <Link 
                to="/transactions" 
                className="text-gray-300 hover:text-white transition-colors duration-300 font-medium relative group flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>My Transactions</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
            
            {!hideWalletConnection && (
              <>
                {accountAddress ? (
                  <div className="flex items-center space-x-4">
                    {/* Address display with glow effect */}
                    <div className="glass-dark px-3 py-2 rounded-lg">
                      <span className="text-purple-300 text-sm font-mono">
                        {formatAddress(accountAddress)}
                      </span>
                    </div>
                    
                    {/* Disconnect button */}
                    <button
                      onClick={onDisconnectWallet}
                      className="btn-secondary px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onConnectWallet}
                    className="btn-primary px-6 py-2 rounded-lg text-sm font-semibold relative overflow-hidden"
                  >
                    <span className="relative z-10">Connect Wallet</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-purple-500/10 transition-colors duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 space-y-4 border-t border-purple-500/20">
            {/* Technical Docs Link - Always visible on mobile */}
            <Link 
              to="/docs" 
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300 font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Technical Docs</span>
            </Link>

            {/* My Transactions Link - Only when wallet connected and not on claim page */}
            {!hideWalletConnection && accountAddress && (
              <Link 
                to="/transactions" 
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300 font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>My Transactions</span>
              </Link>
            )}
            
            {!hideWalletConnection && (
              <>
                {accountAddress ? (
                  <div className="space-y-3">
                    <div className="glass-dark px-3 py-2 rounded-lg inline-block">
                      <span className="text-purple-300 text-sm font-mono">
                        {formatAddress(accountAddress)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => {
                        onDisconnectWallet();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full btn-secondary px-4 py-2 rounded-lg text-sm font-medium text-left"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onConnectWallet();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full btn-primary px-6 py-2 rounded-lg text-sm font-semibold"
                  >
                    Connect Wallet
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
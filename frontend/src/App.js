// src/App.js - Updated with clean white theme
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PeraWalletConnect } from '@perawallet/connect';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SendFlow from './components/SendFlow';
import ClaimPage from './components/ClaimPage';
import TransactionsPage from './components/TransactionsPage';
import SuccessPage from './components/SuccessPage';
import SigningPage from './components/SigningPage';
import DocumentationPage from './components/DocumentationPage';
import './App.css';

// Initialize Pera Wallet connector
const peraWallet = new PeraWalletConnect({
  shouldShowSignTxnToast: true
});

// Component to handle location-based logic
function AppContent() {
  const location = useLocation();
  const [accountAddress, setAccountAddress] = React.useState(null);
  
  // Check if we're on pages that handle their own wallet connection
  const isClaimPage = location.pathname === '/claim';
  const isSigningPage = location.pathname.startsWith('/sign/');
  const handlesOwnWallet = isClaimPage || isSigningPage;
  
  // Handle wallet connection on app load
  React.useEffect(() => {
    // Only reconnect session if not on pages that handle their own wallet connection
    if (!handlesOwnWallet) {
      peraWallet.reconnectSession().then((accounts) => {
        if (accounts.length) {
          setAccountAddress(accounts[0]);
        }
      });
    }

    // Handle disconnect event
    peraWallet.connector?.on('disconnect', () => {
      setAccountAddress(null);
    });
  }, [handlesOwnWallet]);
  
  // Handle connect wallet button click
  const handleConnectWalletClick = async () => {
    try {
      const newAccounts = await peraWallet.connect();
      setAccountAddress(newAccounts[0]);
    } catch (error) {
      console.error('Error connecting to Pera Wallet:', error);
    }
  };
  
  // Handle disconnect wallet
  const handleDisconnectWalletClick = async () => {
    await peraWallet.disconnect();
    setAccountAddress(null);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Clean background - minimal decoration */}
      {!isSigningPage && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-32 left-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-20"></div>
        </div>
      )}

      {/* Navigation - hide on claim and signing pages */}
      {!handlesOwnWallet && (
        <Navbar 
          accountAddress={accountAddress}
          onConnectWallet={handleConnectWalletClick}
          onDisconnectWallet={handleDisconnectWalletClick}
          hideWalletConnection={false}
        />
      )}
      
      {/* Main content */}
      <main className={`flex-grow relative z-10 ${
        isSigningPage ? '' : 'py-4 sm:py-6 lg:py-8'
      }`}>
        <Routes>
          {/* Main send flow */}
          <Route 
            path="/" 
            element={
              <SendFlow 
                accountAddress={accountAddress} 
                peraWallet={peraWallet}
              />
            } 
          />

          {/* Send flow with MCP session support */}
          <Route 
            path="/send" 
            element={
              <SendFlow 
                accountAddress={accountAddress} 
                peraWallet={peraWallet}
              />
            } 
          />
          
          {/* Claim page (handles own wallet connection) */}
          <Route 
            path="/claim" 
            element={
              <div className="max-w-2xl mx-auto px-4">
                <ClaimPage peraWallet={peraWallet} />
              </div>
            } 
          />
          
          {/* MCP Signing page (full screen, handles own wallet connection) */}
          <Route 
            path="/sign/:sessionToken" 
            element={<SigningPage />} 
          />
          
          {/* Transactions page (requires wallet connection) */}
          <Route 
            path="/transactions" 
            element={
              accountAddress ? (
                <div className="max-w-6xl mx-auto px-4">
                  <TransactionsPage 
                    accountAddress={accountAddress} 
                    peraWallet={peraWallet} 
                  />
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          {/* Success page */}
          <Route 
            path="/success/:escrowId" 
            element={
              <div className="max-w-2xl mx-auto px-4">
                <SuccessPage />
              </div>
            } 
          />
          
          {/* Documentation */}
          <Route 
            path="/docs" 
            element={
              <div className="max-w-4xl mx-auto px-4">
                <DocumentationPage />
              </div>
            } 
          />
          
          {/* 404 redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* Footer - hide on signing page */}
      {!isSigningPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

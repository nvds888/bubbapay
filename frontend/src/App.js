import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PeraWalletConnect } from '@perawallet/connect';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SendFlow from './components/SendFlow';
import ClaimPage from './components/ClaimPage';
import TransactionsPage from './components/TransactionsPage';
import SuccessPage from './components/SuccessPage';
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
  
  // Check if we're on the claim page
  const isClaimPage = location.pathname === '/claim';
  
  // Handle wallet connection on app load
  React.useEffect(() => {
    // Only reconnect session if not on claim page (claim page handles its own wallet connection)
    if (!isClaimPage) {
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
  }, [isClaimPage]);
  
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
    <div className="min-h-screen flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation - hide wallet connection on claim page */}
      <Navbar 
        accountAddress={isClaimPage ? null : accountAddress}
        onConnectWallet={isClaimPage ? () => {} : handleConnectWalletClick}
        onDisconnectWallet={isClaimPage ? () => {} : handleDisconnectWalletClick}
        hideWalletConnection={isClaimPage}
      />
      
      {/* Main content */}
      <main className="flex-grow relative z-10">
        <div className="container mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <Routes>
            <Route 
              path="/" 
              element={
                <div className="max-w-2xl mx-auto">
                  <SendFlow 
                    accountAddress={accountAddress} 
                    peraWallet={peraWallet}
                  />
                </div>
              } 
            />
            <Route 
              path="/claim" 
              element={
                <div className="max-w-2xl mx-auto">
                  <ClaimPage peraWallet={peraWallet} />
                </div>
              } 
            />
            <Route 
              path="/transactions" 
              element={
                accountAddress ? 
                <TransactionsPage 
                  accountAddress={accountAddress} 
                  peraWallet={peraWallet} 
                /> : 
                <Navigate to="/" replace />
              } 
            />
            <Route 
              path="/success/:escrowId" 
              element={
                <div className="max-w-2xl mx-auto">
                  <SuccessPage />
                </div>
              } 
            />
            <Route 
              path="/docs" 
              element={
                <div className="max-w-4xl mx-auto">
                  <DocumentationPage />
                </div>
              } 
            />
          </Routes>
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
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

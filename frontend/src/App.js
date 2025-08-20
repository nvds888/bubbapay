// src/App.js 
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
} from '@txnlab/use-wallet-react';
import { WalletUIProvider } from '@txnlab/use-wallet-ui-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SendFlow from './components/SendFlow';
import ClaimPage from './components/ClaimPage';
import TransactionsPage from './components/TransactionsPage';
import SuccessPage from './components/SuccessPage';
import WhiteLabelPage from './components/WhiteLabelPage';
import SigningPage from './components/SigningPage';
import DocumentationPage from './components/DocumentationPage';
import '@txnlab/use-wallet-ui-react/dist/style.css';
import './App.css';

// Configure wallets
const walletManager = new WalletManager({
  wallets: [
    WalletId.PERA,
    WalletId.DEFLY,
    WalletId.LUTE,
    WalletId.WALLETCONNECT,
    // Add more wallets as needed
  ],
  defaultNetwork: NetworkId.MAINNET, 
});

// Component to handle location-based logic
function AppContent() {
  const location = useLocation();
  const isClaimPage = location.pathname === '/claim';
  
  if (isClaimPage) {
    // Claim page handles its own wallet connection
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <ClaimPage />
        </div>
      </div>
    );
  }
  
  // All other pages get normal wallet functionality
  return (
    <WalletProvider manager={walletManager}>
      <WalletUIProvider>
        <div className="min-h-screen flex flex-col bg-white">
          {/* Clean background - minimal decoration */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute bottom-32 left-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-20"></div>
          </div>

          <Navbar hideWalletConnection={false} />
          
          <main className="flex-grow relative z-10 py-4 sm:py-6 lg:py-8">
            <Routes>
              <Route path="/" element={<SendFlow />} />
              <Route path="/send" element={<SendFlow />} />
              <Route path="/transactions" element={
                <div className="max-w-6xl mx-auto px-4">
                  <TransactionsPage />
                </div>
              } />
              <Route path="/success/:escrowId" element={
                <div className="max-w-2xl mx-auto px-4">
                  <SuccessPage />
                </div>
              } />
              <Route path="/docs" element={
                <div className="max-w-4xl mx-auto px-4">
                  <DocumentationPage />
                </div>   
              } />
              <Route path="/widget" element={
  <div className="max-w-4xl mx-auto px-4">
    <WhiteLabelPage /> 
  </div>
} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </WalletUIProvider>
    </WalletProvider>
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

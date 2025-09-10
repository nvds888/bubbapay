// src/App.js 
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
  useWallet,
} from '@txnlab/use-wallet-react';
import { WalletUIProvider } from '@txnlab/use-wallet-ui-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SendFlow from './components/SendFlow';
import ClaimPage from './components/ClaimPage';
import TransactionsPage from './components/TransactionsPage';
import SuccessPage from './components/SuccessPage';
import TermsOfService from './components/TermsOfService';
import DocumentationPage from './components/DocumentationPage';
import FirstTimeUserModal from './components/FirstTimeUserModal';
import { handleReferralFromURL, extractAndSaveReferralFromURL } from './services/referralService';
import '@txnlab/use-wallet-ui-react/dist/style.css';
import './App.css';

// Configure wallets
const walletManager = new WalletManager({
  wallets: [
    WalletId.PERA,
    WalletId.DEFLY,
    WalletId.LUTE,
    // Add more wallets as needed
  ],
  defaultNetwork: NetworkId.MAINNET, 
});

// First-time modal localStorage constants
const FIRST_TIME_STORAGE_KEY = 'bubbapay_first_time_accepted';
const FIRST_TIME_EXPIRY_DAYS = 7;

// Helper functions for first-time modal
const shouldShowFirstTimeModal = () => {
  const stored = localStorage.getItem(FIRST_TIME_STORAGE_KEY);
  if (!stored) return true;
  
  try {
    const { timestamp } = JSON.parse(stored);
    const now = Date.now();
    const daysPassed = (now - timestamp) / (1000 * 60 * 60 * 24);
    
    return daysPassed >= FIRST_TIME_EXPIRY_DAYS;
  } catch {
    return true;
  }
};

const markFirstTimeAccepted = () => {
  localStorage.setItem(FIRST_TIME_STORAGE_KEY, JSON.stringify({
    accepted: true,
    timestamp: Date.now()
  }));
};

// Referral notification component
function ReferralNotification({ show, onClose }) {
  if (!show) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-800">Welcome to Bubbapay!</h4>
            <p className="text-sm text-green-700 mt-1">
              You've been referred! Your referrer will earn from your transactions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Main app component with referral handling and first-time modal
function MainAppWithReferrals({ 
  referralProcessed, 
  setReferralProcessed, 
  showReferralNotification, 
  setShowReferralNotification 
}) {
  const { activeAddress } = useWallet();
  
  // First-time modal state
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);

  // Check if first-time modal should be shown
  useEffect(() => {
    if (shouldShowFirstTimeModal()) {
      setShowFirstTimeModal(true);
    }
  }, []);

  // Handle first-time modal acceptance
  const handleFirstTimeAccept = () => {
    markFirstTimeAccepted();
    setShowFirstTimeModal(false);
  };

  // Handle first-time modal close (without accepting)
  const handleFirstTimeClose = () => {
    setShowFirstTimeModal(false);
  };

  // Handle referral linking when wallet connects
  useEffect(() => {
    const processReferralLink = async () => {
      if (activeAddress && !referralProcessed) {
        try {
          const result = await handleReferralFromURL(activeAddress);
          
          if (result.linked) {
            console.log(`Successfully linked to referrer: ${result.referrer}`);
            setShowReferralNotification(true);
            // Auto-hide notification after 5 seconds
            setTimeout(() => setShowReferralNotification(false), 5000);
          } else if (result.reason && !result.reason.includes('No referral code')) {
            console.log('Referral linking result:', result.reason);
          }
          
          setReferralProcessed(true);
        } catch (error) {
          console.error('Error processing referral link:', error);
          setReferralProcessed(true);
        }
      }
    };

    if (activeAddress) {
      processReferralLink();
    } else {
      // Reset when wallet disconnects
      setReferralProcessed(false);
      setShowReferralNotification(false);
    }
  }, [activeAddress, referralProcessed, setReferralProcessed, setShowReferralNotification]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* First-time user modal */}
      <FirstTimeUserModal
        isOpen={showFirstTimeModal}
        onAccept={handleFirstTimeAccept}
        onClose={handleFirstTimeClose}
      />

      {/* Referral notification */}
      <ReferralNotification 
        show={showReferralNotification} 
        onClose={() => setShowReferralNotification(false)}
      />

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
          <Route path="/terms" element={
            <div className="max-w-4xl mx-auto px-4">
              <TermsOfService />
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

// Component to handle location-based logic
function AppContent() {
  const location = useLocation();
  const isClaimPage = location.pathname === '/claim';
  
  // Referral state for non-claim pages
  const [referralProcessed, setReferralProcessed] = useState(false);
  const [showReferralNotification, setShowReferralNotification] = useState(false);
  
  // Extract and save referral code when app loads or location changes
  useEffect(() => {
    extractAndSaveReferralFromURL();
  }, [location]);
  
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
  
  // All other pages get normal wallet functionality with referral handling and first-time modal
  return (
    <WalletProvider manager={walletManager}>
      <WalletUIProvider>
        <MainAppWithReferrals 
          referralProcessed={referralProcessed}
          setReferralProcessed={setReferralProcessed}
          showReferralNotification={showReferralNotification}
          setShowReferralNotification={setShowReferralNotification}
        />
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

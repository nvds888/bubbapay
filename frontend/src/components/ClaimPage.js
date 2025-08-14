import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import { WalletButton } from '@txnlab/use-wallet-ui-react';
import { 
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
} from '@txnlab/use-wallet-react';
import { WalletUIProvider } from '@txnlab/use-wallet-ui-react';
import { Transak } from "@transak/transak-sdk"; // NEW: Import Transak SDK
import axios from 'axios';
import algosdk from 'algosdk';

const getAssetInfo = (assetId) => {
  const assets = {
    31566704: { id: 31566704, name: 'USDC', symbol: 'USDC', decimals: 6 },
    760037151: { id: 760037151, name: 'xUSD', symbol: 'xUSD', decimals: 6 },
    2494786278: { id: 2494786278, name: 'Monko', symbol: 'MONKO', decimals: 6 },
    2726252423: { id: 2726252423, name: 'Alpha', symbol: 'ALPHA', decimals: 6 }
  };
  return assets[parseInt(assetId)] || { id: assetId, name: 'Unknown Asset', symbol: 'ASA', decimals: 6 };
};

const getDisplaySymbol = (assetInfo) => {
  return assetInfo?.symbol || 'USDC';
};

// NEW: Transak configuration
const TRANSAK_CONFIG = {
  apiKey: process.env.REACT_APP_TRANSAK_API_KEY || "a2374be4-c59a-400e-809b-72c226c74b8f", // Use staging key as fallback
  environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'STAGING',
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const createClaimWalletManager = () => new WalletManager({
  wallets: [
    WalletId.PERA,
    WalletId.DEFLY,
    WalletId.LUTE,
  ],
  defaultNetwork: NetworkId.MAINNET,
});

// Main ClaimPage component - updated with Transak option
function ClaimPage() {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('app');
  
  const getPrivateKeyFromFragment = () => {
    const fragment = window.location.hash.substring(1);
    const fragmentParams = new URLSearchParams(fragment);
    return fragmentParams.get('key');
  };

  const tempPrivateKey = getPrivateKeyFromFragment();
  
  const [escrowDetails, setEscrowDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [assetInfo, setAssetInfo] = useState(null);
  // NEW: Transak state management
  const [showTransakOption, setShowTransakOption] = useState(false);
  const [claimMethod, setClaimMethod] = useState(null); // 'wallet' or 'bank'

  // Ecosystem projects data
  const ecosystemProjects = [
    {
      name: "Alpha Arcade",
      description: "Play on the prediction market",
      url: "https://www.alphaarcade.com/",
      icon: "🎮",
      gradient: "from-blue-400 to-blue-600"
    },
    {
      name: "Vestige",
      description: "Buy memecoins and trending tokens",
      url: "https://vestige.fi/",
      icon: "🚀",
      gradient: "from-purple-400 to-purple-600"
    },
    {
      name: "Lofty.ai",
      description: "Invest in fractional real estate",
      url: "https://www.lofty.ai/",
      icon: "🏠",
      gradient: "from-green-400 to-green-600"
    }
  ];
  
  // Load escrow details when component mounts
  useEffect(() => {
    const fetchEscrowDetails = async () => {
      if (!tempPrivateKey || !appId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/escrow/${appId}`);
        setEscrowDetails(response.data);
        
        const escrowAssetInfo = getAssetInfo(response.data.assetId);
        setAssetInfo(escrowAssetInfo);
        
        // NEW: Only show Transak option for USDC on Algorand (asset ID 31566704)
        const isUSDCAlgorand = response.data.assetId === 31566704;
        setShowTransakOption(isUSDCAlgorand);
        
        if (response.data.claimed) {
          setError('These funds have already been claimed');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching escrow details:', error);
        setError('Failed to fetch transfer details. The link may be invalid.');
        setIsLoading(false);
      }
    };
    
    fetchEscrowDetails();
  }, [tempPrivateKey, appId]);

  // NEW: Initialize Transak Stream for bank transfer
  const handleSendToBank = async () => {
    if (!escrowDetails || !assetInfo) return;

    try {
      setIsLoading(true);
      setClaimMethod('bank');
      
      const transak = new Transak({
        apiKey: TRANSAK_CONFIG.apiKey,
        environment: TRANSAK_CONFIG.environment === 'PRODUCTION' ? 
          Transak.ENVIRONMENTS.PRODUCTION : Transak.ENVIRONMENTS.STAGING,
        isTransakStreamOffRamp: true,
        cryptoCurrencyCode: "USDC",
        network: "algorand",
        defaultCryptoAmount: escrowDetails.amount,
        themeColor: '10B981',
      });

      // Set up event listeners
      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, async (eventData) => {
        console.log('Transak widget closed with data:', eventData);
        
        if (eventData?.offRampStreamWalletAddress) {
          // User completed setup, now claim directly to their Transak address
          await claimToTransakWallet(eventData.offRampStreamWalletAddress);
        } else {
          // User cancelled
          setClaimMethod(null);
          setIsLoading(false);
        }
        
        transak.close();
      });

      transak.init();
      
    } catch (error) {
      console.error('Error initializing Transak:', error);
      setError('Failed to initialize bank transfer option');
      setClaimMethod(null);
      setIsLoading(false);
    }
  };

  // NEW: Claim USDC directly to Transak wallet address
  const claimToTransakWallet = async (transakAddress) => {
    try {
      console.log("Claiming USDC directly to Transak wallet:", transakAddress);
      
      // Generate optimized claim transaction to Transak address
      const response = await axios.post(`${API_URL}/generate-optimized-claim`, {
        tempPrivateKey,
        appId,
        recipientAddress: transakAddress,
        assetId: escrowDetails.assetId
      });
      
      // Submit the claim transaction (auto-signed by temp account)
      const submitData = {
        signedTransactions: response.data.signedTransactions,
        appId,
        recipientAddress: transakAddress,
        tempPrivateKey,
        type: 'transak-offramp'
      };
      
      const claimResponse = await axios.post(`${API_URL}/submit-optimized-claim`, submitData);
      
      if (claimResponse.data.success) {
        console.log('USDC claimed successfully to Transak wallet!');
        // Show success - funds will be deposited to bank automatically
        setError(null);
        alert(`Success! Your ${escrowDetails.amount} USDC will be deposited to your bank account within minutes via Transak.`);
        // Optionally redirect or show success state
        window.location.reload(); // Refresh to show claimed state
      } else {
        setError(claimResponse.data.error || 'Failed to claim to bank');
        setClaimMethod(null);
      }
      
    } catch (error) {
      console.error('Error claiming to Transak wallet:', error);
      setError(error.response?.data?.error || 'Failed to process bank transfer');
      setClaimMethod(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Enable wallet functionality for crypto wallet option
  const enableWallet = () => {
    const clearWalletStorage = () => {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('wallet') || 
          key.includes('pera') || 
          key.includes('defly') || 
          key.includes('exodus') || 
          key.includes('lute') ||
          key.includes('use-wallet') ||
          key.includes('walletconnect') ||
          key.includes('WCM_VERSION')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      console.log('Cleared wallet storage for fresh connection choice');
    };
    
    clearWalletStorage();
    setWalletEnabled(true);
    setClaimMethod('wallet');
  };
  
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };
  
  // UPDATED: Render content without wallet - now with Transak option for USDC
  const renderContentWithoutWallet = (assetInfo) => {
    if (!tempPrivateKey || !appId) {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Claim Link</h3>
          <p className="text-gray-600 text-sm">Please check the URL and try again. Both private key and app ID are required.</p>
        </div>
      );
    }
    
    if (isLoading && !escrowDetails) {
      return (
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 spinner"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Transfer Details</h3>
          <p className="text-gray-600 text-sm">Please wait while we fetch your transfer information...</p>
        </div>
      );
    }

    // NEW: Show processing state for bank transfer
    if (claimMethod === 'bank' && isLoading) {
      return (
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 spinner"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Bank Transfer</h3>
          <p className="text-gray-600 text-sm">Setting up your direct bank deposit...</p>
        </div>
      );
    }
    
    if (escrowDetails?.claimed || (error && error.includes('already been claimed'))) {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Already Claimed</h3>
          <p className="text-red-600 mb-4 text-sm">These funds have already been claimed or reclaimed by the creator</p>
          {escrowDetails && (
            <p className="text-gray-500 text-sm mb-4">
              Amount: {formatAmount(escrowDetails.amount)} {assetInfo?.symbol || 'tokens'}
            </p>
          )}
          <button
            onClick={() => window.open(window.location.origin, '_blank')}
            className="btn-primary px-4 py-2 font-medium"
          >
            Send Your Own {assetInfo?.symbol || 'Assets'}
          </button>
        </div>
      );
    }
    
    if (error && !escrowDetails) {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-4 py-2 font-medium"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    // UPDATED: Show claim options - wallet connect or direct to bank for USDC
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        
        {escrowDetails && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              You've received {formatAmount(escrowDetails.amount)} {assetInfo?.symbol || 'tokens'}! 🎉
            </h2>
            <p className="text-gray-600 mb-4">
              Choose how you'd like to receive your funds
            </p>
            {escrowDetails.payRecipientFees && (
              <div className="text-xs text-gray-500">
                Fees covered by sender
              </div>
            )}
          </div>
        )}
        
        {/* NEW: Choice between wallet and bank (only for USDC) */}
        <div className="space-y-3">
          {/* NEW: Send to Bank option - only for USDC */}
          {showTransakOption && (
            <button
              onClick={handleSendToBank}
              disabled={isLoading}
              className="w-full btn-primary px-6 py-3 font-medium flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Send to Bank Account</span>
              <div className="text-xs bg-blue-500 px-2 py-0.5 rounded-full">
                Instant
              </div>
            </button>
          )}
          
          {/* Separator for USDC */}
          {showTransakOption && (
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="px-3 text-gray-500 text-sm">or</div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          )}
          
          {/* Connect Wallet option */}
          <button
            onClick={enableWallet}
            className={`w-full px-6 py-3 font-medium flex items-center justify-center space-x-3 ${
              showTransakOption ? 'btn-secondary' : 'btn-primary'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Connect Crypto Wallet</span>
          </button>
        </div>

        {/* NEW: Show explanation for USDC */}
        {showTransakOption && (
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>💳 <strong>Bank transfer:</strong> Get fiat directly in your bank account</p>
            <p>🔐 <strong>Crypto wallet:</strong> Receive {assetInfo?.symbol} in your wallet</p>
          </div>
        )}
      </div>
    );
  };
  
  // If wallet is not enabled, show the non-wallet UI
  if (!walletEnabled) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-32 left-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-20"></div>
        </div>
        
        <div className="w-full max-w-lg mx-auto relative z-10">
          <div className="card card-normal min-w-[20rem] sm:min-w-[28rem] w-full">
            <div className="text-center mb-6">
              <img
                src="/bubbapay.jpg"
                alt="Bubbapay Logo"
                className="w-12 h-12 rounded-lg object-cover mb-3 mx-auto"
              />
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Claim your internet money</h1>
              <p className="text-gray-600 text-sm">Secure and instant on Algorand</p>
            </div>
            
            <div className="min-h-[200px] flex items-center justify-center">
              {renderContentWithoutWallet(assetInfo)}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If wallet is enabled, render with wallet functionality
  return (
    <WalletProvider manager={createClaimWalletManager()}>
      <WalletUIProvider>
        <ClaimPageWithWallet 
          appId={appId}
          tempPrivateKey={tempPrivateKey}
          escrowDetails={escrowDetails}
          ecosystemProjects={ecosystemProjects}
          assetInfo={assetInfo}
        />
      </WalletUIProvider>
    </WalletProvider>
  );
}

// ClaimPageWithWallet component (unchanged from original)
function ClaimPageWithWallet({ appId, tempPrivateKey, escrowDetails, ecosystemProjects, assetInfo }) {
  const { activeAddress, signTransactions } = useWallet();
  const [accountAddress, setAccountAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [claimStatus, setClaimStatus] = useState('initial');
  const [isFunding, setIsFunding] = useState(false);
  const [autoClickTriggered, setAutoClickTriggered] = useState(false);
  const [fundingDetails, setFundingDetails] = useState(null);
  const [isOptedIn, setIsOptedIn] = useState(false);

  // Auto-trigger wallet button click when component mounts
  useEffect(() => {
    if (!autoClickTriggered) {
      const timer = setTimeout(() => {
        const walletButton = document.querySelector('[data-wallet-ui] button');
        if (walletButton) {
          walletButton.click();
          setAutoClickTriggered(true);
          console.log('Auto-triggered wallet selection modal');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [autoClickTriggered]);
  
  // Handle wallet connection
  useEffect(() => {
    if (activeAddress) {
      setAccountAddress(activeAddress);
      console.log('Fresh wallet connected on claim page:', activeAddress);
    } else {
      setAccountAddress(null);
      setClaimStatus('initial');
      setError(null);
    }
  }, [activeAddress]);
  
  // Check wallet status when connected - HANDLES UNFUNDED ACCOUNTS
  useEffect(() => {
    const checkWalletStatus = async () => {
      if (!accountAddress || !escrowDetails) return;
      
      setClaimStatus('checking');
      setIsLoading(true);
      
      try {
        const targetAssetId = escrowDetails.assetId || 31566704;
        const optInResponse = await axios.get(`${API_URL}/check-optin/${accountAddress}/${targetAssetId}`);
        const hasOptedIn = optInResponse.data.hasOptedIn;
        
        setIsOptedIn(hasOptedIn);
        
        if (hasOptedIn) {
          setClaimStatus('ready-to-claim-optimized');
        } else {
          setClaimStatus('ready-to-optin-and-claim');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking wallet status:', error);
        
        if (error.response?.status === 404 || 
            error.response?.data?.error?.includes('account does not exist') ||
            error.response?.data?.error?.includes('account not found')) {
          console.log('Unfunded account detected, assuming needs opt-in');
          setIsOptedIn(false);
          setClaimStatus('ready-to-optin-and-claim');
          setIsLoading(false);
        } else {
          setError('Failed to check your wallet status');
          setIsLoading(false);
        }
      }
    };
    
    if (accountAddress && escrowDetails) {
      checkWalletStatus();
    }
  }, [accountAddress, escrowDetails]);
  
  // Handle optimized claim (for users already opted in)
  const handleOptimizedClaim = async () => {
    if (!accountAddress || !tempPrivateKey || !appId) return;
    
    setIsLoading(true);
    setError(null);
    setClaimStatus('claiming');
    
    try {
      console.log("Generating optimized claim transaction...");
      
      const response = await axios.post(`${API_URL}/generate-optimized-claim`, {
        tempPrivateKey,
        appId,
        recipientAddress: accountAddress,
        assetId: escrowDetails.assetId
      });
      
      console.log("Submitting optimized claim transaction...");
      
      const submitData = {
        signedTransactions: response.data.signedTransactions,
        appId,
        recipientAddress: accountAddress,
        tempPrivateKey,
        type: 'optimized-claim'
      };
      
      const claimResponse = await axios.post(`${API_URL}/submit-optimized-claim`, submitData);
      
      if (claimResponse.data.success) {
        console.log(`${assetInfo?.symbol || 'Asset'} claimed successfully with optimized flow!`);
        setClaimStatus('success');
      } else {
        setError(claimResponse.data.error || 'Failed to claim');
        setClaimStatus('ready-to-claim-optimized');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error(`Error with optimized claim:`, error);
      setError(error.response?.data?.error || `Failed to claim ${assetInfo?.symbol || 'asset'}. Please try again.`);
      setClaimStatus('ready-to-claim-optimized');
      setIsLoading(false);
    }
  };

  // Handle opt-in and claim (for users who need to opt-in)
  const handleOptInAndClaim = async () => {
    if (!accountAddress || !tempPrivateKey || !appId) return;
    
    setIsLoading(true);
    setError(null);
    setClaimStatus('claiming');
    
    try {
      console.log("Generating opt-in and claim group transaction...");
      
      const response = await axios.post(`${API_URL}/generate-optin-and-claim`, {
        tempPrivateKey,
        appId,
        recipientAddress: accountAddress,
        assetId: escrowDetails.assetId
      });
      
      console.log("Group transaction generated, user needs to sign opt-in transaction");
      
      const userTxnIndex = response.data.userTxnIndex;
      const unsignedTxns = response.data.unsignedTransactions.map(txnB64 => {
        const txnUint8 = new Uint8Array(Buffer.from(txnB64, 'base64'));
        return algosdk.decodeUnsignedTransaction(txnUint8);
      });

      const signedUserTxns = await signTransactions(unsignedTxns);
      const userSignedTxn = signedUserTxns[userTxnIndex];

      const finalSignedTxns = [...response.data.partiallySignedTransactions];
      finalSignedTxns[userTxnIndex] = Buffer.from(userSignedTxn).toString('base64');
      
      console.log("Submitting complete group transaction...");
      
      const submitData = {
        signedTransactions: finalSignedTxns,
        appId,
        recipientAddress: accountAddress,
        tempPrivateKey,
        type: 'optin-and-claim'
      };
      
      const claimResponse = await axios.post(`${API_URL}/submit-optimized-claim`, submitData);
      
      if (claimResponse.data.success) {
        console.log(`${assetInfo?.symbol || 'Asset'} opted in and claimed successfully!`);
        setClaimStatus('success');
      } else {
        setError(claimResponse.data.error || 'Failed to opt-in and claim');
        setClaimStatus('ready-to-optin-and-claim');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error(`Error with opt-in and claim:`, error);
      setError(error.response?.data?.error || `Failed to opt-in and claim ${assetInfo?.symbol || 'asset'}. You have insufficient Algo.`);
      setClaimStatus('ready-to-optin-and-claim');
      setIsLoading(false);
    }
  };
  
  const formatAmount = (amount) => parseFloat(amount).toFixed(2);
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Render wallet-connected content (keeping original implementation)
  const renderWalletContent = () => {
    if (!accountAddress) {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          
          {escrowDetails && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                You've received {formatAmount(escrowDetails.amount)} {assetInfo?.symbol || 'tokens'}! 🎉
              </h2>
              <p className="text-gray-600">
                Connect your wallet to claim the funds
              </p>
              {escrowDetails.payRecipientFees && (
                <div className="mt-2 text-xs text-gray-500">
                  Fees covered by sender
                </div>
              )}
            </div>
          )}
          
          <div data-wallet-ui className="wallet-button-container">
            <WalletButton className="btn-primary px-6 py-3 font-medium" />
          </div>
        </div>
      );
    }
    
    if (claimStatus === 'checking' || (isLoading && !['initial', 'success'].includes(claimStatus))) {
      return (
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 spinner"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {claimStatus === 'claiming' 
              ? `Claiming Your ${assetInfo?.symbol || 'Asset'}...` 
              : `Preparing claim for ${assetInfo?.symbol || 'Asset'}`}
          </h3>
          <p className="text-gray-600 text-sm">
            {claimStatus === 'claiming' 
              ? `Processing your transaction...` 
              : `Checking your wallet setup...`}
          </p>
          
          <div className="mt-4 card card-compact inline-block">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-purple-600 text-sm font-medium">Connected Wallet</div>
                <div className="text-gray-900 font-mono text-sm">{formatAddress(accountAddress)}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // User needs to opt-in - show combined opt-in and claim button
    if (claimStatus === 'ready-to-optin-and-claim') {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Ready to Opt-in & Claim!</h2>
          <p className="text-gray-600 mb-2">
            Get your <span className="text-blue-600 font-semibold">{formatAmount(escrowDetails.amount)} {assetInfo?.symbol || 'tokens'}</span> in one transaction
          </p>
          <p className="text-gray-500 text-sm mb-6">
            This will opt your wallet into {assetInfo?.name || 'the asset'} and claim your funds
          </p>
          
          {escrowDetails?.payRecipientFees && (
            <div className="mb-4 card card-compact inline-block">
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Fees covered by sender</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleOptInAndClaim}
            disabled={isLoading}
            className="btn-primary px-6 py-3 font-medium"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 spinner"></div>
                <span>Processing...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Opt-in & Claim {assetInfo?.symbol || 'Asset'}</span>
              </span>
            )}
          </button>
          
          {error && (
            <div className="mt-4 status-error">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      );
    }
    
    // User is already opted in - show optimized claim button
    if (claimStatus === 'ready-to-claim-optimized') {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Ready to Claim!</h2>
          <p className="text-gray-600 mb-6">
            Claim your <span className="text-green-600 font-semibold">{formatAmount(escrowDetails.amount)} {assetInfo?.symbol || 'tokens'}</span> now
          </p>
          
          {escrowDetails?.payRecipientFees && (
            <div className="mb-4 card card-compact inline-block">
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Fee coverage will be returned to creator</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleOptimizedClaim}
            disabled={isLoading}
            className="btn-primary px-6 py-3 font-medium"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 spinner"></div>
                <span>Claiming...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Claim {assetInfo?.symbol || 'Asset'}</span>
              </span>
            )}
          </button>
          
          {error && (
            <div className="mt-4 status-error">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      );
    }
    
    if (claimStatus === 'success') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Successfully Claimed! 🎉</h2>
            <p className="text-gray-600 mb-2">
              <span className="text-green-600 font-semibold">{formatAmount(escrowDetails.amount)} {assetInfo?.symbol || 'tokens'}</span> has been transferred to your wallet
            </p>
            {isOptedIn ? (
              <p className="text-gray-500 text-xs mb-2">
                Fee coverage returned to creator - you were already opted in!
              </p>
            ) : (
              <p className="text-gray-500 text-xs mb-2">
                Opted in and claimed in one atomic transaction
                {escrowDetails?.payRecipientFees && " - fees covered by sender"}
              </p>
            )}
            <p className="text-gray-500 text-sm">
              Wallet: <span className="font-mono">{formatAddress(accountAddress)}</span>
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">What's Next?</h3>
              <p className="text-gray-600 text-sm hidden sm:block">Put your {assetInfo?.symbol || 'crypto'} to work in the Algorand ecosystem</p>
            </div>
            
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {ecosystemProjects.map((project, index) => (
                <div
                  key={project.name}
                  className="card card-compact hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center text-base sm:text-lg group-hover:scale-110 transition-transform duration-200`}>
                      {project.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 font-medium text-sm sm:text-base">{project.name}</h4>
                      <p className="text-gray-600 text-xs sm:hidden">
                        {project.name.includes('Alpha') ? 'Prediction market' : 
                         project.name.includes('Vestige') ? 'Token trading' : 
                         'Real estate investing'}
                      </p>
                      <p className="text-gray-600 text-sm hidden sm:block">{project.description}</p>
                    </div>
                    
                    <button
                      onClick={() => window.open(project.url, '_blank')}
                      className="btn-secondary px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium hover:scale-105 transition-transform duration-200 shrink-0"
                    >
                      <span className="flex items-center space-x-1">
                        <span className="hidden sm:inline">Visit</span>
                        <span className="sm:hidden">Go</span>
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center pt-3">
              <button
                onClick={() => window.open(window.location.origin, '_blank')}
                className="btn-primary px-4 py-2 font-medium"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Send Your Own $$</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-32 left-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-20"></div>
      </div>
      
      <div className="w-full max-w-lg mx-auto relative z-10">
        <div className="card card-normal min-w-[20rem] sm:min-w-[28rem] w-full">
          <div className="text-center mb-6">
            <img
              src="/bubbapay.jpg"
              alt="Bubbapay Logo"
              className="w-12 h-12 rounded-lg object-cover mb-3 mx-auto"
            />
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Claim {assetInfo?.symbol || 'Asset'}
            </h1>
            <p className="text-gray-600 text-sm">
              Secure and instant on Algorand
            </p>
          </div>
          
          <div className="min-h-[200px] flex items-center justify-center">
            {renderWalletContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClaimPage;
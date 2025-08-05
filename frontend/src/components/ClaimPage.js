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

// CHANGE 19: Add fallback for when assetInfo is not yet loaded
const getDisplaySymbol = (assetInfo) => {
  return assetInfo?.symbol || 'USDC'; // Fallback to USDC for backwards compatibility
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create a fresh wallet manager for claim page only
const createClaimWalletManager = () => new WalletManager({
  wallets: [
    WalletId.PERA,
    WalletId.DEFLY,
    WalletId.LUTE,
  ],
  defaultNetwork: NetworkId.MAINNET,
});

// Main ClaimPage component - no wallet functionality initially
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
  // CHANGE 13: Add asset state management in main ClaimPage component
  const [assetInfo, setAssetInfo] = useState(null);

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
        
        // Set asset info based on escrow data
        const escrowAssetInfo = getAssetInfo(response.data.assetId);
        setAssetInfo(escrowAssetInfo);
        
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
  
  // Enable wallet functionality
  const enableWallet = () => {
    // Clear wallet-related storage before mounting WalletProvider
    // This ensures we get a fresh wallet selection menu
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
      
      // Clear sessionStorage as well
      sessionStorage.clear();
      
      console.log('Cleared wallet storage for fresh connection choice');
    };
    
    clearWalletStorage();
    setWalletEnabled(true);
  };
  
  // Format USDC amount
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };
  
  // Render content without wallet
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
            // CHANGE 15a: Already claimed section
            <p className="text-gray-500 text-sm mb-4">
              Amount: {formatAmount(escrowDetails.amount)} {assetInfo?.symbol || 'tokens'}
            </p>
          )}
          <button
            onClick={() => window.open(window.location.origin, '_blank')}
            className="btn-primary px-4 py-2 font-medium"
          >
            {/* CHANGE 15c: Success page button */}
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
    
    // Show claim details and connect wallet button
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
            {/* CHANGE 15b: Main display section */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              You've received {formatAmount(escrowDetails.amount)} {assetInfo?.symbol || 'tokens'}! 🎉
            </h2>
            <p className="text-gray-600">
              Connect your Algorand wallet to claim the funds
            </p>
            {escrowDetails.payRecipientFees && (
              <div className="mt-2 text-xs text-gray-500">
                Transaction fees covered by sender
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={enableWallet}
          className="btn-primary px-6 py-3 font-medium"
        >
          Connect Wallet
        </button>
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
          <div className="card card-normal">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3"
                   style={{background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)'}}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Claim your [internet Moneys]</h1>
              <p className="text-gray-600 text-sm">Secure and instant on Algorand</p>
            </div>
            
            {renderContentWithoutWallet(assetInfo)}
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

// CHANGE 12: Update ClaimPageWithWallet function signature
function ClaimPageWithWallet({ appId, tempPrivateKey, escrowDetails, ecosystemProjects, assetInfo }) {
  const { activeAddress, signTransactions, disconnect } = useWallet();
  const [accountAddress, setAccountAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [claimStatus, setClaimStatus] = useState('initial');
  const [isFunding, setIsFunding] = useState(false);
  const [autoClickTriggered, setAutoClickTriggered] = useState(false);
  // CHANGE 16: Remove the duplicate assetInfo state from ClaimPageWithWallet

  // Auto-trigger wallet button click when component mounts
  useEffect(() => {
    if (!autoClickTriggered) {
      // Small delay to ensure WalletButton has rendered
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
  
  // Check wallet status when connected
  useEffect(() => {
    const checkWalletStatus = async () => {
      if (!accountAddress || !escrowDetails) return;
      
      setClaimStatus('checking');
      setIsLoading(true);
      
      try {
        // STEP 1: If the sender pays for recipient fees, fund the wallet FIRST
        if (escrowDetails.payRecipientFees) {
          console.log("Escrow includes fee coverage, funding wallet...");
          const fundingSuccess = await fundWallet();
          if (!fundingSuccess) {
            setError('Failed to receive fee coverage. Please try again.');
            setIsLoading(false);
            return;
          }
          console.log("Wallet funded successfully with fee coverage");
        }
        
        // CHANGE 4: Update opt-in status check
        const targetAssetId = escrowDetails.assetId || 10458941; // Default to USDC
        const optInResponse = await axios.get(`${API_URL}/check-optin/${accountAddress}/${targetAssetId}`);
        const hasOptedIn = optInResponse.data.hasOptedIn;
        
        // STEP 3: Determine next step based on opt-in status
        if (!hasOptedIn) {
          setClaimStatus('need-optin');
        } else {
          setClaimStatus('ready-to-claim');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking wallet status:', error);
        setError('Failed to check your wallet status');
        setIsLoading(false);
      }
    };
    
    if (accountAddress && escrowDetails) {
      checkWalletStatus();
    }
  }, [accountAddress, escrowDetails]);
  
  // Fund wallet with fee coverage
  const fundWallet = async () => {
    if (!accountAddress || !tempPrivateKey || !appId) {
      console.error("Missing required parameters for funding");
      return false;
    }
    
    setIsFunding(true);
    setError(null);
    
    try {
      console.log("Requesting fee coverage from temp account...");
      
      const fundResponse = await axios.post(`${API_URL}/fund-wallet`, {
        recipientAddress: accountAddress,
        appId,
        tempPrivateKey
      });
      
      console.log("Fee coverage response:", fundResponse.data);
      
      if (fundResponse.data.success) {
        if (fundResponse.data.alreadyFunded) {
          console.log("Fee coverage was already provided for this escrow");
        } else if (fundResponse.data.fundingAmount > 0) {
          console.log(`Received ${fundResponse.data.fundingAmount} ALGO for transaction fees`);
          // Wait a moment for the transaction to propagate only if we actually sent funds
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log("No fee coverage needed for this escrow");
        }
        setIsFunding(false);
        return true;
      } else {
        console.log("Unexpected response from funding endpoint");
        setIsFunding(false);
        return true;
      }
    } catch (error) {
      console.error('Error receiving fee coverage:', error);
      setError(error.response?.data?.error || 'Failed to receive fee coverage. Please try again.');
      setIsFunding(false);
      return false;
    }
  };
  
  // Handle USDC opt-in
  const handleOptIn = async () => {
    if (!accountAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // CHANGE 5: Update opt-in transaction generation
      const response = await axios.post(`${API_URL}/generate-optin`, {
        recipientAddress: accountAddress,
        assetId: escrowDetails.assetId || 10458941
      });
      
      const txnUint8 = new Uint8Array(Buffer.from(response.data.transaction, 'base64'));
      const txn = algosdk.decodeUnsignedTransaction(txnUint8);
      
      const signedTxns = await signTransactions([txn]);
      const signedTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
      
      await axios.post(`${API_URL}/submit-optin`, {
        signedTxn: signedTxnBase64
      });
      
      setClaimStatus('ready-to-claim');
      setIsLoading(false);
    // CHANGE 8: Update error handling for asset-specific errors
    } catch (error) {
      console.error(`Error opting into ${assetInfo?.symbol || 'asset'}:`, error);
      setError(`Failed to opt into ${assetInfo?.symbol || 'asset'}. Please try again.`);
      setIsLoading(false);
    }
  };
  
  // Handle USDC claim
  const handleClaim = async () => {
    if (!accountAddress || !tempPrivateKey || !appId) return;
    
    setIsLoading(true);
    setError(null);
    setClaimStatus('claiming');
    
    try {
      console.log("Generating claim transaction...");
      
      // CHANGE 6: Update claim transaction generation
      const response = await axios.post(`${API_URL}/generate-claim`, {
        tempPrivateKey,
        appId,
        recipientAddress: accountAddress,
        assetId: escrowDetails.assetId
      });
      
      console.log("Submitting claim transaction...");
      
      const submitData = {
        signedTransactions: response.data.signedTransactions,
        appId,
        recipientAddress: accountAddress,
        tempPrivateKey
      };
      
      const claimResponse = await axios.post(`${API_URL}/claim-usdc`, submitData);
      
      if (claimResponse.data.success) {
        // CHANGE 17: Update console.log messages to be asset-agnostic
        console.log(`${assetInfo?.symbol || 'Asset'} claimed successfully!`);
        setClaimStatus('success');
      } else {
        setError(claimResponse.data.error || 'Failed to claim USDC');
        setClaimStatus('ready-to-claim');
      }
      
      setIsLoading(false);
    // CHANGE 9: Update claim error handling
    } catch (error) {
      console.error(`Error claiming ${assetInfo?.symbol || 'asset'}:`, error);
      setError(error.response?.data?.error || `Failed to claim ${assetInfo?.symbol || 'asset'}. Please try again.`);
      setClaimStatus('ready-to-claim');
      setIsLoading(false);
    }
  };
  
  // Format functions
  const formatAmount = (amount) => parseFloat(amount).toFixed(2);
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Render wallet-connected content
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
                Connect or create your wallet to claim funds
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
          {/* CHANGE 7f: Claiming status message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {claimStatus === 'claiming' 
              ? `Claiming Your ${assetInfo?.symbol || 'Asset'}...` 
              : (isFunding 
                  ? 'Receiving Fee Coverage...' 
                  // CHANGE 20: Use the helper in loading states where assetInfo might be null
                  : `Setting up your wallet for ${getDisplaySymbol(assetInfo)}`)}
          </h3>
          <p className="text-gray-600 text-sm">
            {claimStatus === 'claiming' 
              ? `Please wait while we process your claim` 
              : (isFunding 
                  ? 'Transferring ALGO for transaction fees from escrow' 
                  : `Setting up your wallet for ${getDisplaySymbol(assetInfo)}`)}
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
    
    if (claimStatus === 'need-optin') {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          {/* CHANGE 7g: Opt-in section title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {assetInfo?.symbol || 'Asset'} Opt-in Required
          </h3>
          {/* CHANGE 7h: Opt-in description */}
          <p className="text-gray-600 mb-4 text-sm">
            Your wallet needs to opt-in to the {assetInfo?.name || 'asset'} token before you can receive the funds.
            This is a one-time setup step.
          </p>
          
          {/* Wallet info and switch button */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-purple-600 text-xs font-medium">Connected Wallet</div>
                  <div className="text-gray-900 font-mono text-sm">{formatAddress(accountAddress)}</div>
                </div>
              </div>
              <div data-wallet-ui>
                <WalletButton className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center space-x-1 bg-transparent border-none p-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Switch</span>
                </WalletButton>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleOptIn}
            disabled={isLoading}
            className="btn-primary px-4 py-2 font-medium"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 spinner"></div>
                <span>Processing...</span>
              </span>
            ) : (
              // CHANGE 7i: Opt-in button text
              `Opt-in to ${assetInfo?.symbol || 'Asset'}`
            )}
          </button>
          
          {error && (
            <div className="mt-3 text-red-600 text-sm">{error}</div>
          )}
        </div>
      );
    }
    
    if (claimStatus === 'ready-to-claim') {
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
          {/* CHANGE 7j: Ready to claim message */}
          <p className="text-gray-600 mb-6">
            Claim your <span className="text-green-600 font-semibold">{formatAmount(escrowDetails.amount)} {assetInfo?.symbol || 'tokens'}</span> now
          </p>
          
          {/* Wallet info and switch button */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-purple-600 text-xs font-medium">Connected Wallet</div>
                  <div className="text-gray-900 font-mono text-sm">{formatAddress(accountAddress)}</div>
                </div>
              </div>
              <div data-wallet-ui>
                <WalletButton className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center space-x-1 bg-transparent border-none p-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Switch</span>
                </WalletButton>
              </div>
            </div>
          </div>
          
          {escrowDetails?.payRecipientFees && (
            <div className="mb-4 text-xs text-gray-500">
              Fees covered by sender
            </div>
          )}
          
          <button
            onClick={handleClaim}
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
                {/* CHANGE 7k: Claim button text */}
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
            {/* CHANGE 7l: Success message */}
            <p className="text-gray-600 mb-2">
              <span className="text-green-600 font-semibold">{formatAmount(escrowDetails.amount)} {assetInfo?.symbol || 'tokens'}</span> has been transferred to your wallet
            </p>
            {escrowDetails?.payRecipientFees && (
              <p className="text-gray-500 text-xs mb-2">
                Fees covered by sender
              </p>
            )}
            <p className="text-gray-500 text-sm">
              Wallet: <span className="font-mono">{formatAddress(accountAddress)}</span>
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">What's Next?</h3>
              {/* CHANGE 18: Update ecosystem projects description to be more generic */}
              <p className="text-gray-600 text-sm">Put your {assetInfo?.symbol || 'crypto'} to work in the Algorand ecosystem</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {ecosystemProjects.map((project, index) => (
                <div
                  key={project.name}
                  className="card card-compact hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-200`}>
                      {project.icon}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-gray-900 font-medium">{project.name}</h4>
                      <p className="text-gray-600 text-sm">{project.description}</p>
                    </div>
                    
                    <button
                      onClick={() => window.open(project.url, '_blank')}
                      className="btn-secondary px-3 py-1.5 text-sm font-medium hover:scale-105 transition-transform duration-200"
                    >
                      <span className="flex items-center space-x-1">
                        <span>Visit</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  {/* CHANGE 7n: Bottom button text */}
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
  
  // CHANGE 7c: Line ~130 - Page title
  // CHANGE 7d: Line ~135 - Page description  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-32 left-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-20"></div>
      </div>
      
      <div className="w-full max-w-lg mx-auto relative z-10">
        <div className="card card-normal">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3"
                 style={{background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)'}}>
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Claim {assetInfo?.symbol || 'Asset'}
            </h1>
            <p className="text-gray-600 text-sm">
              Secure and instant on Algorand
            </p>
          </div>
          
          {renderWalletContent()}
        </div>
      </div>
    </div>
  );
}

export default ClaimPage;
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
import { Buffer } from 'buffer';
import algosdk from 'algosdk';
import { formatAssetAmountWithSymbol } from '../utils/assetFormatter';

const getAssetInfo = (assetId) => {
  const assets = {
    31566704: { id: 31566704, name: 'USDC', symbol: 'USDC', decimals: 6 },
    760037151: { id: 760037151, name: 'xUSD', symbol: 'xUSD', decimals: 6 },
    2494786278: { id: 2494786278, name: 'Monko', symbol: 'MONKO', decimals: 6 },
    2726252423: { id: 2726252423, name: 'Alpha', symbol: 'ALPHA', decimals: 6 },
    523683256: { id: 523683256, name: 'Akita', symbol: 'AKITA', decimals: 6},
    2656692124: { id: 2656692124, name: 'BallSack', symbol: 'BALLSACK', decimals: 6},
    386192725: { id: 386192725, name: 'goBTC', symbol: 'goBTC', decimals: 8},
    3160000000: { id: 3160000000, name: 'Haystack', symbol: 'HAY', decimals: 6},
    2582294183: { id: 2582294183, name: 'GONNA', symbol: 'GONNA', decimals: 6},
    1284444444: { id: 1284444444, name: 'Orange', symbol: 'ORA', decimals: 8},
    2582590415: { id: 2582590415, name: 'Meep', symbol: 'MEEP', decimals: 6},
    2200000000: { id: 2200000000, name: 'Tinyman', symbol: 'TINY', decimals: 6},
  };

  return assets[parseInt(assetId)] || { id: assetId, name: 'Unknown Asset', symbol: 'ASA', decimals: 6 };
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
  const [assetInfo, setAssetInfo] = useState(null);

  // Ecosystem projects
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
        
        if (response.data.claimed || response.data.reclaimed) {
          setError(response.data.reclaimed 
            ? 'These funds have been reclaimed by the creator'
            : 'These funds have already been claimed'
          );
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
          <p className="text-gray-600 text-sm">Please wait while we fetch your transfer details...</p>
        </div>
      );
    }
    
    if (escrowDetails?.claimed || escrowDetails?.reclaimed || (error && error.includes('already been claimed'))) {
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
              Amount: {formatAssetAmountWithSymbol(escrowDetails.amount, assetInfo)}
            </p>
          )}
          <button
            onClick={() => window.open(window.location.origin, '_blank')}
            className="btn-primary px-4 py-2 font-medium"
          >
            {/* Success page button */}
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
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        
        {escrowDetails && (
          <div className="mb-6">
            {/* Main display section */}
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
            You've received {formatAssetAmountWithSymbol(escrowDetails.amount, assetInfo)}! 🎉
            </h2>
            <p className="text-gray-600">
              Connect your wallet to claim crypto
            </p>
            {escrowDetails.payRecipientFees && (
              <div className="mt-2 text-xs text-gray-500">
                Fees covered by sender
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={enableWallet}
          className="btn-primary px-4 py-2 font-medium"
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
        <div className="card card-normal min-w-[20rem] sm:min-w-[28rem] w-full">
            <div className="text-center mb-6">
              <img
                src="/bubbapay.jpg"
                alt="Bubbapay Logo"
                className="w-12 h-12 rounded-lg object-cover mb-3 mx-auto"
              />
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Claim your crypto</h1>
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

function ClaimPageWithWallet({ appId, tempPrivateKey, escrowDetails, ecosystemProjects, assetInfo }) {
  const { activeAddress, signTransactions } = useWallet();
  const [accountAddress, setAccountAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [claimStatus, setClaimStatus] = useState('initial');
  const [autoClickTriggered, setAutoClickTriggered] = useState(false);
const [isOptedIn, setIsOptedIn] = useState(false); 

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
        // get both opt-in status and ALGO balance info
        const targetAssetId = escrowDetails.assetId || 31566704;
        const optInResponse = await axios.get(`${API_URL}/check-optin/${accountAddress}/${targetAssetId}`);
        const { hasOptedIn, canAffordOptIn, availableAlgoBalance, requiredForOptIn, algoShortfall } = optInResponse.data;
        
        setIsOptedIn(hasOptedIn);
        
        // Set status based on opt-in status and affordability
        if (hasOptedIn) {
          setClaimStatus('ready-to-claim-optimized');
        } else {
          // User needs to opt-in
          if (escrowDetails.payRecipientFees) {
            // Sender covers fees, user can proceed
            setClaimStatus('ready-to-optin-and-claim');
          } else if (canAffordOptIn) {
            // User can afford opt-in
            setClaimStatus('ready-to-optin-and-claim');
          } else {
            // User cannot afford opt-in
            setClaimStatus('insufficient-algo-for-optin');
            setError(`Insufficient ALGO for opt-in. You need ${requiredForOptIn} ALGO but only have ${availableAlgoBalance} ALGO available (shortfall: ${algoShortfall} ALGO).`);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking wallet status:', error);
        
        // Handle unfunded account case
        if (error.response?.status === 404 || 
            error.response?.data?.error?.includes('account does not exist') ||
            error.response?.data?.error?.includes('account not found')) {
          console.log('Unfunded account detected');
          setIsOptedIn(false);
          
          // Unfunded accounts definitely need fee coverage to opt-in
          if (escrowDetails.payRecipientFees) {
            setClaimStatus('ready-to-optin-and-claim');
          } else {
            setClaimStatus('insufficient-algo-for-optin');
            setError('Unfunded account cannot opt-in without fee coverage from sender.');
          }
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
    console.log("Generating opt-in and claim group txn...");
    
    const response = await axios.post(`${API_URL}/generate-optin-and-claim`, {
      tempPrivateKey,
      appId,
      recipientAddress: accountAddress,
      assetId: escrowDetails.assetId
    });
    
    console.log("Group transaction generated, user needs to sign opt-in transaction");
    
    // Decode all transactions for signing (wallet needs to see the complete group)
const userTxnIndex = response.data.userTxnIndex;
const unsignedTxns = response.data.unsignedTransactions.map(txnB64 => {
  const txnUint8 = new Uint8Array(Buffer.from(txnB64, 'base64'));
  return algosdk.decodeUnsignedTransaction(txnUint8);
});

// Send group to wallet, but only user's transaction will be signable
const signedUserTxns = await signTransactions(unsignedTxns);

// Extract only the user's signed transaction 
const userSignedTxn = signedUserTxns[userTxnIndex];

// Combine user's signed transaction with temp account's pre-signed transactions
const finalSignedTxns = [...response.data.partiallySignedTransactions];
finalSignedTxns[userTxnIndex] = Buffer.from(userSignedTxn).toString('base64');
    
    console.log("Submitting complete group txn...");
    
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
    setError(error.response?.data?.error || `Failed to opt-in and claim ${assetInfo?.symbol || 'asset'}. Try again.`);
    setClaimStatus('ready-to-optin-and-claim');
    setIsLoading(false);
  }
};
  
  
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 3)}`;
  };
  
  // Render wallet-connected content
  const renderWalletContent = () => {
    if (!accountAddress) {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          
          {escrowDetails && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
              You've received {formatAssetAmountWithSymbol(escrowDetails.amount, assetInfo)}! 🎉
              </h2>
              <p className="text-gray-600">
                Connect your wallet to claim crypto
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
          {/* Claiming status message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
  {claimStatus === 'claiming' 
    ? `Claiming Your ${assetInfo?.symbol || 'Asset'}...` 
    : `Preparing claim for ${assetInfo?.symbol || 'Asset'}`}
</h3>
<p className="text-gray-600 text-sm">
  {claimStatus === 'claiming' 
    ? `Processing your txn...` 
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
    
    // User needs to opt-in but doesn't have enough algo
if (claimStatus === 'insufficient-algo-for-optin') {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-3">Insufficient ALGO</h2>
      <p className="text-gray-600 mb-4">
        You need to opt-in to <span className="text-blue-600 font-semibold">{assetInfo?.name || 'the asset'}</span> first, but don't have enough ALGO.
      </p>
      
      {error && (
        <div className="mb-4 card card-compact">
          <div className="text-yellow-700 text-sm">
            {error}
          </div>
        </div>
      )}
      
      <div className="mb-6 card card-compact">
        <div className="text-left">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Options:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Add more ALGO to your wallet</li>
            <li>• Ask sender to create a link with fee coverage</li>
            <li>• Use a different wallet that has ALGO</li>
          </ul>
        </div>
      </div>
      
      <div className="space-y-3">
  <button
    onClick={async () => {
      setError(null);
      const checkWalletStatus = async () => {
        if (!accountAddress || !escrowDetails) return;
        
        setClaimStatus('checking');
        setIsLoading(true);
        
        try {
          const targetAssetId = escrowDetails.assetId || 31566704;
          const optInResponse = await axios.get(`${API_URL}/check-optin/${accountAddress}/${targetAssetId}`);
          const { hasOptedIn, canAffordOptIn, availableAlgoBalance, requiredForOptIn, algoShortfall } = optInResponse.data;
          
          setIsOptedIn(hasOptedIn);
          
          if (hasOptedIn) {
            setClaimStatus('ready-to-claim-optimized');
          } else if (escrowDetails.payRecipientFees || canAffordOptIn) {
            setClaimStatus('ready-to-optin-and-claim');
          } else {
            setClaimStatus('insufficient-algo-for-optin');
            setError(`You need ${requiredForOptIn} ALGO but only have ${availableAlgoBalance} ALGO available (shortfall: ${algoShortfall} ALGO).`);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error rechecking wallet status:', error);
          setError('Failed to check your wallet status');
          setIsLoading(false);
        }
      };
      
      await checkWalletStatus();
    }}
    disabled={isLoading}
    className="btn-primary px-4 py-2 font-medium w-full"
  >
    <span className="flex items-center justify-center space-x-2">
      {isLoading ? (
        <div className="w-4 h-4 spinner"></div>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      <span>{isLoading ? 'Checking...' : 'Refresh'}</span>
    </span>
  </button>
  
  <button
    onClick={() => window.location.reload()}
    className="btn-secondary px-4 py-2 font-medium w-full"
  >
    <span className="flex items-center justify-center space-x-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
      <span>Try Other Wallet</span>
    </span>
  </button>
</div>
      
      <div className="mt-4 text-xs text-gray-500">
        Connected: {formatAddress(accountAddress)}
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
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Ready to Opt-in & Claim!</h2>
          <p className="text-gray-600 mb-2">
          Get your <span className="text-blue-600 font-semibold">{formatAssetAmountWithSymbol(escrowDetails.amount, assetInfo)}</span> in one txn
          </p>
          
          {escrowDetails?.payRecipientFees && (
  <div className="mb-4 card card-compact">
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
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Ready to Claim!</h2>
          <p className="text-gray-600 mb-6">
          Claim your <span className="text-green-600 font-semibold">{formatAssetAmountWithSymbol(escrowDetails.amount, assetInfo)}</span> now
          </p>
          
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
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Successfully Claimed! 🎉</h2>
<p className="text-gray-600 mb-2">
<span className="text-green-600 font-normal">{formatAssetAmountWithSymbol(escrowDetails.amount, assetInfo)}</span> has been send to {formatAddress(accountAddress)}
</p>
{escrowDetails?.payRecipientFees && !isOptedIn && (
  <p className="text-gray-500 text-xs mb-2">
    Opted in and claimed - fees covered by sender
  </p>
)}

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
                  <span>Create Claim Link</span>
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
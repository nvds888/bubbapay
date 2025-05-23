import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import algosdk from 'algosdk';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ClaimPage({ peraWallet }) {
  const [searchParams] = useSearchParams();
  const tempPrivateKey = searchParams.get('key');
  const appId = searchParams.get('app');
  
  const [accountAddress, setAccountAddress] = useState(null);
  const [escrowDetails, setEscrowDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [claimStatus, setClaimStatus] = useState('initial'); // initial, checking, need-optin, claiming, success
  const [isFunding, setIsFunding] = useState(false);
  
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
  
  // Connect to Pera Wallet
  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      setAccountAddress(accounts[0]);
    } catch (error) {
      console.error('Error connecting to Pera Wallet:', error);
      setError('Failed to connect to wallet');
    }
  };
  
  // Load escrow details when component mounts
  useEffect(() => {
    const fetchEscrowDetails = async () => {
      if (!tempPrivateKey || !appId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/escrow/${appId}`);
        setEscrowDetails(response.data);
        
        // Check if funds already claimed
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
  
  // Check wallet status when connected
  useEffect(() => {
    const checkWalletStatus = async () => {
      if (!accountAddress || !escrowDetails) return;
      
      setClaimStatus('checking');
      setIsLoading(true);
      
      try {
        // Check if user has opted into USDC
        const optInResponse = await axios.get(`${API_URL}/check-optin/${accountAddress}`);
        const hasOptedIn = optInResponse.data.hasOptedIn;
        
        // If the sender pays for recipient fees, fund the wallet automatically
        if (escrowDetails.payRecipientFees) {
          await fundWallet();
        }
        
        // After potential funding, determine next step
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
  
  // Fund wallet with Algo - Updated to include tempPrivateKey for secure lookup
  const fundWallet = async () => {
    if (!accountAddress || !tempPrivateKey || !appId) return;
    
    setIsFunding(true);
    setError(null);
    
    try {
      const fundResponse = await axios.post(`${API_URL}/fund-wallet`, {
        recipientAddress: accountAddress,
        appId,
        tempPrivateKey // Pass the private key for secure hash-based lookup
      });
      
      console.log("Funding response:", fundResponse.data);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setIsFunding(false);
      return true;
    } catch (error) {
      console.error('Error funding wallet:', error);
      setError(error.response?.data?.error || 'Failed to fund your wallet. Please try again.');
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
      const response = await axios.post(`${API_URL}/generate-optin`, {
        recipientAddress: accountAddress
      });
      
      const txnUint8 = new Uint8Array(Buffer.from(response.data.transaction, 'base64'));
      const txn = algosdk.decodeUnsignedTransaction(txnUint8);
      const signedTxns = await peraWallet.signTransaction([[{ txn, signers: [accountAddress] }]]);
      const signedTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
      
      await axios.post(`${API_URL}/submit-optin`, {
        signedTxn: signedTxnBase64
      });
      
      setClaimStatus('ready-to-claim');
      setIsLoading(false);
    } catch (error) {
      console.error('Error opting into USDC:', error);
      setError('Failed to opt into USDC. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle USDC claim - Updated to include tempPrivateKey in claim request
  const handleClaim = async () => {
    if (!accountAddress || !tempPrivateKey || !appId) return;
    
    setIsLoading(true);
    setError(null);
    setClaimStatus('claiming');
    
    try {
      // Generate pre-signed claim transaction using temporary account
      const response = await axios.post(`${API_URL}/generate-claim`, {
        tempPrivateKey,
        appId,
        recipientAddress: accountAddress
      });
      
      // Submit the pre-signed transaction - Updated to include tempPrivateKey for secure lookup
      const claimResponse = await axios.post(`${API_URL}/claim-usdc`, {
        signedTxn: response.data.signedTransaction,
        appId,
        recipientAddress: accountAddress,
        tempPrivateKey // Pass the private key for secure hash-based lookup
      });
      
      if (claimResponse.data.success) {
        setClaimStatus('success');
      } else {
        setError(claimResponse.data.error || 'Failed to claim USDC');
        setClaimStatus('ready-to-claim');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error claiming USDC:', error);
      setError(error.response?.data?.error || 'Failed to claim USDC. Please try again.');
      setClaimStatus('ready-to-claim');
      setIsLoading(false);
    }
  };
  
  // Format USDC amount
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };
  
  // Format wallet address
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Render content based on claim status
  const renderContent = () => {
    if (!tempPrivateKey || !appId) {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Invalid Claim Link</h3>
          <p className="text-gray-400">Please check the URL and try again. Both private key and app ID are required.</p>
        </div>
      );
    }
    
    if (isLoading && !escrowDetails) {
      return (
        <div className="text-center py-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Transfer Details</h3>
          <p className="text-gray-400">Please wait while we fetch your transfer information...</p>
        </div>
      );
    }
    
    if (error && !accountAddress) {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-6 py-3 rounded-xl font-semibold"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    if (!accountAddress) {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center float">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          
          {escrowDetails && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                You've received {formatAmount(escrowDetails.amount)} USDC! 🎉
              </h2>
              <p className="text-gray-300 text-lg">
                Connect your Algorand wallet to claim the funds
              </p>
              <div className="mt-4 text-sm text-gray-400">
                App ID: {appId}
              </div>
            </div>
          )}
          
          <button
            onClick={connectWallet}
            className="btn-primary px-8 py-4 rounded-xl font-semibold text-lg"
          >
            <span className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Connect Wallet</span>
            </span>
          </button>
        </div>
      );
    }
    
    if (claimStatus === 'checking' || (isLoading && !['initial', 'success'].includes(claimStatus))) {
      return (
        <div className="text-center py-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {claimStatus === 'claiming' 
              ? 'Claiming Your USDC...' 
              : (isFunding 
                  ? 'Funding Your Wallet...' 
                  : 'Preparing Your Wallet...')}
          </h3>
          <p className="text-gray-400">
            {claimStatus === 'claiming' 
              ? 'Please wait while we process your claim' 
              : (isFunding 
                  ? 'Adding ALGO for transaction fees' 
                  : 'Setting up your wallet for USDC')}
          </p>
          
          {/* Connected wallet display */}
          <div className="mt-6 glass-dark border border-purple-500/20 rounded-xl p-4 inline-block">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-purple-300 text-sm font-medium">Connected Wallet</div>
                <div className="text-white font-mono text-sm">{formatAddress(accountAddress)}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (claimStatus === 'need-optin') {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-4">USDC Opt-in Required</h3>
          <p className="text-gray-300 mb-6">
            Your wallet needs to opt-in to the USDC token before you can receive the funds.
            This is a one-time setup step.
          </p>
          
          <button
            onClick={handleOptIn}
            disabled={isLoading}
            className="btn-primary px-6 py-3 rounded-xl font-semibold"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </span>
            ) : (
              'Opt-in to USDC'
            )}
          </button>
          
          {error && (
            <div className="mt-4 text-red-400 text-sm">{error}</div>
          )}
        </div>
      );
    }
    
    if (claimStatus === 'ready-to-claim') {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center pulse-purple">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Claim!</h2>
          <p className="text-gray-300 text-lg mb-8">
            Claim your <span className="text-green-400 font-bold">{formatAmount(escrowDetails.amount)} USDC</span> now
          </p>
          
          <button
            onClick={handleClaim}
            disabled={isLoading}
            className="btn-primary px-8 py-4 rounded-xl font-semibold text-lg"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Claiming...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Claim USDC</span>
              </span>
            )}
          </button>
          
          {error && (
            <div className="mt-6 glass border border-red-500/20 bg-red-500/10 rounded-xl p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}
        </div>
      );
    }
    
    if (claimStatus === 'success') {
      return (
        <div className="space-y-8">
          {/* Success header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center checkmark">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">Successfully Claimed! 🎉</h2>
            <p className="text-gray-300 text-lg mb-2">
              <span className="text-green-400 font-bold">{formatAmount(escrowDetails.amount)} USDC</span> has been transferred to your wallet
            </p>
            <p className="text-gray-400 text-sm">
              Wallet: <span className="font-mono">{formatAddress(accountAddress)}</span>
            </p>
          </div>
          
          {/* What's next section */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">What's Next?</h3>
              <p className="text-gray-400">Put your USDC to work in the Algorand ecosystem</p>
            </div>
            
            {/* Ecosystem project cards */}
            <div className="grid grid-cols-1 gap-4">
              {ecosystemProjects.map((project, index) => (
                <div
                  key={project.name}
                  className="glass-dark border border-purple-500/20 rounded-xl p-4 hover:border-purple-400/40 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${project.gradient} flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300`}>
                      {project.icon}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-lg">{project.name}</h4>
                      <p className="text-gray-400 text-sm">{project.description}</p>
                    </div>
                    
                    <button
                      onClick={() => window.open(project.url, '_blank')}
                      className="btn-secondary px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform duration-300"
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
            
            {/* Send your own USDC */}
            <div className="text-center pt-4">
              <button
                onClick={() => window.open(window.location.origin, '_blank')}
                className="btn-primary px-6 py-3 rounded-xl font-semibold"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Send Your Own USDC</span>
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-dark border border-purple-500/20 rounded-2xl p-6 lg:p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Claim USDC</h1>
          <p className="text-gray-400">Secure and instant USDC transfer on Algorand</p>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
}

export default ClaimPage;
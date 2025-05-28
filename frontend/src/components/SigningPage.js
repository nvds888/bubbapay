// components/SigningPage.js - Updated to match Nomizo Pay styling and wallet flow
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SigningPage() {
  const { sessionToken } = useParams();
  const navigate = useNavigate();
  
  // State
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountAddress, setAccountAddress] = useState(null);
  const [signingStep, setSigningStep] = useState('connect'); // connect, deployment, funding, complete
  const [txnInProgress, setTxnInProgress] = useState(false);
  const [deploymentCompleted, setDeploymentCompleted] = useState(false); // NEW: Track deployment completion
  const [peraWallet] = useState(new PeraWalletConnect({ shouldShowSignTxnToast: true }));
  
  // Load session data on mount
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/mcp/signing-session/${sessionToken}`);
        
        if (!response.data.success) {
          throw new Error(response.data.error);
        }
        
        setSessionData(response.data.session);
        
        // Check if deployment is already completed
        if (response.data.session.appId) {
          setDeploymentCompleted(true);
          setSigningStep('funding');
        } else if (response.data.session.reclaimTransaction) {
          setSigningStep('reclaim');
        } else if (response.data.session.userAddress) {
          // If session already has wallet address, skip to deployment
          setSigningStep('deployment');
        }
        
      } catch (error) {
        console.error('Error loading session:', error);
        setError(error.response?.data?.error || error.message || 'Failed to load signing session');
      } finally {
        setLoading(false);
      }
    };
    
    if (sessionToken) {
      loadSessionData();
    }
  }, [sessionToken]);
  
  // Check for existing wallet connection
  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length && sessionData) {
        setAccountAddress(accounts[0]);
        setWalletConnected(true);
        
        // If session doesn't have wallet address yet, update it
        if (!sessionData.userAddress) {
          updateSessionWithWallet(accounts[0]);
        } else if (accounts[0] === sessionData.userAddress) {
          setSigningStep(sessionData.reclaimTransaction ? 'reclaim' : 'deployment');
        } else {
          setError(`Please connect the correct wallet address: ${sessionData.userAddress}`);
        }
      }
    });
    
    peraWallet.connector?.on('disconnect', () => {
      setAccountAddress(null);
      setWalletConnected(false);
      setSigningStep('connect');
    });
  }, [sessionData]);
  
  // Update session with wallet address
  const updateSessionWithWallet = async (walletAddress) => {
    try {
      setTxnInProgress(true);
      const response = await axios.post(`${API_URL}/mcp/update-session/${sessionToken}`, {
        userAddress: walletAddress
      });
      
      if (response.data.success) {
        // Reload session data to get the generated transactions
        const updatedSession = await axios.get(`${API_URL}/mcp/signing-session/${sessionToken}`);
        setSessionData(updatedSession.data.session);
        setSigningStep('deployment');
      }
    } catch (error) {
      console.error('Error updating session:', error);
      setError('Failed to update session with wallet address: ' + error.message);
    } finally {
      setTxnInProgress(false);
    }
  };
  
  // Connect wallet
  const connectWallet = async () => {
    try {
      setTxnInProgress(true);
      const newAccounts = await peraWallet.connect();
      setAccountAddress(newAccounts[0]);
      setWalletConnected(true);
      
      // Update session with wallet address
      await updateSessionWithWallet(newAccounts[0]);
      setError(null);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet: ' + error.message);
    } finally {
      setTxnInProgress(false);
    }
  };
  
  // Sign deployment transaction
  const signDeploymentTransaction = async () => {
    // Prevent multiple submissions
    if (txnInProgress || deploymentCompleted) return;
    
    try {
      setTxnInProgress(true);
      setError(null);
      
      // Convert base64 transaction to Uint8Array
      const txnUint8 = new Uint8Array(Buffer.from(sessionData.deployTransaction, 'base64'));
      const txn = algosdk.decodeUnsignedTransaction(txnUint8);
      
      // Sign with Pera Wallet
      const signedTxns = await peraWallet.signTransaction([[{ txn, signers: [accountAddress] }]]);
      const signedTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
      
      // Submit deployment transaction
      const response = await axios.post(`${API_URL}/mcp/submit-deployment/${sessionToken}`, {
        signedTxn: signedTxnBase64
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      
      // Update session data with app info
      setSessionData(prev => ({
        ...prev,
        appId: response.data.appId,
        appAddress: response.data.appAddress,
        groupTransactions: response.data.groupTransactions
      }));
      
      setDeploymentCompleted(true); // Mark deployment as completed
      
      // Move to funding step after a brief delay to show completion
      setTimeout(() => {
        setSigningStep('funding');
      }, 1000);
      
    } catch (error) {
      console.error('Error signing deployment:', error);
      setError('Failed to sign deployment transaction: ' + (error.response?.data?.error || error.message));
    } finally {
      setTxnInProgress(false);
    }
  };
  
  // Sign funding transactions
  const signFundingTransactions = async () => {
    try {
      setTxnInProgress(true);
      setError(null);
      
      // Convert base64 transactions to transaction objects
      const txnGroup = [];
      for (const base64Txn of sessionData.groupTransactions) {
        const txnBytes = new Uint8Array(Buffer.from(base64Txn, 'base64'));
        const txn = algosdk.decodeUnsignedTransaction(txnBytes);
        txnGroup.push({ txn, signers: [accountAddress] });
      }
      
      // Sign with Pera Wallet
      const signedTxns = await peraWallet.signTransaction([txnGroup]);
      const signedTxnsBase64 = Array.from(signedTxns).map(
        txn => Buffer.from(txn).toString('base64')
      );
      
      // Submit funding transactions
      const response = await axios.post(`${API_URL}/mcp/submit-funding/${sessionToken}`, {
        signedTxns: signedTxnsBase64
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      
      // Navigate to success page with escrow ID (like regular app)
      const escrowId = response.data.escrowId;
      navigate(`/success/${escrowId}`, {
        state: {
          isShareable: sessionData.shareable,
          // Success page will fetch the claim URL from the database
          fromMCP: true
        }
      });
      
    } catch (error) {
      console.error('Error signing funding:', error);
      setError('Failed to sign funding transactions: ' + (error.response?.data?.error || error.message));
    } finally {
      setTxnInProgress(false);
    }
  };
  
  // Sign reclaim transaction
  const signReclaimTransaction = async () => {
    try {
      setTxnInProgress(true);
      setError(null);
      
      // Convert base64 transaction to Uint8Array
      const txnUint8 = new Uint8Array(Buffer.from(sessionData.reclaimTransaction, 'base64'));
      const txn = algosdk.decodeUnsignedTransaction(txnUint8);
      
      // Sign with Pera Wallet
      const signedTxns = await peraWallet.signTransaction([[{ txn, signers: [accountAddress] }]]);
      const signedTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
      
      // Submit reclaim transaction
      const response = await axios.post(`${API_URL}/mcp/submit-reclaim/${sessionToken}`, {
        signedTxn: signedTxnBase64
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      
      // For reclaim, just show completion and navigate back
      setSigningStep('complete');
      
      // Navigate back to main app after a brief delay
      setTimeout(() => {
        navigate('/transactions');
      }, 3000);
      
    } catch (error) {
      console.error('Error signing reclaim:', error);
      setError('Failed to sign reclaim transaction: ' + (error.response?.data?.error || error.message));
    } finally {
      setTxnInProgress(false);
    }
  };
  
  // Format address like in your app
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="glass-dark border border-purple-500/20 rounded-2xl p-8 text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Signing Session</h2>
          <p className="text-gray-400">Please wait while we load your transaction...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && !sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="glass-dark border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Session Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary px-6 py-3 rounded-xl font-semibold"
          >
            Return to Nomizo Pay
          </button>
        </div>
      </div>
    );
  }
  
  // Main signing interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative bg-black/20 backdrop-blur border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">
                Nomizo <span className="gradient-text">Pay</span>
              </span>
            </div>
            
            {/* Wallet Display */}
            {walletConnected && accountAddress && (
              <div className="glass-dark px-3 py-2 rounded-lg">
                <span className="text-purple-300 text-sm font-mono">
                  {formatAddress(accountAddress)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 mb-4 float">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">
              {sessionData?.reclaimTransaction ? 'Reclaim USDC' : 'Complete USDC Transfer'}
            </h1>
            <p className="text-gray-400 max-w-md mx-auto">
              {sessionData?.reclaimTransaction 
                ? 'Sign the transaction to reclaim your USDC' 
                : 'Sign transactions to complete your USDC transfer'
              }
            </p>
          </div>
          
          {/* Transaction Details */}
          <div className="glass-dark border border-purple-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Transaction Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-semibold text-lg">{sessionData?.amount} USDC</span>
              </div>
              
              {sessionData?.recipientEmail && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Recipient:</span>
                  <span className="text-white">{sessionData.recipientEmail}</span>
                </div>
              )}
              
              {sessionData?.shareable && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Type:</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Shareable Link
                  </span>
                </div>
              )}
              
              {sessionData?.coverRecipientFees && !sessionData?.reclaimTransaction && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Fee Coverage:</span>
                  <span className="text-green-400 font-medium">Included</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="glass border border-red-500/20 bg-red-500/10 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-red-300 font-semibold">Transaction Error</h4>
                  <p className="text-red-200 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Signing Steps */}
          <div className="glass-dark border border-purple-500/20 rounded-2xl p-8">
            
            {/* Step 1: Connect Wallet */}
            {signingStep === 'connect' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-400">
                    Connect your Pera Wallet to sign the transaction and complete your transfer.
                  </p>
                </div>
                <button
                  onClick={connectWallet}
                  disabled={txnInProgress}
                  className="btn-primary px-8 py-3 rounded-xl font-semibold disabled:opacity-50 relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    {txnInProgress ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Connect Pera Wallet</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}
            
            {/* Step 2: Sign Deployment (for escrow) */}
            {signingStep === 'deployment' && !sessionData?.reclaimTransaction && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Create Smart Contract</h3>
                  <p className="text-gray-400">
                    Sign the first transaction to deploy your transfer smart contract on Algorand.
                  </p>
                </div>
                <button
                  onClick={signDeploymentTransaction}
                  disabled={txnInProgress || deploymentCompleted}
                  className="btn-primary px-8 py-3 rounded-xl font-semibold disabled:opacity-50 relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    {txnInProgress ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Contract...</span>
                      </>
                    ) : deploymentCompleted ? (
                      <>
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Contract Created</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Sign Contract Creation (1/2)</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}
            
            {/* Step 3: Sign Funding (for escrow) */}
            {signingStep === 'funding' && sessionData?.groupTransactions && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Fund & Setup Transfer</h3>
                  <p className="text-gray-400">
                    Sign the final transactions to fund your transfer with {sessionData?.amount} USDC.
                  </p>
                </div>
                <button
                  onClick={signFundingTransactions}
                  disabled={txnInProgress}
                  className="btn-primary px-8 py-3 rounded-xl font-semibold disabled:opacity-50 relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    {txnInProgress ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Funding Contract...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Complete Transfer (2/2)</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}
            
            {/* Reclaim Step */}
            {signingStep === 'reclaim' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Reclaim Your USDC</h3>
                  <p className="text-gray-400">
                    Sign the transaction to reclaim your {sessionData?.amount} USDC from the transfer.
                  </p>
                </div>
                <button
                  onClick={signReclaimTransaction}
                  disabled={txnInProgress}
                  className="btn-secondary px-8 py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                  <span className="flex items-center justify-center space-x-2">
                    {txnInProgress ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>Sign Reclaim Transaction</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}
            
            {/* Step 4: Complete */}
            {signingStep === 'complete' && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto checkmark float">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {sessionData?.reclaimTransaction ? 'Reclaim Successful! 🎉' : 'Transfer Created! 🎉'}
                  </h3>
                  <p className="text-gray-300">
                    {sessionData?.reclaimTransaction 
                      ? `You've successfully reclaimed ${sessionData?.amount} USDC to your wallet.`
                      : `Your ${sessionData?.amount} USDC transfer has been created successfully. ${
                          sessionData?.recipientEmail 
                            ? `${sessionData.recipientEmail} will receive an email with claim instructions.`
                            : 'You can now share the claim link with your recipient.'
                        }`
                    }
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/')}
                    className="btn-primary px-8 py-3 rounded-xl font-semibold"
                  >
                    Return to Nomizo Pay
                  </button>
                  {!sessionData?.reclaimTransaction && (
                    <button
                      onClick={() => navigate('/transactions')}
                      className="btn-secondary px-6 py-2 rounded-lg text-sm"
                    >
                      View My Transfers
                    </button>
                  )}
                </div>
              </div>
            )}
            
          </div>
          
          {/* Security Notice */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              🔒 This is a secure signing session that expires in 10 minutes. Your wallet private keys never leave your device.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default SigningPage;
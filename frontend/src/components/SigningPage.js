// components/SigningPage.js - Updated to use use-wallet
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import { WalletButton } from '@txnlab/use-wallet-ui-react';
import algosdk from 'algosdk';
import axios from 'axios';
import { getAssetInfo } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SigningPage() {
  const { sessionToken } = useParams();
  const navigate = useNavigate();
  const { activeAddress, signTransactions } = useWallet();
  
  // State
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingStep, setSigningStep] = useState('connect'); // connect, deployment, funding, complete
  const [txnInProgress, setTxnInProgress] = useState(false);
  const [deploymentCompleted, setDeploymentCompleted] = useState(false);
  const [assetInfo, setAssetInfo] = useState(null);
  
  // Load session data on mount
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/mcp/signing-session/${sessionToken}`);
        
        if (!response.data.success) {
          throw new Error(response.data.error);
        }
        
        const session = response.data.session;
        setSessionData(session);
        
        // GET ASSET INFO
        if (session.assetId) {
          const asset = getAssetInfo(session.assetId);
          setAssetInfo(asset);
        }
        
        // Check if deployment is already completed
        if (session.appId) {
          setDeploymentCompleted(true);
          setSigningStep('funding');
        } else if (session.reclaimTransaction) {
          setSigningStep('reclaim');
        } else if (session.userAddress) {
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
  
  // Check wallet connection status
  useEffect(() => {
    if (activeAddress && sessionData) {
      // If session doesn't have wallet address yet, update it
      if (!sessionData.userAddress) {
        updateSessionWithWallet(activeAddress);
      } else if (activeAddress === sessionData.userAddress) {
        setSigningStep(sessionData.reclaimTransaction ? 'reclaim' : 'deployment');
      } else {
        setError(`Please connect the correct wallet address: ${sessionData.userAddress}`);
      }
    } else if (!activeAddress && sessionData && sessionData.userAddress) {
      setSigningStep('connect');
    }
  }, [activeAddress, sessionData]);
  
  // Update session with wallet address
  const updateSessionWithWallet = async (walletAddress) => {
    try {
      setTxnInProgress(true);
      const response = await axios.post(`${API_URL}/mcp/update-session/${sessionToken}`, {
        userAddress: walletAddress
      });
      
      if (response.data.success) {
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
  
  // Sign deployment transaction
  const signDeploymentTransaction = async () => {
    if (txnInProgress || deploymentCompleted) return;
    
    try {
      setTxnInProgress(true);
      setError(null);
      
      const txnUint8 = new Uint8Array(Buffer.from(sessionData.deployTransaction, 'base64'));
      const txn = algosdk.decodeUnsignedTransaction(txnUint8);
      
      const signedTxns = await signTransactions([txn]);
      const signedTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
      
      const response = await axios.post(`${API_URL}/mcp/submit-deployment/${sessionToken}`, {
        signedTxn: signedTxnBase64
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      
      setSessionData(prev => ({
        ...prev,
        appId: response.data.appId,
        appAddress: response.data.appAddress,
        groupTransactions: response.data.groupTransactions
      }));
      
      setDeploymentCompleted(true);
      
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
      
      const txnGroup = [];
      for (const base64Txn of sessionData.groupTransactions) {
        const txnBytes = new Uint8Array(Buffer.from(base64Txn, 'base64'));
        const txn = algosdk.decodeUnsignedTransaction(txnBytes);
        txnGroup.push(txn);
      }
      
      const signedTxns = await signTransactions(txnGroup);
      const signedTxnsBase64 = signedTxns.map(
        txn => Buffer.from(txn).toString('base64')
      );
      
      const response = await axios.post(`${API_URL}/mcp/submit-funding/${sessionToken}`, {
        signedTxns: signedTxnsBase64
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      
      const escrowId = response.data.escrowId;
      navigate(`/success/${escrowId}`, {
        state: {
          isShareable: sessionData.shareable,
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
      
      const txnUint8 = new Uint8Array(Buffer.from(sessionData.reclaimTransaction, 'base64'));
      const txn = algosdk.decodeUnsignedTransaction(txnUint8);
      
      const signedTxns = await signTransactions([txn]);
      const signedTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
      
      const response = await axios.post(`${API_URL}/mcp/submit-reclaim/${sessionToken}`, {
        signedTxn: signedTxnBase64
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      
      setSigningStep('complete');
      
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
  
  // Format address
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Add helper function
  const getAssetSymbol = () => {
    return assetInfo?.symbol || 'tokens';
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="card card-normal text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 spinner"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Signing Session</h2>
          <p className="text-gray-600 text-sm">Please wait while we load your transaction...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && !sessionData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="card card-normal status-error text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Error</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary px-4 py-2 font-medium"
          >
            Return to BubbaPay
          </button>
        </div>
      </div>
    );
  }
  
  // Main signing interface
  return (
    <div className="min-h-screen bg-white">
      {/* Clean background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-32 left-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                   style={{background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)'}}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Bubba<span className="gradient-text">Pay</span>
              </span>
            </div>
            
            {/* Wallet Display */}
            {activeAddress && (
              <div className="px-3 py-1.5 bg-gray-100 rounded-lg border">
                <span className="text-purple-600 text-sm font-mono">
                  {formatAddress(activeAddress)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
                 style={{background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)'}}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {sessionData?.reclaimTransaction ? `Reclaim ${getAssetSymbol()}` : `Complete ${getAssetSymbol()} Transfer`}
            </h1>
            <p className="text-gray-600 max-w-md mx-auto text-sm">
              {sessionData?.reclaimTransaction 
                ? `Sign the transaction to reclaim your ${getAssetSymbol()}` 
                : `Sign transactions to complete your ${getAssetSymbol()} transfer`
              }
            </p>
          </div>
          
          {/* Transaction Details */}
          <div className="card card-normal">
            <h3 className="font-medium text-gray-900 mb-3">Transaction Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">{sessionData?.amount} {getAssetSymbol()}</span>
              </div>
              
              {sessionData?.recipientEmail && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="text-gray-900">{sessionData.recipientEmail}</span>
                </div>
              )}
              
              {sessionData?.shareable && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Type:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Shareable Link
                  </span>
                </div>
              )}
              
              {sessionData?.coverRecipientFees && !sessionData?.reclaimTransaction && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fee Coverage:</span>
                  <span className="text-green-600 font-medium">Included</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="card card-compact status-error">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <div className="font-medium text-red-800">Transaction Error</div>
                  <div className="text-red-700 mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Signing Steps */}
          <div className="card card-normal">
            
            {/* Step 1: Connect Wallet */}
            {signingStep === 'connect' && (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-600 text-sm">
                    Connect your wallet to sign the transaction and complete your transfer.
                  </p>
                </div>
                <WalletButton />
              </div>
            )}
            
            {/* Step 2: Sign Deployment */}
            {signingStep === 'deployment' && !sessionData?.reclaimTransaction && (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Create Smart Contract</h3>
                  <p className="text-gray-600 text-sm">
                    Sign the first transaction to deploy your transfer smart contract on Algorand.
                  </p>
                </div>
                <button
                  onClick={signDeploymentTransaction}
                  disabled={txnInProgress || deploymentCompleted}
                  className="btn-primary px-6 py-3 font-medium disabled:opacity-50"
                >
                  <span className="flex items-center justify-center space-x-2">
                    {txnInProgress ? (
                      <>
                        <div className="w-4 h-4 spinner"></div>
                        <span>Creating Contract...</span>
                      </>
                    ) : deploymentCompleted ? (
                      <>
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
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
            
            {/* Step 3: Sign Funding */}
            {signingStep === 'funding' && sessionData?.groupTransactions && (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Fund & Setup Transfer</h3>
                  <p className="text-gray-600 text-sm">
                    Sign the final transactions to fund your transfer with {sessionData?.amount} {getAssetSymbol()}.
                  </p>
                </div>
                <button
                  onClick={signFundingTransactions}
                  disabled={txnInProgress}
                  className="btn-primary px-6 py-3 font-medium disabled:opacity-50"
                >
                  <span className="flex items-center justify-center space-x-2">
                    {txnInProgress ? (
                      <>
                        <div className="w-4 h-4 spinner"></div>
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
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reclaim Your {getAssetSymbol()}</h3>
                  <p className="text-gray-600 text-sm">
                    Sign the transaction to reclaim your {sessionData?.amount} {getAssetSymbol()} from the transfer.
                  </p>
                </div>
                <button
                  onClick={signReclaimTransaction}
                  disabled={txnInProgress}
                  className="btn-secondary px-6 py-3 font-medium disabled:opacity-50"
                >
                  <span className="flex items-center justify-center space-x-2">
                    {txnInProgress ? (
                      <>
                        <div className="w-4 h-4 spinner"></div>
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
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {sessionData?.reclaimTransaction ? 'Reclaim Successful! 🎉' : 'Transfer Created! 🎉'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {sessionData?.reclaimTransaction 
                      ? `You've successfully reclaimed ${sessionData?.amount} ${getAssetSymbol()} to your wallet.`
                      : `Your ${sessionData?.amount} ${getAssetSymbol()} transfer has been created successfully. ${
                          sessionData?.recipientEmail 
                            ? `${sessionData.recipientEmail} will receive an email with claim instructions.`
                            : 'You can now share the claim link with your recipient.'
                        }`
                    }
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate('/')}
                    className="btn-primary px-6 py-3 font-medium"
                  >
                    Return to BubbaPay
                  </button>
                  {!sessionData?.reclaimTransaction && (
                    <button
                      onClick={() => navigate('/transactions')}
                      className="btn-secondary px-4 py-2 text-sm"
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
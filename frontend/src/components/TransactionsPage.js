import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import axios from 'axios';
import algosdk from 'algosdk';
import { Buffer } from 'buffer';
import api, { getAssetInfo } from '../services/api';
import { generateReferralLink, getReferralStats } from '../services/referralService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function TransactionsPage() {
  const { activeAddress, signTransactions } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [reclaimStatus, setReclaimStatus] = useState({ appId: null, status: '' });
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupStatus, setCleanupStatus] = useState({ appId: null, status: '' });
  const [referralLink, setReferralLink] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [isGeneratingReferral, setIsGeneratingReferral] = useState(false);
  const [showReferralSection, setShowReferralSection] = useState(false);
  
  // Helper function to get asset symbol from transaction
  const getAssetSymbol = (transaction) => {
    if (transaction.assetId) {
      const assetInfo = getAssetInfo(transaction.assetId);
      return assetInfo?.symbol || 'tokens';
    }
    // Fallback for older transactions without assetId
    return 'USDC';
  };

  // Helper function to get asset info
  const getTransactionAssetInfo = (transaction) => {
    if (transaction.assetId) {
      return getAssetInfo(transaction.assetId);
    }
    // Fallback for older transactions
    return { symbol: 'USDC', name: 'USDC' };
  };
  
  // Fetch user transactions when component mounts
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!activeAddress) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/user-escrows/${activeAddress}`);
        setTransactions(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to fetch your transactions');
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [activeAddress]);
  
  useEffect(() => {
    const fetchReferralStats = async () => {
      if (!activeAddress) {
        setReferralStats(null);
        setReferralLink(null);
        return;
      }
      
      try {
        const stats = await getReferralStats(activeAddress);
        setReferralStats(stats);
        if (stats.referralCode) {
          setReferralLink(`${window.location.origin}/?ref=${stats.referralCode}`);
        }
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      }
    };
    
    if (activeAddress) {
      fetchReferralStats();
    }
  }, [activeAddress]);
  
  // Format USDC amount
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Handle reclaiming funds
  const handleReclaim = async (appId) => {
    if (!window.confirm("Are you sure you want to reclaim these funds? The recipient will no longer be able to claim them.")) {
      return;
    }
    
    setIsReclaiming(true);
    setReclaimStatus({ appId, status: 'Generating transaction...' });
    
    try {
      // Generate the reclaim transaction
      const txnData = await api.generateReclaimTransaction({
        appId,
        senderAddress: activeAddress
      });
      
      setReclaimStatus({ appId, status: 'Waiting for signature...' });
      
      // Convert base64 transaction to Uint8Array
      const txnUint8 = new Uint8Array(Buffer.from(txnData.transaction, 'base64'));
      
      // Decode the transaction for proper signing
      const txn = algosdk.decodeUnsignedTransaction(txnUint8);
      
      // Sign with use-wallet (supports multiple wallets)
      const signedTxns = await signTransactions([txn]);
      
      // Convert the signed transaction to base64
      const signedTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
      
      setReclaimStatus({ appId, status: 'Submitting transaction...' });
      
      // Submit the signed transaction
      const result = await api.submitReclaimTransaction({
        signedTxn: signedTxnBase64,
        appId,
        senderAddress: activeAddress
      });
      
      // Update the local transactions state to reflect the reclaim
      setTransactions(prev => prev.map(tx => {
        if (tx.appId === parseInt(appId)) {
          return { ...tx, reclaimed: true, reclaimedAt: new Date() };
        }
        return tx;
      }));
      
      setReclaimStatus({ appId, status: 'Success' });
      const assetSymbol = getAssetSymbol(transactions.find(tx => tx.appId === parseInt(appId)));
      alert(`Successfully reclaimed ${result.amount} ${assetSymbol}`);
      
    } catch (error) {
      console.error('Error reclaiming funds:', error);
      setReclaimStatus({ appId, status: 'Failed' });
      alert(`Failed to reclaim funds: ${error.message || error}`);
    } finally {
      setIsReclaiming(false);
      // Reset status after a delay
      setTimeout(() => {
        setReclaimStatus({ appId: null, status: '' });
      }, 3000);
    }
  };
  

  const handleCleanup = async (appId) => {
    if (!window.confirm("Clean up this contract to recover locked ALGO? This will permanently delete the contract.")) {
      return;
    }
    
    setIsCleaningUp(true);
    setCleanupStatus({ appId, status: 'Generating cleanup transactions...' });
    
    try {
      // Generate the cleanup transactions 
      const txnData = await api.generateCleanupTransaction({
        appId,
        senderAddress: activeAddress
      });
      
      setCleanupStatus({ appId, status: 'Waiting for signature...' });
      
      // Convert base64 transactions to Uint8Array and decode
      const txns = txnData.transactions.map(txnBase64 => {
        const txnUint8 = new Uint8Array(Buffer.from(txnBase64, 'base64'));
        return algosdk.decodeUnsignedTransaction(txnUint8);
      });
      
      // Sign with use-wallet (group of transactions)
      const signedTxns = await signTransactions(txns);
      
      // Convert the signed transactions to base64
      const signedTxnsBase64 = signedTxns.map(signedTxn => 
        Buffer.from(signedTxn).toString('base64')
      );
      
      setCleanupStatus({ appId, status: 'Submitting transactions...' });
      
      // Submit the signed transactions using the API service
      const result = await api.submitCleanupTransaction({
        signedTxns: signedTxnsBase64,
        appId,
        senderAddress: activeAddress
      });
      
      // Update the local transactions state to reflect the cleanup
      setTransactions(prev => prev.map(tx => {
        if (tx.appId === parseInt(appId)) {
          return { ...tx, cleanedUp: true, cleanedUpAt: new Date() };
        }
        return tx;
      }));
      
      setCleanupStatus({ appId, status: 'Success' });
      alert(`Successfully cleaned up contract and recovered ${txnData.estimatedRecovery}!`);
      
    } catch (error) {
      console.error('Error cleaning up contract:', error);
      setCleanupStatus({ appId, status: 'Failed' });
      alert(`Failed to clean up contract: ${error.message || error}`);
    } finally {
      setIsCleaningUp(false);
      // Reset status after a delay
      setTimeout(() => {
        setCleanupStatus({ appId: null, status: '' });
      }, 3000);
    }
  };
  
  const handleGenerateReferralLink = async () => {
    setIsGeneratingReferral(true);
    
    try {
      const result = await generateReferralLink(activeAddress);
      setReferralLink(result.referralUrl);
      setReferralStats(prev => ({
        ...prev,
        referralCode: result.referralCode
      }));
    } catch (error) {
      console.error('Error generating referral link:', error);
      alert('Failed to generate referral link. Please try again.');
    } finally {
      setIsGeneratingReferral(false);
    }
  };

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Referral link copied to clipboard!');
    }
  };
  
  if (!activeAddress) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="card card-normal text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600 mb-4 text-sm">Please connect your wallet to view and manage your links.</p>
          <Link 
            to="/"
            className="btn-primary px-4 py-2 font-medium"
          >
            Go to Home & Connect Wallet
          </Link>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="card card-normal text-center">
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 spinner"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Transactions</h2>
          <p className="text-gray-600 text-sm">Fetching your transaction history...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="card card-normal status-error text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Transactions</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <Link 
            to="/"
            className="btn-primary px-4 py-2 font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card card-normal">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Links</h2>
            <p className="text-gray-600 text-sm">View and manage your created links</p>
          </div>
        </div>

        
        {/* Security notice */}
        <div className="status-warning">
          <div className="flex items-start space-x-3">
            <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-amber-800">Important Security Note:</p>
              <p className="text-amber-700 mt-1">Claim links are only displayed during creation. The creator can always reclaim unclaimed funds below.</p>
            </div>
          </div>
        </div>
        {/* Cleanup summary section */}
        {transactions.some(tx => (tx.claimed || tx.reclaimed) && !tx.cleanedUp) && (
          <div className="status-success">
            <div className="flex items-start space-x-3">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-green-800">Contracts Ready for Cleanup:</p>
                <p className="text-green-700 mt-1">
  {transactions.filter(tx => (tx.claimed || tx.reclaimed) && !tx.cleanedUp).length} Claimed contracts can be cleaned up to recover ~{(transactions.filter(tx => (tx.claimed || tx.reclaimed) && !tx.cleanedUp).length * 0.46).toFixed(2)} ALGO in locked funds.
</p>
              </div>
            </div>
          </div>
        )}
            </div>
      
      {/* Referral Section */}
{activeAddress && (
  <div className="card card-normal">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Referral Program</h3>
          <p className="text-gray-600 text-sm hidden sm:block">Earn fees from your referrals' links</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowReferralSection(!showReferralSection)}
        className="btn-ghost text-sm px-3 py-1 shrink-0"
      >
        {showReferralSection ? 'Hide' : 'Show'}
      </button>
    </div>
    
    {showReferralSection && (
      <div className="space-y-4">
        {/* Stats Grid - Mobile Responsive */}
        {referralStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{referralStats.totalReferrals}</div>
              <div className="text-xs sm:text-sm text-gray-600">Active Referrals</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{referralStats.totalEarnings.toFixed(3)}</div>
              <div className="text-xs sm:text-sm text-gray-600">ALGO Earned</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{referralStats.totalClaims || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Claims</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">100%</div>
              <div className="text-xs sm:text-sm text-gray-600">Fee Share</div>
            </div>
          </div>
        )}
        
        {/* Referral Link Generation */}
        {!referralLink ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4 text-sm">
              Generate your referral link
            </p>
            <button
              onClick={handleGenerateReferralLink}
              disabled={isGeneratingReferral}
              className="btn-primary px-4 py-2 font-medium w-full sm:w-auto"
            >
              {isGeneratingReferral ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 spinner"></div>
                  <span>Generating...</span>
                </span>
              ) : (
                'Get Referral Link'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Your Referral Link</label>
              <button
                onClick={handleCopyReferralLink}
                className="btn-secondary text-xs px-3 py-1 w-full sm:w-auto"
              >
                Copy Link
              </button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border overflow-hidden">
              <code className="text-xs sm:text-sm text-gray-800 break-all word-break-all">
                {referralLink}
              </code>
            </div>
            <div className="status-success">
              <div className="flex items-start space-x-3">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-green-800">How it works:</p>
                  <p className="text-green-700 mt-1">
                    When people you refer create claim links and others claim them, you earn 0.105 ALGO per claim directly paid to your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Referrals List - REPLACE with this compact version */}
        {referralStats && referralStats.referrals && referralStats.referrals.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Your Referrals ({referralStats.referrals.length})</h4>
            <div className="space-y-2">
              {referralStats.referrals.map((referral, index) => (
                <div key={referral.address} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                  {/* Left side - Number and Address */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-purple-600">{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs text-gray-900 truncate" title={referral.address}>
                        <span className="sm:hidden">
                          {referral.address.substring(0, 6)}...{referral.address.substring(referral.address.length - 4)}
                        </span>
                        <span className="hidden sm:inline">
                          {referral.address.substring(0, 10)}...{referral.address.substring(referral.address.length - 6)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(referral.linkedAt).toLocaleDateString()} • {(referral.totalEarningsGenerated || 0).toFixed(3)} ALGO • {referral.totalClaims || 0} claims
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Status indicator (optional) */}
                  <div className="flex-shrink-0">
                    {referral.totalClaims > 0 ? (
                      <div className="w-2 h-2 bg-green-400 rounded-full" title="Active referral"></div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-300 rounded-full" title="No claims yet"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for No Referrals */}
        {referralStats && referralStats.referrals && referralStats.referrals.length === 0 && referralLink && (
          <div className="border-t border-gray-200 pt-4">
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">No referrals yet</h4>
              <p className="text-xs text-gray-500 mb-3">Share your referral link to start earning</p>
              <button
                onClick={handleCopyReferralLink}
                className="btn-secondary text-xs px-3 py-1"
              >
                Copy Referral Link
              </button>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
)}
      
      
      {/* Transactions list */}
      {transactions.length === 0 ? (
        <div className="card card-normal text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Links Yet</h3>
          <p className="text-gray-600 mb-4 text-sm">You haven't created any links yet. Create your first!</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatAmount(transaction.amount)} {getAssetSymbol(transaction)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.recipientEmail || (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Shareable Link
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
  {transaction.reclaimed ? (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
      Reclaimed
    </span>
  ) : transaction.claimed ? (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Claimed
    </span>
  ) : !transaction.funded && transaction.status === 'APP_CREATED_AWAITING_FUNDING' ? (
    <div className="space-y-1">
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        App Created - Unfunded
      </span>
      <p className="text-xs text-blue-600">Navigate to home to fund App</p>
    </div>
  ) : (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      Pending
    </span>
  )}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm">
  {/* Processing status display */}
  {reclaimStatus.appId === transaction.appId && (
    <span className="text-xs text-blue-600 mr-3">
      {reclaimStatus.status}
    </span>
  )}
  {cleanupStatus.appId === transaction.appId && (
    <span className="text-xs text-green-600 mr-3">
      {cleanupStatus.status}
    </span>
  )}
  
  {/* Action buttons */}
  <div className="space-y-1">
    {!transaction.funded && transaction.status === 'APP_CREATED_AWAITING_FUNDING' ? (
      // Unfunded app - only show explorer link
      <>
        <span className="text-gray-500 text-sm block">App awaiting funding</span>
        <Link 
          to="/"
          className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200 text-sm block"
        >
          Go to Home to Fund
        </Link>
      </>
    ) : !transaction.claimed && !transaction.reclaimed ? (
      <button
        onClick={() => handleReclaim(transaction.appId)}
        disabled={isReclaiming}
        className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200 disabled:opacity-50 text-sm block"
      >
        Reclaim Funds
      </button>
    ) : transaction.cleanedUp ? (
      <span className="text-gray-500 text-sm">Cleaned Up</span>
    ) : (
      <button
        onClick={() => handleCleanup(transaction.appId)}
        disabled={isCleaningUp}
        className="text-green-600 hover:text-green-700 font-medium transition-colors duration-200 disabled:opacity-50 text-sm block"
      >
        Clean Up (~0.46 ALGO)
      </button>
    )}
    
    {/* Explorer link - always show */}
    <a
      href={`https://lora.algokit.io/mainnet/application/${transaction.appId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200 flex items-center space-x-1 text-sm"
    >
      <span>View Explorer</span>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
  <div className="flex items-center space-x-3">
    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    </div>
    <div>
      <div className="text-gray-900 font-semibold">{formatAmount(transaction.amount)} {getAssetSymbol(transaction)}</div>
      <div className="text-gray-500 text-sm">{formatDate(transaction.createdAt)}</div>
    </div>
  </div>
  
  {transaction.reclaimed ? (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
      Reclaimed
    </span>
  ) : transaction.claimed ? (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Claimed
    </span>
  ) : !transaction.funded && transaction.status === 'APP_CREATED_AWAITING_FUNDING' ? (
    <div className="text-center">
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
        App Created - Unfunded
      </span>
      <p className="text-xs text-blue-600">Navigate to home to fund App</p>
    </div>
  ) : (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      Pending
    </span>
  )}
</div>
                
                <div className="text-sm text-gray-600">
                  <span className="text-gray-500">To:</span> {transaction.recipientEmail || 'Shareable Link'}
                </div>
                
                {/* Mobile actions */}
                <div className="flex justify-between items-center pt-2">
  <div className="space-y-1">
    {reclaimStatus.appId === transaction.appId && (
      <span className="text-xs text-blue-600 block">
        {reclaimStatus.status}
      </span>
    )}
    {cleanupStatus.appId === transaction.appId && (
      <span className="text-xs text-green-600 block">
        {cleanupStatus.status}
      </span>
    )}
  </div>
  
  <div className="space-y-2">
    {!transaction.funded && transaction.status === 'APP_CREATED_AWAITING_FUNDING' ? (
      // Unfunded app - show link to home
      <Link
        to="/"
        className="btn-primary px-3 py-1.5 text-sm font-medium w-full text-center block"
      >
        Go to Home to Fund
      </Link>
    ) : !transaction.claimed && !transaction.reclaimed ? (
      <button
        onClick={() => handleReclaim(transaction.appId)}
        disabled={isReclaiming}
        className="btn-secondary px-3 py-1.5 text-sm font-medium w-full"
      >
        Reclaim Funds
      </button>
    ) : transaction.cleanedUp ? (
      <span className="text-gray-500 text-sm">Cleaned Up</span>
    ) : (
      <button
        onClick={() => handleCleanup(transaction.appId)}
        disabled={isCleaningUp}
        className="btn-primary px-3 py-1.5 text-sm font-medium w-full"
      >
        Clean Up (~0.46 ALGO)
      </button>
    )}
    
    {/* Explorer link - always show */}
    <a
      href={`https://lora.algokit.io/mainnet/application/${transaction.appId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-secondary px-3 py-1.5 text-sm font-medium w-full text-center block"
    >
      View Explorer
    </a>
  </div>
</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Send more button */}
      <div className="text-center">
        <Link 
          to="/"
          className="btn-primary px-6 py-3 font-medium inline-flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Link</span>
        </Link>
      </div>
    </div>
  );
}

export default TransactionsPage;
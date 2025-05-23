import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import algosdk from 'algosdk';
import api from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function TransactionsPage({ accountAddress, peraWallet }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [reclaimStatus, setReclaimStatus] = useState({ appId: null, status: '' });
  
  // Fetch user transactions when component mounts
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!accountAddress) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/user-escrows/${accountAddress}`);
        setTransactions(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to fetch your transactions');
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [accountAddress]);
  
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
        senderAddress: accountAddress
      });
      
      setReclaimStatus({ appId, status: 'Waiting for signature...' });
      
      // Convert base64 transaction to Uint8Array
      const txnUint8 = new Uint8Array(Buffer.from(txnData.transaction, 'base64'));
      
      // Decode the transaction for proper signing
      const txn = algosdk.decodeUnsignedTransaction(txnUint8);
      
      // Sign with Pera Wallet
      const signedTxns = await peraWallet.signTransaction([[{ txn, signers: [accountAddress] }]]);
      
      // Convert the signed transaction to base64
      const signedTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
      
      setReclaimStatus({ appId, status: 'Submitting transaction...' });
      
      // Submit the signed transaction
      const result = await api.submitReclaimTransaction({
        signedTxn: signedTxnBase64,
        appId,
        senderAddress: accountAddress
      });
      
      // Update the local transactions state to reflect the reclaim
      setTransactions(prev => prev.map(tx => {
        if (tx.appId === parseInt(appId)) {
          return { ...tx, reclaimed: true, reclaimedAt: new Date() };
        }
        return tx;
      }));
      
      setReclaimStatus({ appId, status: 'Success' });
      alert(`Successfully reclaimed ${result.amount} USDC`);
      
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
  
  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="glass-dark border border-purple-500/20 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Transactions</h2>
          <p className="text-gray-400">Fetching your transaction history...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="glass-dark border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Transactions</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link 
            to="/"
            className="btn-primary px-6 py-3 rounded-xl font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-dark border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">My Transactions</h2>
            <p className="text-gray-400">View and manage your USDC transfers</p>
          </div>
        </div>
        
        {/* Security notice */}
        <div className="glass bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="text-amber-300 font-semibold">Important Security Note:</p>
              <p className="text-amber-200">Claim links are only displayed once during creation for security. If a link was lost, you can reclaim unclaimed funds below.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transactions list */}
      {transactions.length === 0 ? (
        <div className="glass-dark border border-purple-500/20 rounded-2xl p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gray-500/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Transactions Yet</h3>
          <p className="text-gray-400 mb-6">You haven't sent any USDC yet. Create your first transfer!</p>
          <Link 
            to="/"
            className="btn-primary px-6 py-3 rounded-xl font-semibold"
          >
            Send USDC
          </Link>
        </div>
      ) : (
        <div className="glass-dark border border-purple-500/20 rounded-2xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-800/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-white">
                        {formatAmount(transaction.amount)} USDC
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {transaction.recipientEmail || (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Shareable Link
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.reclaimed ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                          Reclaimed
                        </span>
                      ) : transaction.claimed ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                          Claimed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {/* Processing status display */}
                      {reclaimStatus.appId === transaction.appId && (
                        <span className="text-sm text-orange-400 animate-pulse mr-3">
                          {reclaimStatus.status}
                        </span>
                      )}
                      
                      {/* Action buttons */}
                      {!transaction.claimed && !transaction.reclaimed ? (
                        <button
                          onClick={() => handleReclaim(transaction.appId)}
                          disabled={isReclaiming}
                          className="text-red-400 hover:text-red-300 font-medium transition-colors duration-200 disabled:opacity-50"
                        >
                          Reclaim Funds
                        </button>
                      ) : (
                        <a
                          href={`https://lora.algokit.io/testnet/application/${transaction.appId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200 flex items-center space-x-1"
                        >
                          <span>View on Explorer</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-gray-700">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{formatAmount(transaction.amount)} USDC</div>
                      <div className="text-gray-400 text-sm">{formatDate(transaction.createdAt)}</div>
                    </div>
                  </div>
                  
                  {transaction.reclaimed ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                      Reclaimed
                    </span>
                  ) : transaction.claimed ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                      Claimed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      Pending
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-300">
                  <span className="text-gray-400">To:</span> {transaction.recipientEmail || 'Shareable Link'}
                </div>
                
                {/* Mobile actions */}
                <div className="flex justify-between items-center pt-2">
                  {reclaimStatus.appId === transaction.appId && (
                    <span className="text-sm text-orange-400 animate-pulse">
                      {reclaimStatus.status}
                    </span>
                  )}
                  
                  {!transaction.claimed && !transaction.reclaimed ? (
                    <button
                      onClick={() => handleReclaim(transaction.appId)}
                      disabled={isReclaiming}
                      className="btn-secondary px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Reclaim Funds
                    </button>
                  ) : (
                    <a
                      href={`https://lora.algokit.io/testnet/application/${transaction.appId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      View on Explorer
                    </a>
                  )}
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
          className="btn-primary px-8 py-3 rounded-xl font-semibold inline-flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Send More USDC</span>
        </Link>
      </div>
    </div>
  );
}

export default TransactionsPage;
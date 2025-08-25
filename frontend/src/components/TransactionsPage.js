import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import algosdk from 'algosdk';
import { DeflyWalletConnect } from '@blockshake/defly-connect';
import axios from 'axios';
import api, { getAssetInfo } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [reclaimStatus, setReclaimStatus] = useState({ appId: null, status: '' });
  const [activeAddress, setActiveAddress] = useState(null);
  const [deflyWallet, setDeflyWallet] = useState(null);

  useEffect(() => {
    const initDefly = async () => {
      const defly = new DeflyWalletConnect({ chainId: 416001 }); // MainNet
      setDeflyWallet(defly);

      // Reconnect session on page load
      try {
        const accounts = await defly.reconnectSession();
        if (accounts.length > 0) {
          setActiveAddress(accounts[0]);
        }
      } catch (error) {
        if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
          console.error('Reconnect error:', error);
        }
      }

      // Set up disconnect listener
      defly.connector?.on('disconnect', handleDisconnectWallet);
    };
    initDefly();
  }, []);

  const handleDisconnectWallet = () => {
    setActiveAddress(null);
    setError('Wallet disconnected. Please reconnect to continue.');
  };

  // Helper functions (getAssetSymbol, formatAmount, formatDate) remain unchanged
  const getAssetSymbol = (transaction) => {
    if (transaction.assetId) {
      const assetInfo = getAssetInfo(transaction.assetId);
      return assetInfo?.symbol || 'tokens';
    }
    return 'USDC';
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Fetch transactions
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

  const handleReclaim = async (appId) => {
    if (!window.confirm('Are you sure you want to reclaim these funds? The recipient will no longer be able to claim them.')) {
      return;
    }

    if (!deflyWallet) {
      alert('Defly Wallet is not initialized. Please refresh the page and connect.');
      return;
    }

    if (!deflyWallet.isConnected) {
      try {
        const accounts = await deflyWallet.connect();
        setActiveAddress(accounts[0]);
      } catch (error) {
        if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
          alert('Failed to connect to Defly Wallet: ' + (error.message || error));
        }
        return;
      }
    }

    setIsReclaiming(true);
    setReclaimStatus({ appId, status: 'Generating transactions...' });

    try {
      const txnData = await api.generateReclaimTransaction({
        appId,
        senderAddress: activeAddress,
      });

      console.log('WalletTransactions being sent to wallet:', JSON.stringify(txnData.walletTransactions, null, 2));

      setReclaimStatus({ appId, status: 'Waiting for signature...' });

      // Convert transactions to algosdk format
      const unsignedTxns = txnData.walletTransactions.map(walletTxn => {
        const binaryString = atob(walletTxn.txn);
        const txnUint8 = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          txnUint8[i] = binaryString.charCodeAt(i);
        }
        const txn = algosdk.decodeUnsignedTransaction(txnUint8);

        if (walletTxn.msig) {
          txn.msig = {
            v: walletTxn.msig.v,
            thr: walletTxn.msig.thr,
            subsig: walletTxn.msig.subsig.map(sub => ({
              pk: new Uint8Array(atob(sub.pk).split('').map(char => char.charCodeAt(0))),
            })),
          };
        }

        return txn;
      });

      // Sign transactions with Defly Wallet
      const signedTxns = await deflyWallet.signTransaction(
        unsignedTxns.map(txn => [txn]), // Defly expects an array of transaction groups
        { shouldShowSignTxnToast: true },
      );

      // Flatten signed transactions
      const flatSignedTxns = signedTxns.flat();

      // Convert signed transactions to base64
      const signedTxnsBase64 = flatSignedTxns.map((signedTxn, index) => {
        if (!signedTxn) {
          throw new Error(`Failed to sign transaction ${index + 1}. Wallet returned null.`);
        }
        const binaryString = String.fromCharCode(...signedTxn);
        return btoa(binaryString);
      });

      setReclaimStatus({ appId, status: 'Submitting transactions...' });

      const result = await api.submitReclaimTransaction({
        signedTxns: signedTxnsBase64,
        appId,
        senderAddress: activeAddress,
      });

      setTransactions(prev =>
        prev.map(tx => {
          if (tx.appId === parseInt(appId)) {
            return { ...tx, reclaimed: true, reclaimedAt: new Date() };
          }
          return tx;
        }),
      );

      setReclaimStatus({ appId, status: 'Success' });
      const assetSymbol = getAssetSymbol(transactions.find(tx => tx.appId === parseInt(appId)));
      alert(`Successfully reclaimed ${result.amount} ${assetSymbol}!`);
    } catch (error) {
      console.error('Error reclaiming funds:', error);
      setReclaimStatus({ appId, status: 'Failed' });

      let errorMessage = 'Failed to reclaim funds';
      if (error.message.includes('rejected')) {
        errorMessage = 'Reclaim rejected - funds may have already been claimed';
      } else if (error.message.includes('insufficient')) {
        errorMessage = 'Insufficient ALGO for transaction fees';
      } else if (error.message.includes('null')) {
        errorMessage = 'Wallet failed to sign multisig transaction. Please ensure Defly Wallet is configured correctly.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      alert(`${errorMessage}: ${error.message || error}`);
    } finally {
      setIsReclaiming(false);
      setTimeout(() => {
        setReclaimStatus({ appId: null, status: '' });
      }, 3000);
    }
  };

  // ... (rest of the UI rendering code remains unchanged, including the table/card structure)

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
            <h2 className="text-xl font-semibold text-gray-900">My Transactions</h2>
            <p className="text-gray-600 text-sm">View and manage your transfers</p>
          </div>
        </div>
        {/* Security notice and other sections remain unchanged */}
      </div>

      {/* Transactions list */}
      {isLoading ? (
        <div className="w-full max-w-4xl mx-auto">
          <div className="card card-normal text-center">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 spinner"></div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Transactions</h2>
            <p className="text-gray-600 text-sm">Fetching your transaction history...</p>
          </div>
        </div>
      ) : error ? (
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
            <Link to="/" className="btn-primary px-4 py-2 font-medium">
              Back to Home
            </Link>
          </div>
        </div>
      ) : !activeAddress ? (
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
            <p className="text-gray-600 mb-4 text-sm">Please connect your Defly Wallet to view your transaction history.</p>
            <button
              onClick={() => deflyWallet?.connect().then(accounts => setActiveAddress(accounts[0])).catch(err => console.error('Connect error:', err))}
              className="btn-primary px-4 py-2 font-medium"
            >
              Connect Defly Wallet
            </button>
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="card card-normal text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
          <p className="text-gray-600 mb-4 text-sm">You haven't created any link yet. Create your first link!</p>
          <Link to="/" className="btn-primary px-4 py-2 font-medium">
            Send Crypto
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table and mobile cards remain unchanged */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(transaction.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{formatAmount(transaction.amount)} {getAssetSymbol(transaction)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.recipientEmail || <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Shareable Link</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.reclaimed ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Reclaimed</span>
                      ) : transaction.claimed ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Claimed</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {reclaimStatus.appId === transaction.appId && <span className="text-xs text-blue-600 mr-3">{reclaimStatus.status}</span>}
                      <div className="space-y-1">
                        {!transaction.funded ? (
                          <div className="text-sm">
                            <span className="text-amber-600 font-medium block mb-1">Incomplete Transfer</span>
                            <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200">
                              Navigate to main flow to pick up where you left off
                            </Link>
                          </div>
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
                            Clean Up (0.46 ALGO)
                          </button>
                        )}
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
          {/* Mobile cards remain unchanged */}
        </div>
      )}

      {/* Send more button */}
      <div className="text-center">
        <Link to="/" className="btn-primary px-6 py-3 font-medium inline-flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create another link</span>
        </Link>
      </div>
    </div>
  );
}

export default TransactionsPage;
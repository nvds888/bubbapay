import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SuccessPage() {
  const { escrowId } = useParams();
  const location = useLocation();
  const [escrowData, setEscrowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Get claim URL from location state or fetch from API
  const claimUrl = location.state?.claimUrl;
  const isShareable = location.state?.isShareable;
  
  useEffect(() => {
    const fetchEscrowData = async () => {
      try {
        const response = await axios.get(`${API_URL}/escrow/${escrowId}`);
        setEscrowData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching escrow data:', error);
        setError('Failed to load transaction details');
        setLoading(false);
      }
    };
    
    if (escrowId) {
      fetchEscrowData();
    }
  }, [escrowId]);
  
  // Copy claim URL to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };
  
  // Format USDC amount
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card card-normal text-center">
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 spinner"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Transaction Details</h2>
          <p className="text-gray-600 text-sm">Please wait...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card card-normal status-error text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
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
    <div className="max-w-md mx-auto space-y-6">
      {/* Success header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Payment Sent Successfully!</h1>
        <p className="text-gray-600 text-sm">
          Your USDC transfer has been completed and is ready to be claimed.
        </p>
      </div>
      
      {/* Transaction summary */}
      {escrowData && (
        <div className="card card-normal">
          <h3 className="font-medium text-gray-900 mb-3">Transaction Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-gray-900">{formatAmount(escrowData.amount)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="text-gray-900">{formatDate(escrowData.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Awaiting Claim
              </span>
            </div>
            {escrowData.appId && (
              <div className="flex justify-between">
                <span className="text-gray-600">App ID:</span>
                <span className="font-mono text-xs text-gray-900">{escrowData.appId}</span>
              </div>
            )}
          </div>
          
          {/* Expandable details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-ghost w-full mt-3 text-sm py-2"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Network:</span>
                <span>Algorand Testnet</span>
              </div>
              <div className="flex justify-between">
                <span>Recipient Fees:</span>
                <span>{escrowData.coverRecipientFees ? 'Covered by sender' : 'Paid by recipient'}</span>
              </div>
              <div className="flex justify-between">
                <span>Smart Contract:</span>
                <a 
                  href={`https://lora.algokit.io/testnet/application/${escrowData.appId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  View on Explorer
                </a>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Claim URL section */}
      {claimUrl && (isShareable !== false) && (
        <div className="card card-normal">
          <h3 className="font-medium text-gray-900 mb-3">Share Claim Link</h3>
          <p className="text-gray-600 text-sm mb-4">
            Send this secure link to your recipient so they can claim the USDC.
          </p>
          
          {/* URL display and copy */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={claimUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700"
              />
              <button
                onClick={() => copyToClipboard(claimUrl)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  copied 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                }`}
              >
                {copied ? (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Copied</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                  </div>
                )}
              </button>
            </div>
            
            {/* Quick share options */}
            <div className="flex space-x-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`I've sent you ${escrowData ? formatAmount(escrowData.amount) : ''} USDC! Claim it here: ${claimUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1 py-2 text-sm font-medium flex items-center justify-center space-x-2"
              >
                <span>WhatsApp</span>
              </a>
              <a
                href={`sms:?body=${encodeURIComponent(`I've sent you ${escrowData ? formatAmount(escrowData.amount) : ''} USDC! Claim it here: ${claimUrl}`)}`}
                className="btn-secondary flex-1 py-2 text-sm font-medium flex items-center justify-center space-x-2"
              >
                <span>SMS</span>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent('USDC Payment')}&body=${encodeURIComponent(`I've sent you ${escrowData ? formatAmount(escrowData.amount) : ''} USDC! Claim it here: ${claimUrl}`)}`}
                className="btn-secondary flex-1 py-2 text-sm font-medium flex items-center justify-center space-x-2"
              >
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Security reminder */}
      <div className="status-warning">
        <div className="flex items-start space-x-3">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm">
            <p className="font-medium text-amber-800">Security Reminder:</p>
            <p className="text-amber-700 mt-1">
              Keep this claim link secure. Anyone with access to it can claim the funds. 
              This link is only shown once for security reasons.
            </p>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-col space-y-3">
        <Link 
          to="/transactions"
          className="btn-secondary w-full py-3 px-4 font-medium flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>View All Transactions</span>
        </Link>
        
        <Link 
          to="/"
          className="btn-primary w-full py-3 px-4 font-medium flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Send Another Payment</span>
        </Link>
      </div>
    </div>
  );
}

export default SuccessPage;
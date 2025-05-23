import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SuccessPage() {
  const { escrowId } = useParams();
  const location = useLocation();
  
  // State for escrow details
  const [escrowDetails, setEscrowDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Get the claim URL from location state if available
  const claimUrl = location.state?.claimUrl;
  const isShareable = location.state?.isShareable;
  
  // Fetch escrow details when component mounts
  useEffect(() => {
    const fetchEscrowDetails = async () => {
      if (!escrowId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/escrow/${escrowId}`);
        // If we have a claim URL from navigation state, use that instead of what's in the database
        setEscrowDetails({
          ...response.data,
          // Override with location state if available
          claimUrl: claimUrl || response.data.claimUrl,
          isShareable: isShareable !== undefined ? isShareable : response.data.isShareable
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching escrow details:', error);
        
        // If we have a claim URL from state, create minimal escrow details
        if (claimUrl) {
          setEscrowDetails({
            claimUrl,
            isShareable: isShareable !== undefined ? isShareable : true,
            // We don't have other details, but we have the critical claim URL
          });
          setIsLoading(false);
        } else {
          setError('Failed to fetch transfer details');
          setIsLoading(false);
        }
      }
    };
    
    fetchEscrowDetails();
  }, [escrowId, claimUrl, isShareable]);
  
  // Copy claim URL to clipboard
  const copyToClipboard = () => {
    if (!escrowDetails?.claimUrl) return;
    
    navigator.clipboard.writeText(escrowDetails.claimUrl)
      .then(() => {
        setCopied(true);
        // Reset "Copied" status after 3 seconds
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  // Format USDC amount
  const formatAmount = (amount) => {
    if (!amount) return '0.00';
    return parseFloat(amount).toFixed(2);
  };
  
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="glass-dark border border-purple-500/20 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Transfer Details</h2>
          <p className="text-gray-400">Please wait while we fetch your transaction information...</p>
        </div>
      </div>
    );
  }
  
  // Handle error but still show claim URL if we have it from location state
  if ((error || !escrowDetails) && !claimUrl) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="glass-dark border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">
            {error || 'Unable to load transfer details. Please try again.'}
          </p>
          <Link 
            to="/"
            className="btn-primary px-6 py-3 rounded-xl font-semibold inline-flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }
  
  // If we don't have full escrow details but have the claim URL, render a minimal success page
  const hasMinimalDetails = escrowDetails && escrowDetails.claimUrl && !escrowDetails.amount;
  
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Success header with animation */}
      <div className="glass-dark border border-purple-500/20 rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center checkmark float">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">Transfer Successful! 🎉</h2>
        
        {!hasMinimalDetails && (
          <p className="text-gray-300 text-lg">
            You've successfully sent <span className="text-purple-300 font-bold">{formatAmount(escrowDetails.amount)} USDC</span>
            {escrowDetails.recipientEmail ? ` to ${escrowDetails.recipientEmail}` : ''}
          </p>
        )}
        {hasMinimalDetails && (
          <p className="text-gray-300 text-lg">
            You've successfully sent USDC{escrowDetails.recipientEmail ? ` to ${escrowDetails.recipientEmail}` : ''}
          </p>
        )}
      </div>
      
      {/* Email notification or shareable link section */}
      {escrowDetails.recipientEmail ? (
        <div className="glass-dark border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">Email Notification Sent</h3>
              <p className="text-gray-300 text-sm">
                An email with claim instructions has been sent to <span className="text-blue-300 font-medium">{escrowDetails.recipientEmail}</span>. 
                They'll need to connect their Algorand wallet to claim the funds.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-dark border border-purple-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-white font-semibold">Shareable Claim Link</h3>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl opacity-30 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
            <div className="relative flex">
              <input
                type="text"
                readOnly
                value={escrowDetails.claimUrl}
                className="block w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-l-xl text-gray-300 text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={copyToClipboard}
                className="btn-primary px-6 rounded-r-xl font-medium transition-all duration-300 relative overflow-hidden"
              >
                {copied ? (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Copied!</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                  </div>
                )}
              </button>
            </div>
          </div>
          
          {/* Enhanced security warning */}
          <div className="glass bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-amber-300 font-semibold mb-1">🔐 Critical: Secure This Link!</h4>
                <div className="text-amber-200 text-sm space-y-2">
                  <p>
                    This link controls access to the funds. Anyone with this link can claim the USDC.
                  </p>
                  <p>
                    <strong>Security recommendations:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Only share via secure, encrypted channels</li>
                    <li>Never post publicly or save in unsecured locations</li>
                    <li>If lost, only you (as creator) can reclaim the funds</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/"
          className="btn-secondary flex-1 py-3 px-6 rounded-xl font-semibold text-center transition-all duration-300"
        >
          <span className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Send Another</span>
          </span>
        </Link>
        
        <Link 
          to="/transactions"
          className="btn-primary flex-1 py-3 px-6 rounded-xl font-semibold text-center transition-all duration-300"
        >
          <span className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>View Transactions</span>
          </span>
        </Link>
      </div>
    </div>
  );
}

export default SuccessPage;
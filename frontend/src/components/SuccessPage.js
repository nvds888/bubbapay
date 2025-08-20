import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { getAssetInfo } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SuccessPage() {
  const { escrowId } = useParams();
  const location = useLocation();
  
  // State for escrow details
  const [escrowDetails, setEscrowDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Add asset info state
  const [assetInfo, setAssetInfo] = useState(null);
  
  // SECURITY: URL revelation state
  const [urlRevealed, setUrlRevealed] = useState(false);
  
  // Get the claim URL from location state if available
  const claimUrl = location.state?.claimUrl;
  const isShareable = location.state?.isShareable;
  
  // SECURITY: Browser History Protection - Clear sensitive data from history
  useEffect(() => {
    if (claimUrl) {
      window.history.replaceState(
        { ...location.state, claimUrl: null }, 
        '', 
        window.location.pathname
      );
    }
  }, [claimUrl, location.state]);
  
  // Fetch escrow details when component mounts
  useEffect(() => {
    const fetchEscrowDetails = async () => {
      if (!escrowId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/escrow/${escrowId}`);
        // If we have a claim URL from navigation state, use that instead of what's in the database
        const escrowData = {
          ...response.data,
          // Override with location state if available
          claimUrl: claimUrl || response.data.claimUrl,
          isShareable: isShareable !== undefined ? isShareable : response.data.isShareable
        };
        
        setEscrowDetails(escrowData);
        
        // GET ASSET INFO
        if (escrowData.assetId) {
          const asset = getAssetInfo(escrowData.assetId);
          setAssetInfo(asset);
        }
        
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
  
  // SECURITY: URL Obfuscation function
  const obfuscateUrl = (url) => {
    if (!url || !url.includes('#key=')) return url;
    const [base, key] = url.split('#key=');
    return `${base}#key=${key.slice(0, 8)}•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••${key.slice(-4)}`;
  };
  
  // SECURITY: Secure copy with auto-clear
  const copyToClipboard = () => {
    if (!escrowDetails?.claimUrl) return;
    
    navigator.clipboard.writeText(escrowDetails.claimUrl)
      .then(() => {
        setCopied(true);
        // Auto-clear clipboard after 2 minutes
        setTimeout(async () => {
          try {
            const clipboardContent = await navigator.clipboard.readText();
            if (clipboardContent === escrowDetails.claimUrl) {
              await navigator.clipboard.writeText('');
            }
          } catch (error) {
            // Silently fail - browser security prevents reading clipboard
          }
        }, 120000);
        
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
  
  // Add asset symbol helper function
  const getAssetSymbol = () => {
    return assetInfo?.symbol || 'tokens';
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card card-normal text-center">
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 spinner"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Transfer Details</h2>
          <p className="text-gray-600 text-sm">Please wait while we fetch your transaction information...</p>
        </div>
      </div>
    );
  }
  
  // Handle error but still show claim URL if we have it from location state
  if ((error || !escrowDetails) && !claimUrl) {
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4 text-sm">
            {error || 'Unable to load transfer details. Please try again.'}
          </p>
          <Link 
            to="/"
            className="btn-primary px-4 py-2 font-medium inline-flex items-center space-x-2"
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
  
  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Success header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Magic Link Created Successfully!</h1>
        <p className="text-gray-600 text-sm">
          Your {getAssetSymbol()} shareable link is generated and ready to be claimed.
        </p>
      </div>
      
      {/* Transaction summary */}
      {escrowDetails && (
        <div className="card card-normal">
          <h3 className="font-medium text-gray-900 mb-3">Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-gray-900">{formatAmount(escrowDetails.amount)} {getAssetSymbol()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="text-gray-900">
                {escrowDetails.createdAt ? new Intl.DateTimeFormat('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(new Date(escrowDetails.createdAt)) : 'Just now'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Awaiting Claim
              </span>
            </div>
            {escrowDetails.appId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Contract:</span>
                <a
                  href={`https://lora.algokit.io/mainnet/application/${escrowDetails.appId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200 flex items-center space-x-1"
                >
                  <span className="text-xs">View Explorer</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Claim URL section with security */}
      {escrowDetails?.claimUrl && (escrowDetails.isShareable !== false) && (
        <div className="card card-normal">
          <h3 className="font-medium text-gray-900 mb-3">Share Claim Link</h3>
          <p className="text-gray-600 text-sm mb-4">
            Send this link to your recipient so they can claim the {getAssetSymbol()}.
          </p>
          
          <div className="space-y-3">
            {!urlRevealed ? (
              // Hidden state with obfuscated preview
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-2">🔒 Link hidden for security</div>
                <div className="font-mono text-xs text-gray-400 mb-3 break-words overflow-hidden">
                  {obfuscateUrl(escrowDetails.claimUrl)}
                </div>
                <button
                  onClick={() => setUrlRevealed(true)}
                  className="btn-primary w-full py-2 text-sm"
                >
                  Reveal Link
                </button>
              </div>
            ) : (
              // Revealed state
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
                  ⚠️ Link is now visible - copy securely
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={escrowDetails.claimUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      copied 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {copied && (
                  <div className="text-xs text-blue-600">
                    🔒 Will auto-clear from clipboard in 2 minutes
                  </div>
                )}
                <button
                  onClick={() => setUrlRevealed(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Hide link
                </button>
              </>
            )}
            
            {/* Quick share options */}
            {urlRevealed && (
              <div className="flex space-x-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`I've sent you ${escrowDetails ? formatAmount(escrowDetails.amount) : ''} ${getAssetSymbol()}! Claim it here: ${escrowDetails.claimUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 py-2 text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(escrowDetails.claimUrl)}&text=${encodeURIComponent(`I've sent you ${escrowDetails ? formatAmount(escrowDetails.amount) : ''} ${getAssetSymbol()}! Claim it here:`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 py-2 text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <span>Telegram</span>
                </a>
              </div>
            )}
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
          className="btn-secondary w-full py-2 px-4 font-medium flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>View All Transactions</span>
        </Link>
        
        <Link 
          to="/"
          className="btn-primary w-full py-2 px-4 font-medium flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Another Link</span>
        </Link>
      </div>
    </div>
  );
}

export default SuccessPage;
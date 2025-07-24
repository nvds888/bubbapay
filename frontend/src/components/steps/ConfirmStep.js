import React, { useEffect, useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { WalletButton } from '@txnlab/use-wallet-ui-react';

function ConfirmStep({
  formData,
  accountAddress,
  prevStep,
  isLoading,
  error,
  txnData,
  generateTransaction,
  handleSignFirstTransaction,
  handleSignGroupTransactions,
  mcpSessionData = null,
  onWalletConnect = null,
  selectedAssetInfo = { symbol: 'USDC', name: 'USDC' } // Default to USDC for now
}) {
  const [stage, setStage] = useState('initial'); // initial, app-created, funded
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  
  // Get wallet functionality from use-wallet
  const { activeAddress } = useWallet();
  
  // Use the effective account address (for MCP compatibility)
  const effectiveAccountAddress = accountAddress || activeAddress;
  
  // Update stage based on transaction data
  useEffect(() => {
    if (txnData) {
      if (txnData.appId) {
        setStage('app-created');
      }
    }
  }, [txnData]);
  
  // Handle wallet connection for MCP users
  const handleWalletConnection = (walletAddress) => {
    if (onWalletConnect) {
      onWalletConnect(walletAddress);
    }
    console.log('Wallet connected for MCP user:', walletAddress);
  };
  
  // Monitor wallet connection changes for MCP
  useEffect(() => {
    if (activeAddress && onWalletConnect && !effectiveAccountAddress) {
      handleWalletConnection(activeAddress);
    }
  }, [activeAddress, onWalletConnect, effectiveAccountAddress]);
  
  // Format USDC amount with 2 decimal places
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };
  
  // Format Algorand address
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`;
  };
  
  // Check if wallet is connected
  const isWalletConnected = !!effectiveAccountAddress;
  
  // Determine if back button should be shown
  const canGoBack = !mcpSessionData && stage === 'initial';
  
  return (
    <div className="max-w-md mx-auto">
      {/* Compact header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3" 
             style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'}}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Confirm & Send</h2>
        <p className="text-gray-600 text-sm">
          {!isWalletConnected ? 'Connect your wallet to continue' : 'Review and sign transaction'}
        </p>
      </div>
      
      {/* Transaction summary */}
      <div className="card card-normal mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Transaction Summary</h3>
          <button
            type="button"
            onClick={() => setShowTransactionDetails(!showTransactionDetails)}
            className="btn-ghost text-xs px-2 py-1"
          >
            {showTransactionDetails ? 'Hide' : 'Details'}
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold text-lg">{formatAmount(formData.amount)} {selectedAssetInfo?.symbol || 'tokens'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">From:</span>
            <span className="font-mono text-sm text-purple-600">
              {isWalletConnected ? formatAddress(effectiveAccountAddress) : 'Connect wallet'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">To:</span>
            <span className="text-gray-900">
              {formData.isShareableLink ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Shareable Link
                </span>
              ) : (
                formData.recipientEmail
              )}
            </span>
          </div>
          
          {formData.payRecipientFees && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fee Coverage:</span>
              <span className="text-green-600 font-medium">0.21 ALGO</span>
            </div>
          )}
        </div>
        
        {/* Expanded transaction details */}
        {showTransactionDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Network:</span>
              <span>Algorand Testnet</span>
            </div>
            <div className="flex justify-between">
              <span>Settlement:</span>
              <span>Instant</span>
            </div>
            <div className="flex justify-between">
              <span>Security:</span>
              <span>Smart Contract</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Status indicator */}
      {stage === 'app-created' && (
        <div className="card card-compact status-info mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Smart contract created. Complete the final step to fund the transfer.</span>
          </div>
        </div>
      )}
      
      {/* Wallet Connection Section for MCP users */}
      {!isWalletConnected && mcpSessionData && (
        <div className="card card-normal mb-4">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Connect Your Wallet</h3>
              <p className="text-gray-600 text-sm mt-1">
                Connect your wallet to sign this transaction
              </p>
            </div>
            
            <WalletButton />
          </div>
        </div>
      )}
      
      {/* Transaction steps - compact */}
      {isWalletConnected && (
        <div className="card card-normal mb-4">
          <h3 className="font-medium text-gray-900 mb-3">Transaction Steps</h3>
          <p className="text-gray-600 text-sm mb-4">
            Sign two transactions with your wallet:
          </p>
          
          <div className="space-y-3">
            {/* Step 1 */}
            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              stage === 'initial' 
                ? 'bg-purple-50 border border-purple-200' 
                : stage !== 'initial' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                stage === 'initial'
                  ? 'bg-purple-100 text-purple-700'
                  : stage !== 'initial'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {stage !== 'initial' ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1  1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  '1'
                )}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  stage === 'initial' ? 'text-purple-900' : stage !== 'initial' ? 'text-green-900' : 'text-gray-700'
                }`}>
                  Create Smart Contract
                </div>
                <div className="text-xs text-gray-600">
                  {stage === 'initial' ? 'Ready to sign' : stage !== 'initial' ? 'Completed' : 'Pending'}
                </div>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              stage === 'app-created' 
                ? 'bg-purple-50 border border-purple-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                stage === 'app-created'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                2
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  stage === 'app-created' ? 'text-purple-900' : 'text-gray-600'
                }`}>
                  Fund & Setup Transfer
                </div>
                <div className="text-xs text-gray-600">
                  {stage === 'app-created' ? 'Ready to sign' : 'Pending'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="card card-compact status-error mb-4">
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
      
      {/* Action buttons */}
      {isWalletConnected && (
        <div className="flex space-x-3">
          {canGoBack && (
            <button
              type="button"
              onClick={prevStep}
              disabled={isLoading}
              className="btn-secondary flex-1 py-3 px-4 disabled:opacity-50"
            >
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </span>
            </button>
          )}
          
          {stage === 'initial' && (
            <button
              type="button"
              onClick={handleSignFirstTransaction}
              disabled={isLoading}
              className={`btn-primary py-3 px-4 font-medium disabled:opacity-70 ${
                !canGoBack ? 'w-full' : 'flex-1'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 spinner"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Sign First Transaction</span>
                  </>
                )}
              </span>
            </button>
          )}
          
          {stage === 'app-created' && (
            <button
              type="button"
              onClick={handleSignGroupTransactions}
              disabled={isLoading}
              className="btn-primary w-full py-3 px-4 font-medium disabled:opacity-70"
            >
              <span className="flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 spinner"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Sign Final Transaction</span>
                  </>
                )}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ConfirmStep;
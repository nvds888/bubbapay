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
  selectedAssetInfo, 
  recoveryMode = false, 
  currentEscrow = null   
}) {
  // Initialize stage based on recovery mode
  const [stage, setStage] = useState(recoveryMode ? 'app-created' : 'initial'); 
  const [subStage, setSubStage] = useState('idle'); // idle, signing-1, submitting-1, signing-2, submitting-2, completed
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  
  // Get wallet functionality from use-wallet
  const { activeAddress } = useWallet();
  
  // Use the effective account address (for MCP compatibility)
  const effectiveAccountAddress = accountAddress || activeAddress;
  
  // Update stage based on transaction data (but not in recovery mode)
  useEffect(() => {
    if (!recoveryMode && txnData) {
      if (txnData.appId) {
        setStage('app-created');
      }
    }
  }, [txnData, recoveryMode]);
  
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
  
  // Determine if back button should be shown (not for MCP or recovery mode)
  const canGoBack = !mcpSessionData && !recoveryMode && stage === 'initial';
  
  return (
    <div className="max-w-md mx-auto">
      
      {/* Compact header */}
<div className="text-center mb-6">
  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3" 
       style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'}}>
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  </div>
  <h2 className="text-xl font-semibold text-gray-900 mb-1">
    {recoveryMode ? 'Complete Link Creation' : 'Finalise Your Magic Link'}
  </h2>
  <div className="flex items-center justify-center space-x-2 mb-2">
    <div className="px-3 py-1 bg-green-50 border border-green-200 rounded-full hover:bg-green-100 transition-colors">
      <span className="text-green-700 text-sm font-medium">Shareable Claim Link</span>
    </div>
  </div>
  <p className="text-gray-600 text-sm">
    {!isWalletConnected ? 'Connect your wallet to continue' : 
     recoveryMode ? 'Fund your existing link App' : 'Complete the two steps below to generate the link'}
  </p>
</div>
      
      {/* Transaction summary */}
<div className="card card-normal mb-4 group hover:shadow-sm transition-shadow">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <div>
        <h3 className="font-medium text-gray-900">Configuration</h3>
        <p className="text-xs text-gray-500">Recipient can claim instantly</p>
      </div>
    </div>
    <button
      type="button"
      onClick={() => setShowTransactionDetails(!showTransactionDetails)}
      className="btn-ghost text-xs px-2 py-1 opacity-60 group-hover:opacity-100 transition-opacity"
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
      <span className="text-gray-600">Recipient:</span>
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors">
        Shareable Claim Link
      </span>
    </div>
    
    {formData.payRecipientFees && (
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Fee Coverage:</span>
        <span className="text-green-600 font-medium">0.21 ALGO</span>
      </div>
    )}
          
          {/*Show app info in recovery mode */}
          {recoveryMode && currentEscrow && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">App ID:</span>
              <span className="font-mono text-sm text-blue-600">{currentEscrow.appId}</span>
            </div>
          )}
        </div>
        
        {/* Expanded transaction details */}
{showTransactionDetails && (
  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
    <div className="flex justify-between">
      <span>Sender Address:</span>
      <span className="font-mono text-xs text-purple-600">
        {isWalletConnected ? formatAddress(effectiveAccountAddress) : 'Connect wallet'}
      </span>
    </div>
    <div className="flex justify-between">
      <span>Network:</span>
      <span>Algorand Mainnet</span>
    </div>
    <div className="flex justify-between">
      <span>Asset ID:</span>
      <span className="font-mono text-xs">{selectedAssetInfo?.id || 'Loading...'}</span>
    </div>
    <div className="flex justify-between">
      <span>Validity Link:</span>
      <span>Indefinite</span>
    </div>
    {recoveryMode && (
      <div className="flex justify-between">
        <span>Status:</span>
        <span className="text-blue-600">App Created - Ready to Fund</span>
      </div>
    )}
  </div>
)}
      </div>
      
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
      
      {/* Transaction steps - horizontal flow */}
      {isWalletConnected && (
        <div className="card card-normal mb-4">
          <h3 className="font-medium text-gray-900 mb-4">Complete following steps</h3>
          
          {/* Horizontal Step Flow */}
          <div className="flex items-center justify-between mb-4">
            {/* Step 1 - Show as completed in recovery mode */}
            <div className="flex-1 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                recoveryMode ? 'bg-green-100 text-green-700' : // Always completed in recovery mode
                stage === 'initial' && subStage === 'signing-1'
                  ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200 animate-pulse'
                  : stage === 'initial' && subStage === 'submitting-1'
                  ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200'
                  : stage !== 'initial'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {recoveryMode || stage !== 'initial' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : subStage === 'submitting-1' ? (
                  <div className="w-4 h-4 spinner"></div>
                ) : (
                  '1'
                )}
              </div>
              <div className="text-xs font-medium text-gray-900 mt-2 text-center">
                Setup App
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {recoveryMode ? 'Complete' :
                 stage === 'initial' && subStage === 'signing-1' ? 'Sign transaction' :
                 stage === 'initial' && subStage === 'submitting-1' ? 'Processing...' :
                 stage !== 'initial' ? 'Complete' : 'Ready'}
              </div>
            </div>

            {/* Progress Connector */}
            <div className="flex-1 px-4">
              <div className="relative">
                <div className="h-0.5 bg-gray-200 rounded-full"></div>
                <div className={`absolute top-0 left-0 h-0.5 rounded-full transition-all duration-500 ${
                  recoveryMode || stage !== 'initial' ? 'w-full bg-green-400' : 'w-0 bg-purple-400'
                }`}></div>
              </div>
            </div>

            {/* Step 2 - This is the active step in recovery mode */}
            <div className="flex-1 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                stage === 'app-created' && subStage === 'signing-2'
                  ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200 animate-pulse'
                  : stage === 'app-created' && subStage === 'submitting-2'
                  ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200'
                  : subStage === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : stage === 'app-created' || recoveryMode
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {subStage === 'completed' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : stage === 'app-created' && subStage === 'submitting-2' ? (
                  <div className="w-4 h-4 spinner"></div>
                ) : (
                  '2'
                )}
              </div>
              <div className="text-xs font-medium text-gray-900 mt-2 text-center">
                Fund App
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stage === 'app-created' && subStage === 'signing-2' ? 'Sign transaction' :
                 stage === 'app-created' && subStage === 'submitting-2' ? 'Processing...' :
                 subStage === 'completed' ? 'Complete' :
                 stage === 'app-created' || recoveryMode ? 'Ready' : 'Pending'}
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
          
          {/* Skip first transaction in recovery mode */}
          {!recoveryMode && stage === 'initial' && (
            <button
              type="button"
              onClick={async () => {
                setSubStage('signing-1');
                try {
                  await handleSignFirstTransaction();
                  // Show submitting state briefly before completion
                  setSubStage('submitting-1');
                  setTimeout(() => setSubStage('idle'), 500);
                } catch (error) {
                  setSubStage('idle');
                  throw error;
                }
              }}
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
                    <span>Sign (1/2)</span>
                  </>
                )}
              </span>
            </button>
          )}

          {/* Second transaction (funding) - available both in normal mode after first txn and immediately in recovery mode */}
          {(stage === 'app-created' || recoveryMode) && (
            <button
              type="button"
              onClick={async () => {
                setSubStage('signing-2');
                try {
                  await handleSignGroupTransactions();
                  // Show submitting state briefly before completion
                  setSubStage('submitting-2');
                  setTimeout(() => setSubStage('completed'), 500);
                } catch (error) {
                  setSubStage('idle');
                  throw error;
                }
              }}
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
                    <span>{recoveryMode ? 'Fund Escrow' : 'Sign (2/2)'}</span>
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
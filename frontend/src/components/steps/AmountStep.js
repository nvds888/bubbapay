import React, { useState } from 'react';

function AmountStep({ 
  formData, 
  handleInputChange, 
  nextStep, 
  isConnected, 
  onConnectWallet,
  usdcBalance,
  balanceLoading,
  balanceError,
  algoAvailability,
  algoLoading,
  algoError
}) {
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);
  
  // Quick amount options
  const quickAmounts = [10, 25, 50, 100];
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    // Check if amount exceeds balance
    if (usdcBalance !== null && parseFloat(formData.amount) > parseFloat(usdcBalance)) {
      setError(`Amount exceeds your available balance of ${parseFloat(usdcBalance).toFixed(2)} USDC`);
      return;
    }
    
    // Check if wallet is connected
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    // Check ALGO availability
    if (algoAvailability && !algoAvailability.hasSufficientAlgo) {
      const totalCost = algoAvailability.requiredForTransaction;
      const deficit = algoAvailability.shortfall || 0;
      
      let errorMessage = `Transaction requires ${totalCost} ALGO total. You need ${deficit} more ALGO.`;
      
      if (formData.payRecipientFees && algoAvailability.breakdown?.recipientFunding === "0.400000") {
        const costWithoutRecipientFees = (parseFloat(totalCost) - 0.401).toFixed(6);
        const availableBalance = parseFloat(algoAvailability.availableBalance);
        
        if (availableBalance >= parseFloat(costWithoutRecipientFees)) {
          errorMessage += ` You could complete this transaction by unchecking "Cover recipient's transaction fees".`;
        }
      }
      
      setError(errorMessage);
      return;
    }
    
    if (algoAvailability && !algoAvailability.canCompleteGroupTxns) {
      const groupDeficit = algoAvailability.groupTxnShortfall || 0;
      
      let errorMessage = `You have enough ALGO to create the app, but not enough to complete the funding step. You need ${groupDeficit} more ALGO after app creation.`;
      
      if (formData.payRecipientFees && algoAvailability.breakdown?.recipientFunding === "0.400000") {
        errorMessage += ` Try unchecking "Cover recipient's transaction fees" to reduce the cost.`;
      }
      
      setError(errorMessage);
      return;
    }
    
    setError('');
    nextStep();
  };
  
  // Handle quick amount selection
  const setQuickAmount = (amount) => {
    setError('');
    handleInputChange({
      target: {
        name: 'amount',
        value: amount.toString()
      }
    });
  };
  
  // Set max amount based on balance
  const setMaxAmount = () => {
    if (usdcBalance) {
      setError('');
      const balanceStr = String(usdcBalance);
      handleInputChange({
        target: {
          name: 'amount',
          value: balanceStr
        }
      });
    }
  };

  // Get status for balance/ALGO checks
  const getTransactionStatus = () => {
    if (!isConnected) return { type: 'warning', message: 'Connect wallet to continue' };
    if (balanceLoading || algoLoading) return { type: 'info', message: 'Checking balances...' };
    if (balanceError || algoError) return { type: 'error', message: balanceError || algoError };
    
    if (algoAvailability && !algoAvailability.hasSufficientAlgo) {
      return { type: 'error', message: `Need ${algoAvailability.shortfall} more ALGO` };
    }
    
    if (algoAvailability && !algoAvailability.canCompleteGroupTxns) {
      return { type: 'warning', message: `Need ${algoAvailability.groupTxnShortfall} more ALGO after app creation` };
    }
    
    if (algoAvailability && algoAvailability.hasSufficientAlgo && algoAvailability.canCompleteGroupTxns) {
      return { type: 'success', message: 'Transaction ready' };
    }
    
    return null;
  };

  const status = getTransactionStatus();
  
  return (
    <div className="max-w-md mx-auto">
      {/* Compact header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3" 
             style={{background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)'}}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Send USDC</h2>
        <p className="text-gray-600 text-sm">Fast, secure payments on Algorand</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount input section */}
        <div className="card card-normal">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-700">Amount (USDC)</label>
            {isConnected && usdcBalance !== null && (
              <button 
                type="button"
                onClick={() => setShowBalanceDetails(!showBalanceDetails)}
                className="text-xs text-gray-500 hover:text-purple-600 flex items-center space-x-1"
              >
                <span>Balance: {parseFloat(usdcBalance).toFixed(2)} USDC</span>
                <svg className={`w-3 h-3 transition-transform ${showBalanceDetails ? 'rotate-180' : ''}`} 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Amount input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">$</span>
            </div>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full pl-7 pr-16 py-3 text-lg font-medium border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              max={usdcBalance || undefined}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm font-medium">USDC</span>
            </div>
          </div>
          
          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {quickAmounts.map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => setQuickAmount(amount)}
                disabled={usdcBalance !== null && amount > parseFloat(usdcBalance)}
                className="btn-secondary compact-button disabled:opacity-50"
              >
                ${amount}
              </button>
            ))}
          </div>
          
          {usdcBalance !== null && (
            <button 
              type="button"
              onClick={setMaxAmount}
              className="btn-ghost text-xs mt-2 w-full"
            >
              Use max balance
            </button>
          )}
        </div>
        
        {/* Status indicator */}
        {status && (
          <div className={`card card-compact status-${status.type} flex items-center justify-between`}>
            <div className="flex items-center space-x-2">
              {status.type === 'success' && (
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {status.type === 'warning' && (
                <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {status.type === 'error' && (
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {status.type === 'info' && (
                <div className="w-4 h-4 spinner"></div>
              )}
              <span className="text-sm">{status.message}</span>
            </div>
            
            {(status.type === 'error' || status.type === 'warning') && algoAvailability && (
              <button
                type="button"
                onClick={() => setShowBalanceDetails(!showBalanceDetails)}
                className="btn-ghost text-xs px-2 py-1"
              >
                Details
              </button>
            )}
          </div>
        )}
        
        {/* Collapsible balance details */}
        {showBalanceDetails && (
          <div className="card card-compact space-y-2 text-sm">
            <h4 className="font-medium text-gray-700">Balance Details</h4>
            
            {usdcBalance !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">USDC Balance:</span>
                <span className="font-medium">{parseFloat(usdcBalance).toFixed(2)} USDC</span>
              </div>
            )}
            
            {algoAvailability && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">ALGO Available:</span>
                  <span className="font-medium">{algoAvailability.availableBalance} ALGO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ALGO Required:</span>
                  <span className="font-medium">{algoAvailability.requiredForTransaction} ALGO</span>
                </div>
                
                {algoAvailability.breakdown && (
                  <div className="pt-2 border-t border-gray-200 space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>App creation fee:</span>
                      <span>{algoAvailability.breakdown.appCreationFee} ALGO</span>
                    </div>
                    <div className="flex justify-between">
                      <span>App min balance:</span>
                      <span>{algoAvailability.breakdown.appMinBalanceIncrease || '0.100000'} ALGO</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temp account funding:</span>
                      <span>{algoAvailability.breakdown.tempAccountFunding || '0.102000'} ALGO</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contract funding:</span>
                      <span>{algoAvailability.breakdown.contractFunding} ALGO</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform fee:</span>
                      <span>{algoAvailability.breakdown.platformFee || '0.100000'} ALGO</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction fees:</span>
                      <span>{algoAvailability.breakdown.groupTransactionFees || algoAvailability.breakdown.totalFees} ALGO</span>
                    </div>
                    {formData.payRecipientFees && (
                      <div className="flex justify-between">
                        <span>Recipient fees:</span>
                        <span>{algoAvailability.breakdown.recipientFunding} ALGO</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Advanced options - collapsible */}
        <div className="card card-compact">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-sm font-medium text-gray-700"
          >
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.payRecipientFees}
                onChange={handleInputChange}
                name="payRecipientFees"
                className="w-4 h-4 text-purple-600 rounded"
                onClick={(e) => e.stopPropagation()}
              />
              <span>Cover recipient fees</span>
            </div>
            <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showAdvanced && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
              <p>Pay ~0.4 ALGO to cover the recipient's wallet funding and transaction costs. This makes claiming easier for new users.</p>
            </div>
          )}
        </div>
        
        {/* Error display */}
        {error && (
          <div className="card card-compact status-error">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            className="btn-secondary flex-1 py-3 px-4 opacity-50 cursor-not-allowed"
            disabled
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 py-3 px-4 font-medium"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

export default AmountStep;
import React from 'react';

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
  const [error, setError] = React.useState('');
  
  // Debug logging - remove this after testing
  console.log("AmountStep Debug:", {
    algoAvailability,
    algoLoading,
    algoError,
    isConnected,
    formData
  });
  
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
    
    // Check ALGO availability - simplified logic
    if (algoAvailability && (!algoAvailability.hasSufficientAlgo || !algoAvailability.canCompleteGroupTxns)) {
      const totalCost = algoAvailability.requiredForTransaction;
      const deficit = Math.max(algoAvailability.shortfall || 0, algoAvailability.groupTxnShortfall || 0);
      
      let errorMessage = `This transaction costs ${totalCost} ALGO total. You need ${deficit} more ALGO.`;
      
      // Check if they'd have enough without recipient fees
      if (formData.payRecipientFees && algoAvailability.breakdown?.recipientFunding === "0.400000") {
        // Calculate what the cost would be without recipient fees (0.4 ALGO + 0.001 ALGO fee)
        const costWithoutRecipientFees = (parseFloat(totalCost) - 0.401).toFixed(6);
        const availableBalance = parseFloat(algoAvailability.availableBalance);
        
        if (availableBalance >= parseFloat(costWithoutRecipientFees)) {
          errorMessage += ` You could complete this transaction by unchecking "Cover recipient's transaction fees".`;
        }
      }
      
      setError(errorMessage);
      return;
    }
    
    // Clear error and proceed
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
  
  return (
    <div className="space-y-8">
      {/* Header section with animated elements */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 mb-4 float">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white">Send USDC</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Send USDC to anyone, anywhere, instantly
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount input section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-white">
              Amount (USDC)
            </label>
            {isConnected && usdcBalance !== null && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">Balance:</span>
                <span className="text-purple-300 font-medium">
                  {parseFloat(usdcBalance).toFixed(2)} USDC
                </span>
                <button 
                  type="button"
                  onClick={setMaxAmount}
                  className="text-purple-400 hover:text-purple-300 text-xs font-medium underline transition-colors duration-300"
                >
                  Max
                </button>
              </div>
            )}
          </div>
          
          {/* Enhanced input with gradient border */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl opacity-30 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">$</span>
              </div>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="block w-full pl-8 pr-16 py-4 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-lg font-medium"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                max={usdcBalance || undefined}
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-gray-400 font-medium">USDC</span>
              </div>
            </div>
          </div>
          
          {/* Balance and ALGO availability status */}
          <div className="space-y-3">
            {balanceLoading && (
              <div className="flex items-center space-x-2 text-purple-300 text-sm">
                <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading your USDC balance...</span>
              </div>
            )}
            
            {balanceError && (
              <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{balanceError}</span>
              </div>
            )}
            
            {/* ALGO Loading State */}
            {algoLoading && (
              <div className="flex items-center space-x-2 text-blue-300 text-sm">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                <span>Checking ALGO availability...</span>
              </div>
            )}
            
            {/* ALGO Insufficient Warning - Simplified */}
            {algoAvailability && (!algoAvailability.hasSufficientAlgo || !algoAvailability.canCompleteGroupTxns) && (
              <div className="glass border border-red-500/20 bg-red-500/10 rounded-xl p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm">
                    <div className="text-red-300 font-medium">Insufficient ALGO Balance</div>
                    <div className="text-red-200 mt-1">
                      <div>
                        Transaction costs <span className="font-mono">{algoAvailability.requiredForTransaction} ALGO</span> total.
                      </div>
                      <div>
                        You need <span className="font-mono">{Math.max(algoAvailability.shortfall || 0, algoAvailability.groupTxnShortfall || 0)} ALGO</span> more.
                      </div>
                      {/* Show suggestion to disable recipient fees if applicable */}
                      {formData.payRecipientFees && 
                       algoAvailability.breakdown?.recipientFunding === "0.400000" && 
                       parseFloat(algoAvailability.availableBalance) >= (parseFloat(algoAvailability.requiredForTransaction) - 0.401) && (
                        <div className="mt-2 text-yellow-200">
                          💡 Try unchecking "Cover recipient's transaction fees" to reduce the cost.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* ALGO Sufficient - Clean display */}
            {algoAvailability && algoAvailability.hasSufficientAlgo && algoAvailability.canCompleteGroupTxns && (
              <div className="flex items-center space-x-2 text-green-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>
                  Transaction cost: {algoAvailability.requiredForTransaction} ALGO 
                  (Available: {algoAvailability.availableBalance} ALGO)
                </span>
              </div>
            )}
            
            {/* ALGO Error */}
            {algoError && (
              <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{algoError}</span>
              </div>
            )}
            
            {/* Form Validation Error */}
            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick amounts */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-300">Quick amounts</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickAmounts.map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => setQuickAmount(amount)}
                disabled={usdcBalance !== null && amount > parseFloat(usdcBalance)}
                className="glass-dark hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-400 rounded-lg py-3 px-4 text-white font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>
        
        {/* Fee coverage option */}
        <div className="glass-dark p-4 rounded-xl border border-purple-500/20">
          <label className="flex items-start space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                name="payRecipientFees"
                checked={formData.payRecipientFees}
                onChange={handleInputChange}
                className="w-5 h-5 text-purple-500 bg-gray-900 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              {formData.payRecipientFees && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <span className="text-white font-medium">Cover recipient's fees (onboarding wizard)</span>
              <p className="text-gray-400 text-sm mt-1">
                Pay 0.4 ALGO to cover the recipient's wallet funding and transaction costs
              </p>
            </div>
          </label>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="button"
            className="btn-secondary flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 opacity-50 cursor-not-allowed"
            disabled
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <span>Continue</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AmountStep;
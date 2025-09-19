import React, { useState } from 'react';
import AssetSelectionModal from '../AssetSelectionModal';
import { getAssetMinAmount, getAssetStep } from '../../services/api';
import { formatAssetAmount } from '../../utils/assetFormatter';

function AmountStep({ 
  formData = {}, 
  handleInputChange, 
  nextStep, 
  isConnected, 
  onConnectWallet,
  assetBalance,
  selectedAssetInfo,
  balanceLoading,
  balanceError,
  algoAvailability,
  algoLoading,
  algoError,
  selectedAssetId,
  onAssetSelect
}) {
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  

  // Quick amount options
  const quickAmounts = [10, 25, 50, 100];

  // Get asset-specific minimum and step values
const assetMinAmount = getAssetMinAmount(selectedAssetId);
const assetStep = getAssetStep(selectedAssetId);

  const safeFormData = {
    amount: '',
    payRecipientFees: false,
    ...formData  
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate amount
    if (!safeFormData.amount || parseFloat(safeFormData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    // Check minimum amount
if (parseFloat(safeFormData.amount) < assetMinAmount) {
  const symbol = selectedAssetInfo?.symbol || 'tokens';
  setError(`Minimum amount is ${assetMinAmount} ${symbol}`);
  return;
}
    
    // Check if amount exceeds balance
    if (assetBalance !== null && parseFloat(safeFormData.amount) > parseFloat(assetBalance)) {
      const symbol = selectedAssetInfo?.symbol || 'tokens';
      const maxBalance = formatAssetAmount(assetBalance, selectedAssetInfo);
setError(`Amount exceeds your available balance of ${maxBalance} ${symbol}`);
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
      
      const shortage = parseFloat(algoAvailability.requiredForTransaction) - parseFloat(algoAvailability.availableBalance);
const displayShortage = Math.ceil(shortage * 100) / 100;
let errorMessage = `Transaction requires ${algoAvailability.requiredForTransaction} ALGO total. You need ~${displayShortage.toFixed(2)} more ALGO.`;
      
      if (safeFormData.payRecipientFees && algoAvailability.breakdown?.recipientFunding === "0.300000") {
        const costWithoutRecipientFees = (parseFloat(totalCost) - 0.301).toFixed(6);
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
      
      if (safeFormData.payRecipientFees && algoAvailability.breakdown?.recipientFunding === "0.300000") {
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
  if (assetBalance && parseFloat(assetBalance) > 0) {
    setError('');
    
    const balance = parseFloat(assetBalance);
    const decimals = selectedAssetInfo?.decimals || 6;
    
    const maxAmount = formatAssetAmount(balance, selectedAssetInfo);
    
    handleInputChange({
      target: {
        name: 'amount',
        value: maxAmount
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
    const shortage = parseFloat(algoAvailability.requiredForTransaction) - parseFloat(algoAvailability.availableBalance);
const displayShortage = Math.ceil(shortage * 100) / 100;
return { type: 'error', message: `Need ~${displayShortage.toFixed(2)} more ALGO` };
  }
  
  if (algoAvailability && !algoAvailability.canCompleteGroupTxns) {
    return { type: 'warning', message: `Need ${algoAvailability.groupTxnShortfall} more ALGO after app creation` };
  }
  
// Check if entered amount exceeds available balance
if (assetBalance !== null && safeFormData.amount) {
  const balance = parseFloat(assetBalance);
  const enteredAmount = parseFloat(safeFormData.amount);
  
  if (enteredAmount > balance) {
    return { 
      type: 'warning', 
      message: `Insufficient ${selectedAssetInfo?.symbol || 'asset'} balance` 
    };
  }
}

// Check minimum balance requirement (0.01 minimum)
if (assetBalance !== null) {
  const balance = parseFloat(assetBalance);
  
  if (balance < assetMinAmount) {
    return { 
      type: 'warning', 
      message: `Insufficient ${selectedAssetInfo?.symbol || 'asset'} balance` 
    };
  }
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
       style={{}}>
    <img
  src="/bubbapay.jpg"
  alt="Bubbapay Logo"
  className="w-12 h-12 rounded-lg object-cover group-hover:scale-110 transition-all duration-500 animate-bounce-in"
  data-logo-transition="true"
  id="bubbapay-logo-source"
/>
  </div>
  <h2 className="text-xl font-semibold text-gray-900 mb-1">
    Create Claim Link
  </h2>
  <div className="flex items-center justify-center space-x-2 mb-2">
    <div className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-full hover:bg-purple-100 transition-colors">
      <span className="text-purple-700 text-sm font-medium">{selectedAssetInfo?.symbol || 'Asset'}</span>
    </div>
  </div>
</div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount input section */}
        <div className="card card-normal">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-700">Amount</label>
            
            {/* Asset selector button */}
            <button
              type="button"
              onClick={() => setShowAssetModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">{selectedAssetInfo?.symbol || 'Select Asset'}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Amount input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">$</span>
            </div>
            <input
              type="number"
              name="amount"
              value={safeFormData.amount || ''}
              onChange={handleInputChange}
              className="w-full pl-7 pr-16 py-3 text-lg font-medium border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
              placeholder="0.00"
              min={assetMinAmount}
              step={assetStep > 0.001 ? assetStep : "any"}
              max={assetBalance ? parseFloat(assetBalance).toString() : undefined}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm font-medium">{selectedAssetInfo?.symbol || 'Asset'}</span>
            </div>
          </div>
          
          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {quickAmounts.map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => setQuickAmount(amount)}
                disabled={assetBalance !== null && (parseFloat(assetBalance) === 0 || amount > parseFloat(assetBalance))}
                className="btn-secondary compact-button disabled:opacity-50"
              >
                ${amount}
              </button>
            ))}
          </div>
          
          {assetBalance !== null && parseFloat(assetBalance) >= assetMinAmount && (
  <button 
    type="button"
    onClick={setMaxAmount}
    className="btn-ghost text-xs mt-2 w-full"
  >
    Use max balance ({formatAssetAmount(assetBalance, selectedAssetInfo)} {selectedAssetInfo?.symbol || 'tokens'})
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
            
            {/* Always show Details button if algoAvailability is present */}
            {algoAvailability && (
              <button
                type="button"
                onClick={() => setShowBalanceDetails(!showBalanceDetails)}
                className="btn-ghost text-xs px-2 py-1"
              >
                {showBalanceDetails ? "Hide Details" : "Details"}
              </button>
            )}
          </div>
        )}
        
        {/* Collapsible balance details */}
        {showBalanceDetails && (
          <div className="card card-compact space-y-2 text-sm">
            <h4 className="font-medium text-gray-700">Balance Details</h4>
            
            {assetBalance !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">{selectedAssetInfo?.symbol || 'Asset'} Balance:</span>
                <span className="font-medium">
                {formatAssetAmount(assetBalance, selectedAssetInfo)} {selectedAssetInfo?.symbol || 'tokens'}
</span>
              </div>
            )}
            
            {algoAvailability && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">ALGO Available:</span>
                  <span className="font-medium">{algoAvailability.availableBalance} ALGO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ALGO Required (+ buffer):</span>
                  <span className="font-medium">{algoAvailability.requiredForTransaction} ALGO</span>
                </div>
                
                {algoAvailability.breakdown && (
                  <div className="pt-2 border-t border-gray-200 space-y-3">
                    {/* Recoverable Costs */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-green-600 flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Recoverable (via cleanup after claim):</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1 ml-4">
                        <div className="flex justify-between">
                          <span>• App reserve balance:</span>
                          <span>0.250000 ALGO</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• App contract funding:</span>
                          <span>0.210000 ALGO</span>
                        </div>
                        <div className="flex justify-between font-medium border-t border-gray-200 pt-1">
                          <span>Recoverable total:</span>
                          <span>0.460000 ALGO</span>
                        </div>
                      </div>
                    </div>

                    {/* Real Costs */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-red-600 flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>Real costs (not recoverable):</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1 ml-4">
                        <div className="flex justify-between">
                          <span>• Platform fee:</span>
                          <span>0.105000 ALGO</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Network transaction fees:</span>
                          <span>{algoAvailability.breakdown.realCosts?.transactionFees || '0.007000'} ALGO</span>
                        </div>
                        {safeFormData.payRecipientFees && (
                          <div className="flex justify-between">
                            <span>• Recipient fee coverage:</span>
                            <span>0.210000 ALGO</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium border-t border-gray-200 pt-1">
                          <span>Real cost total:</span>
                          <span>{algoAvailability.breakdown.realCosts?.total} ALGO</span>
                        </div>
                      </div>
                    </div>

                    {/* Help text */}
                    <div className="text-xs text-gray-400 bg-gray-50 rounded p-2">
                      💡 The recoverable amounts are temporarily locked but returned to you after you "cleanup" the App in your "Manage Links".
                    </div>
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
                checked={safeFormData.payRecipientFees || false}
                onChange={handleInputChange}
                name="payRecipientFees"
                className="w-4 h-4 text-purple-600 rounded"
                onClick={(e) => e.stopPropagation()}
              />
              <span>Cover Recipient Fees</span>
            </div>
            <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showAdvanced && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
              <p>Pay ~0.21 ALGO for opt-in & txn fees (refunded if already opted in).</p>
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
  disabled={!status || status.type !== 'success'}
  className="btn-primary flex-1 py-3 px-4 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
>
  Continue
</button>
        </div>
      </form>

      {/* Asset Selection Modal */}
      <AssetSelectionModal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        selectedAssetId={selectedAssetId}
        onAssetSelect={onAssetSelect}
      />
    </div>
  );
}

export default AmountStep;
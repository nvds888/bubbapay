import React, { useEffect } from 'react';

function ConfirmStep({
  formData,
  accountAddress,
  prevStep,
  isLoading,
  error,
  txnData,
  generateTransaction,
  handleSignFirstTransaction,
  handleSignGroupTransactions
}) {
  const [stage, setStage] = React.useState('initial'); // initial, app-created, funded
  
  // Update stage based on transaction data
  useEffect(() => {
    if (txnData) {
      if (txnData.appId) {
        setStage('app-created');
      }
    }
  }, [txnData]);
  
  // Format USDC amount with 2 decimal places
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };
  
  // Format Algorand address
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`;
  };
  
  const steps = [
    {
      number: 1,
      title: "Create Smart Contract",
      description: "Create the smart contract for this transfer",
      icon: "📄",
      active: stage === 'initial',
      completed: stage !== 'initial'
    },
    {
      number: 2,
      title: "Fund & Setup Transfer",
      description: "Fund the contract and set up the USDC transfer",
      icon: "💰",
      active: stage === 'app-created',
      completed: false
    }
  ];
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 mb-4 float">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white">Confirm & Send</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Review your transaction details and sign with your wallet to complete the transfer
        </p>
      </div>
      
      {/* Transaction summary */}
      <div className="glass-dark border border-purple-500/20 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Transaction Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Amount:</span>
            <span className="text-white font-semibold text-lg">{formatAmount(formData.amount)} USDC</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">From:</span>
            <span className="text-purple-300 font-mono text-sm">{formatAddress(accountAddress)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">To:</span>
            <span className="text-white font-medium">
              {formData.isShareableLink ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Shareable Link
                </span>
              ) : (
                formData.recipientEmail
              )}
            </span>
          </div>
          
          {formData.payRecipientFees && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Fee Coverage:</span>
              <span className="text-green-400 font-medium">0.4 ALGO</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Transaction steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Transaction Steps</h3>
        <p className="text-gray-400 text-sm">
          You'll need to sign two transactions with your Pera Wallet to complete this transfer:
        </p>
        
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`glass-dark border rounded-xl p-4 transition-all duration-300 ${
                step.active
                  ? 'border-purple-500/50 bg-purple-500/5'
                  : step.completed
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-gray-700'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    step.active
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : step.completed
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {step.completed ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                
                <div className="flex-1">
                  <div className={`font-medium ${step.active ? 'text-white' : step.completed ? 'text-green-300' : 'text-gray-400'}`}>
                    {step.title}
                  </div>
                  <div className={`text-sm ${step.active ? 'text-gray-300' : 'text-gray-500'}`}>
                    {step.description}
                  </div>
                </div>
                
                {step.active && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-purple-300 text-sm">Active</span>
                  </div>
                )}
                
                {step.completed && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-300 text-sm">Completed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="glass border border-red-500/20 bg-red-500/10 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-red-300 font-semibold">Transaction Error</h4>
              <p className="text-red-200 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={isLoading}
          className="btn-secondary flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
        >
          <span className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </span>
        </button>
        
        {stage === 'initial' && (
          <button
            type="button"
            onClick={handleSignFirstTransaction}
            disabled={isLoading}
            className="btn-primary flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden group disabled:opacity-70"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
            className="btn-primary flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden group disabled:opacity-70"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
    </div>
  );
}

export default ConfirmStep;
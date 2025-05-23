const algosdk = require('algosdk');

/**
 * Calculate comprehensive ALGO availability for escrow transactions
 * Based on real transaction data from the blockchain
 * @param {Object} accountInfo - Account information from algodClient.accountInformation()
 * @param {boolean} payRecipientFees - Whether the sender is paying recipient fees
 * @returns {Object} Availability analysis with detailed breakdown
 */
function calculateAlgoAvailability(accountInfo, payRecipientFees = false) {
  // REAL transaction costs based on actual blockchain data
  const TRANSACTION_COSTS = {
    // Phase 1: App Creation Transaction
    APP_CREATION_FEE: 1000,             // 0.001 ALGO - confirmed from blockchain
    
    // Phase 2: Group Transaction Fees (based on your actual txns)
    GROUP_TXN_1_FEE: 1000,              // 0.001 ALGO - Application Call
    GROUP_TXN_2_FEE: 2000,              // 0.002 ALGO - Application Call (with inner txn)
    GROUP_TXN_3_FEE: 1000,              // 0.001 ALGO - Application Call
    GROUP_TXN_4_FEE: 2000,              // 0.002 ALGO - Application Call (with inner txn)
    
    // ALGO Transfers (actual ALGO sent, not fees)
    TEMP_ACCOUNT_FUNDING: 102000,       // 0.102 ALGO - fund temp account
    CONTRACT_FUNDING: 300000,           // 0.3 ALGO - fund smart contract
    RECIPIENT_FEE_FUNDING: 400000,      // 0.4 ALGO - recipient fee coverage (if enabled)
  };
  
  // Calculate total fees
  const totalFees = TRANSACTION_COSTS.APP_CREATION_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_1_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_2_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_3_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_4_FEE;
  
  // Calculate total ALGO sent out
  const algoSentOut = TRANSACTION_COSTS.TEMP_ACCOUNT_FUNDING + 
                     TRANSACTION_COSTS.CONTRACT_FUNDING + 
                     (payRecipientFees ? TRANSACTION_COSTS.RECIPIENT_FEE_FUNDING : 0);
  
  // Total ALGO needed = fees + ALGO sent out
  const totalRequired = totalFees + algoSentOut;
  
  // Add 10% safety margin as requested
  const totalRequiredWithBuffer = Math.ceil(totalRequired * 1.10);
  
  // Current balance and minimum balance
  const currentBalance = accountInfo.amount; // in microALGO
  const currentMinBalance = accountInfo['min-balance'] || 0; // Use Algorand's reported min balance
  const currentAvailableBalance = Math.max(0, currentBalance - currentMinBalance);
  
  // Check if sufficient ALGO is available
  const hasSufficientAlgo = currentAvailableBalance >= totalRequiredWithBuffer;
  const shortfall = hasSufficientAlgo ? 0 : totalRequiredWithBuffer - currentAvailableBalance;
  
  // For group transactions, we need to check if we can complete after app creation
  // App creation doesn't change minimum balance significantly, so we use same available balance
  const canCompleteGroupTxns = hasSufficientAlgo; // Same condition for simplicity
  const groupTxnShortfall = canCompleteGroupTxns ? 0 : shortfall;
  
  return {
    address: accountInfo.address,
    currentBalance: microAlgoToAlgo(currentBalance),
    currentMinBalance: microAlgoToAlgo(currentMinBalance),
    availableBalance: microAlgoToAlgo(currentAvailableBalance),
    requiredForTransaction: microAlgoToAlgo(totalRequiredWithBuffer),
    hasSufficientAlgo,
    canCompleteGroupTxns,
    shortfall: microAlgoToAlgo(shortfall),
    groupTxnShortfall: microAlgoToAlgo(groupTxnShortfall),
    breakdown: {
      // Real transaction fees
      appCreationFee: microAlgoToAlgo(TRANSACTION_COSTS.APP_CREATION_FEE),
      groupTransactionFees: microAlgoToAlgo(totalFees - TRANSACTION_COSTS.APP_CREATION_FEE),
      totalFees: microAlgoToAlgo(totalFees),
      
      // ALGO transfers
      tempAccountFunding: microAlgoToAlgo(TRANSACTION_COSTS.TEMP_ACCOUNT_FUNDING),
      contractFunding: microAlgoToAlgo(TRANSACTION_COSTS.CONTRACT_FUNDING),
      recipientFunding: microAlgoToAlgo(payRecipientFees ? TRANSACTION_COSTS.RECIPIENT_FEE_FUNDING : 0),
      totalAlgoSent: microAlgoToAlgo(algoSentOut),
      
      // Summary
      totalRequired: microAlgoToAlgo(totalRequired),
      totalRequiredWithBuffer: microAlgoToAlgo(totalRequiredWithBuffer),
      safetyBufferPercentage: "10%"
    },
    debug: {
      payRecipientFees,
      currentBalanceMicroAlgo: currentBalance,
      minBalanceMicroAlgo: currentMinBalance,
      availableBalanceMicroAlgo: currentAvailableBalance,
      totalRequiredMicroAlgo: totalRequiredWithBuffer,
      feeBreakdown: {
        appCreation: TRANSACTION_COSTS.APP_CREATION_FEE,
        groupTxn1: TRANSACTION_COSTS.GROUP_TXN_1_FEE,
        groupTxn2: TRANSACTION_COSTS.GROUP_TXN_2_FEE,
        groupTxn3: TRANSACTION_COSTS.GROUP_TXN_3_FEE,
        groupTxn4: TRANSACTION_COSTS.GROUP_TXN_4_FEE,
        totalFees
      },
      algoTransfers: {
        tempAccount: TRANSACTION_COSTS.TEMP_ACCOUNT_FUNDING,
        contract: TRANSACTION_COSTS.CONTRACT_FUNDING,
        recipientFees: payRecipientFees ? TRANSACTION_COSTS.RECIPIENT_FEE_FUNDING : 0,
        totalSent: algoSentOut
      }
    }
  };
}

/**
 * Convert microALGO to ALGO with proper precision
 * @param {number} microAlgo - Amount in microALGO
 * @returns {string} Amount in ALGO with 6 decimal places
 */
function microAlgoToAlgo(microAlgo) {
  return (microAlgo / 1000000).toFixed(6);
}

/**
 * Validate if an address is a valid Algorand address
 * @param {string} address - Address to validate
 * @returns {boolean} Whether the address is valid
 */
function isValidAlgorandAddress(address) {
  try {
    algosdk.decodeAddress(address);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if user has sufficient ALGO for escrow transactions
 * Simplified and accurate based on real transaction costs
 * @param {Object} algodClient - Algorand client instance
 * @param {string} address - User's Algorand address
 * @param {boolean} payRecipientFees - Whether the sender is paying recipient fees
 * @returns {Promise<Object>} Detailed availability analysis
 */
async function checkAlgoAvailabilityForEscrow(algodClient, address, payRecipientFees = false) {
  // Validate address format
  if (!isValidAlgorandAddress(address)) {
    throw new Error('Invalid Algorand address format');
  }
  
  try {
    // Fetch account information
    const accountInfo = await algodClient.accountInformation(address).do();
    
    // Calculate availability with accurate costs
    const availability = calculateAlgoAvailability(accountInfo, payRecipientFees);
    
    // Summary for easy reference:
    // Without recipient fees: ~0.408 ALGO (0.006 fees + 0.402 transfers + 10% buffer)
    // With recipient fees: ~0.808 ALGO (0.006 fees + 0.802 transfers + 10% buffer)
    
    console.log(`ALGO availability check for ${address}:`, {
      payRecipientFees,
      required: availability.requiredForTransaction,
      available: availability.availableBalance,
      sufficient: availability.hasSufficientAlgo,
      shortfall: availability.shortfall
    });
    
    return availability;
  } catch (error) {
    console.error('Error fetching account information:', error);
    throw new Error(`Failed to check ALGO availability: ${error.message}`);
  }
}

/**
 * Get a quick summary of ALGO requirements for UI display
 * @param {boolean} payRecipientFees - Whether paying recipient fees
 * @returns {Object} Summary of requirements
 */
function getAlgoRequirementSummary(payRecipientFees = false) {
  const fees = 6000; // 0.006 ALGO total fees
  const baseTransfers = 402000; // 0.402 ALGO (temp + contract funding)
  const recipientFees = payRecipientFees ? 400000 : 0; // 0.4 ALGO if enabled
  
  const total = fees + baseTransfers + recipientFees;
  const withBuffer = Math.ceil(total * 1.10);
  
  return {
    fees: microAlgoToAlgo(fees),
    baseTransfers: microAlgoToAlgo(baseTransfers),
    recipientFees: microAlgoToAlgo(recipientFees),
    subtotal: microAlgoToAlgo(total),
    withBuffer: microAlgoToAlgo(withBuffer),
    description: payRecipientFees 
      ? "~0.808 ALGO (includes recipient fee coverage)"
      : "~0.408 ALGO (no recipient fee coverage)"
  };
}

module.exports = {
  calculateAlgoAvailability,
  microAlgoToAlgo,
  isValidAlgorandAddress,
  checkAlgoAvailabilityForEscrow,
  getAlgoRequirementSummary
};
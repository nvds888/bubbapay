const algosdk = require('algosdk');

/**
 * Calculate comprehensive ALGO availability for escrow transactions
 * Based on real transaction data from the blockchain with platform fee
 * @param {Object} accountInfo - Account information from algodClient.accountInformation()
 * @param {boolean} payRecipientFees - Whether the sender is paying recipient fees
 * @returns {Object} Availability analysis with detailed breakdown
 */
function calculateAlgoAvailability(accountInfo, payRecipientFees = false) {
  // REAL transaction costs based on actual blockchain data (updated with platform fee)
  const TRANSACTION_COSTS = {
    // Phase 1: App Creation Transaction
    APP_CREATION_FEE: 1000,             // 0.001 ALGO - confirmed from blockchain
    APP_CREATION_MIN_BALANCE: 100000,   // 0.1 ALGO - app creation increases min balance
    
    // Phase 2: Group Transaction Fees (aligned with atomic-deploy-email-escrow.js)
    GROUP_TXN_1_FEE: 1000,              // 0.001 ALGO - Payment (contract funding)
    GROUP_TXN_2_FEE: 1000,              // 0.001 ALGO - Payment (platform fee)
    GROUP_TXN_3_FEE: 1000,              // 0.001 ALGO - Payment (temp funding)
    GROUP_TXN_4_FEE: 2000,              // 0.002 ALGO - Application Call (opt-in with inner txn)
    GROUP_TXN_5_FEE: 1000,              // 0.001 ALGO - Application Call (set amount)
    GROUP_TXN_6_FEE: 1000,              // 0.001 ALGO - Asset Transfer (send USDC)
    
    // Optional recipient funding fee (if enabled)
    RECIPIENT_FUNDING_FEE: 1000,        // 0.001 ALGO - Payment (recipient fee funding)
    
    // ALGO Transfers (actual ALGO sent, not fees)
    TEMP_ACCOUNT_FUNDING: 102000,       // 0.102 ALGO - fund temp account
    CONTRACT_FUNDING: 200000,           // 0.2 ALGO - fund smart contract
    PLATFORM_FEE: 100000,               // 0.1 ALGO - platform fee
    RECIPIENT_FEE_FUNDING: 400000,      // 0.4 ALGO - recipient fee coverage (if enabled)
  };
  
  // Calculate total fees (including optional recipient funding fee)
  const baseFees = TRANSACTION_COSTS.APP_CREATION_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_1_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_2_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_3_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_4_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_5_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_6_FEE;
  
  const recipientFundingFee = payRecipientFees ? TRANSACTION_COSTS.RECIPIENT_FUNDING_FEE : 0;
  const totalFees = baseFees + recipientFundingFee;
  
  // Calculate total ALGO sent out
  const baseAlgoSentOut = TRANSACTION_COSTS.TEMP_ACCOUNT_FUNDING + 
                         TRANSACTION_COSTS.CONTRACT_FUNDING + 
                         TRANSACTION_COSTS.PLATFORM_FEE;
  
  const recipientFunding = payRecipientFees ? TRANSACTION_COSTS.RECIPIENT_FEE_FUNDING : 0;
  const totalAlgoSentOut = baseAlgoSentOut + recipientFunding;
  
  // CRITICAL: Account for app creation minimum balance increase
  const minBalanceIncrease = TRANSACTION_COSTS.APP_CREATION_MIN_BALANCE;
  
  // Total ALGO needed = fees + ALGO sent out + minimum balance increase
  const totalRequired = totalFees + totalAlgoSentOut + minBalanceIncrease;
  
  // Add 5% safety margin (reduced from 10% as the calculation is now more accurate)
  const totalRequiredWithBuffer = Math.ceil(totalRequired * 1.05);
  
  // Current balance and minimum balance
  const currentBalance = accountInfo.amount; // in microALGO
  const currentMinBalance = accountInfo['min-balance'] || 0;
  const currentAvailableBalance = Math.max(0, currentBalance - currentMinBalance);
  
  // Check if sufficient ALGO is available
  const hasSufficientAlgo = currentAvailableBalance >= totalRequiredWithBuffer;
  const shortfall = hasSufficientAlgo ? 0 : totalRequiredWithBuffer - currentAvailableBalance;
  
  // For group transactions, we need to check if we can complete after app creation
  // After app creation, minimum balance increases, so available balance decreases
  const balanceAfterAppCreation = Math.max(0, currentBalance - currentMinBalance - minBalanceIncrease);
  const groupTxnCost = totalFees - TRANSACTION_COSTS.APP_CREATION_FEE + totalAlgoSentOut;
  const groupTxnCostWithBuffer = Math.ceil(groupTxnCost * 1.05);
  
  const canCompleteGroupTxns = balanceAfterAppCreation >= groupTxnCostWithBuffer;
  const groupTxnShortfall = canCompleteGroupTxns ? 0 : groupTxnCostWithBuffer - balanceAfterAppCreation;
  
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
      appMinBalanceIncrease: microAlgoToAlgo(TRANSACTION_COSTS.APP_CREATION_MIN_BALANCE),
      groupTransactionFees: microAlgoToAlgo(totalFees - TRANSACTION_COSTS.APP_CREATION_FEE),
      totalFees: microAlgoToAlgo(totalFees),
      
      // ALGO transfers
      tempAccountFunding: microAlgoToAlgo(TRANSACTION_COSTS.TEMP_ACCOUNT_FUNDING),
      contractFunding: microAlgoToAlgo(TRANSACTION_COSTS.CONTRACT_FUNDING),
      platformFee: microAlgoToAlgo(TRANSACTION_COSTS.PLATFORM_FEE),
      recipientFunding: microAlgoToAlgo(payRecipientFees ? TRANSACTION_COSTS.RECIPIENT_FEE_FUNDING : 0),
      totalAlgoSent: microAlgoToAlgo(totalAlgoSentOut),
      
      // Summary
      totalRequired: microAlgoToAlgo(totalRequired),
      totalRequiredWithBuffer: microAlgoToAlgo(totalRequiredWithBuffer),
      safetyBufferPercentage: "5%"
    },
    debug: {
      payRecipientFees,
      currentBalanceMicroAlgo: currentBalance,
      minBalanceMicroAlgo: currentMinBalance,
      availableBalanceMicroAlgo: currentAvailableBalance,
      totalRequiredMicroAlgo: totalRequiredWithBuffer,
      balanceAfterAppCreation: balanceAfterAppCreation,
      groupTxnCostWithBuffer: groupTxnCostWithBuffer,
      feeBreakdown: {
        appCreation: TRANSACTION_COSTS.APP_CREATION_FEE,
        groupTxn1: TRANSACTION_COSTS.GROUP_TXN_1_FEE,
        groupTxn2: TRANSACTION_COSTS.GROUP_TXN_2_FEE,
        groupTxn3: TRANSACTION_COSTS.GROUP_TXN_3_FEE,
        groupTxn4: TRANSACTION_COSTS.GROUP_TXN_4_FEE,
        groupTxn5: TRANSACTION_COSTS.GROUP_TXN_5_FEE,
        groupTxn6: TRANSACTION_COSTS.GROUP_TXN_6_FEE,
        recipientFundingFee: recipientFundingFee,
        totalFees
      },
      algoTransfers: {
        tempAccount: TRANSACTION_COSTS.TEMP_ACCOUNT_FUNDING,
        contract: TRANSACTION_COSTS.CONTRACT_FUNDING,
        platformFee: TRANSACTION_COSTS.PLATFORM_FEE,
        recipientFees: payRecipientFees ? TRANSACTION_COSTS.RECIPIENT_FEE_FUNDING : 0,
        totalSent: totalAlgoSentOut
      },
      minBalanceChanges: {
        appCreationIncrease: TRANSACTION_COSTS.APP_CREATION_MIN_BALANCE
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
 * Accurate calculation including app creation minimum balance impact
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
    
    // Calculate availability with accurate costs including min balance changes
    const availability = calculateAlgoAvailability(accountInfo, payRecipientFees);
    
    // Summary for easy reference:
    // Without recipient fees: ~0.552 ALGO (0.008 fees + 0.402 transfers + 0.1 min balance + 5% buffer)
    // With recipient fees: ~0.953 ALGO (0.009 fees + 0.802 transfers + 0.1 min balance + 5% buffer)
    // Note: Now includes 0.1 ALGO app creation minimum balance increase
    
    console.log(`ALGO availability check for ${address}:`, {
      payRecipientFees,
      required: availability.requiredForTransaction,
      available: availability.availableBalance,
      sufficient: availability.hasSufficientAlgo,
      canCompleteGroup: availability.canCompleteGroupTxns,
      shortfall: availability.shortfall,
      groupShortfall: availability.groupTxnShortfall
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
  const baseFees = 7000; // 0.007 ALGO total fees (6 base transactions + app creation)
  const recipientFundingFee = payRecipientFees ? 1000 : 0; // 0.001 ALGO if enabled
  const totalFees = baseFees + recipientFundingFee;
  
  const baseTransfers = 402000; // 0.402 ALGO (temp: 0.102 + contract: 0.2 + platform: 0.1)
  const recipientFees = payRecipientFees ? 400000 : 0; // 0.4 ALGO if enabled
  const totalTransfers = baseTransfers + recipientFees;
  
  const minBalanceIncrease = 100000; // 0.1 ALGO for app creation
  
  const total = totalFees + totalTransfers + minBalanceIncrease;
  const withBuffer = Math.ceil(total * 1.05);
  
  return {
    fees: microAlgoToAlgo(totalFees),
    baseTransfers: microAlgoToAlgo(baseTransfers),
    platformFee: microAlgoToAlgo(100000), // 0.1 ALGO platform fee
    contractFunding: microAlgoToAlgo(200000), // 0.2 ALGO contract funding
    minBalanceIncrease: microAlgoToAlgo(minBalanceIncrease), // 0.1 ALGO app creation
    recipientFees: microAlgoToAlgo(recipientFees),
    subtotal: microAlgoToAlgo(total),
    withBuffer: microAlgoToAlgo(withBuffer),
    description: payRecipientFees 
      ? "~0.953 ALGO (includes recipient fees + platform fee + app min balance)"
      : "~0.552 ALGO (includes platform fee + app min balance, no recipient fees)"
  };
}

module.exports = {
  calculateAlgoAvailability,
  microAlgoToAlgo,
  isValidAlgorandAddress,
  checkAlgoAvailabilityForEscrow,
  getAlgoRequirementSummary
};
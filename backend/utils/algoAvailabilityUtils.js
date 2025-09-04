const algosdk = require('algosdk');

/**
 * Helper function to safely convert BigInt or number to regular number
 * @param {BigInt|number} value - Value to convert
 * @returns {number} Regular number
 */
function safeToNumber(value) {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return typeof value === 'number' ? value : 0;
}
/**
 * Calculate comprehensive ALGO availability for escrow transactions
 * More accurate calculation that simulates the exact final state
 * @param {Object} accountInfo - Account information from algodClient.accountInformation()
 * @param {boolean} payRecipientFees - Whether the sender is paying recipient fees
 * @returns {Object} Availability analysis with detailed breakdown
 */
function calculateAlgoAvailability(accountInfo, payRecipientFees = false) {
  // REAL transaction costs based on actual blockchain data
  const TRANSACTION_COSTS = {
    // Phase 1: App Creation Transaction
    APP_CREATION_FEE: 1000,             // 0.001 ALGO - transaction fee
    APP_CREATION_MIN_BALANCE: 250000,   // 0.25 ALGO - app creation increases min balance
    
    // Phase 2: Group Transaction Fees
    GROUP_TXN_1_FEE: 1000,              // 0.001 ALGO - Payment (contract funding)
    GROUP_TXN_2_FEE: 1000,              // 0.001 ALGO - Payment (temp funding)
    GROUP_TXN_3_FEE: 1000,              // 0.001 ALGO - Payment (recipient funding, if enabled)
    GROUP_TXN_4_FEE: 2000,              // 0.002 ALGO - Application Call (opt-in with inner txn)
    GROUP_TXN_5_FEE: 1000,              // 0.001 ALGO - Application Call (set amount)
    GROUP_TXN_6_FEE: 1000,              // 0.001 ALGO - Asset Transfer (send asset to app)
    
    INNER_TXN_MIN_BALANCE: 25000,
    
    // Optional recipient funding fee (if enabled)
    RECIPIENT_FUNDING_FEE: 1000,        // 0.001 ALGO - Payment (recipient fee funding)
    
   // ALGO Transfers (actual ALGO sent out, not fees)
TEMP_ACCOUNT_FUNDING: 105000,        // 0.105 ALGO - fund temp account
CONTRACT_FUNDING: 210000,           // 0.21 ALGO - fund smart contract
RECIPIENT_FEE_FUNDING: 210000,      // 0.21 ALGO - recipient fee coverage (if enabled)
  };
  
  // Calculate total fees for both phases
  const appCreationFee = TRANSACTION_COSTS.APP_CREATION_FEE;
  
  const groupFees = TRANSACTION_COSTS.GROUP_TXN_1_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_2_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_3_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_4_FEE + 
                   TRANSACTION_COSTS.GROUP_TXN_5_FEE +
                   TRANSACTION_COSTS.GROUP_TXN_6_FEE;
  
  const recipientFundingFee = payRecipientFees ? TRANSACTION_COSTS.RECIPIENT_FUNDING_FEE : 0;
  const totalFees = appCreationFee + groupFees + recipientFundingFee;
  
  // Calculate total ALGO sent out (only in group transactions)
  const baseAlgoSentOut = TRANSACTION_COSTS.TEMP_ACCOUNT_FUNDING + 
                         TRANSACTION_COSTS.CONTRACT_FUNDING;
  
  const recipientFunding = payRecipientFees ? TRANSACTION_COSTS.RECIPIENT_FEE_FUNDING : 0;
  const totalAlgoSentOut = baseAlgoSentOut + recipientFunding;
  
  // Current state
  const currentBalance = safeToNumber(accountInfo.amount); 
  const currentMinBalance = safeToNumber(accountInfo.minBalance || 0);
  const currentAvailableBalance = Math.max(0, currentBalance - currentMinBalance);
  
  // SIMULATION: Calculate final state after all transactions
  // 1. After app creation
  const balanceAfterAppCreation = currentBalance - appCreationFee;
  const minBalanceAfterAppCreation = currentMinBalance + TRANSACTION_COSTS.APP_CREATION_MIN_BALANCE;
  const availableAfterAppCreation = Math.max(0, balanceAfterAppCreation - minBalanceAfterAppCreation);
  
  // 2. After group transactions (fees + ALGO sent out)
  const groupTxnCost = groupFees + recipientFundingFee + totalAlgoSentOut;
  const finalBalance = balanceAfterAppCreation - groupTxnCost;
  const finalMinBalance = minBalanceAfterAppCreation; // Doesn't change during group txns
  const finalAvailableBalance = Math.max(0, finalBalance - finalMinBalance);
  
  // Check if we can complete each phase (EXACT calculations)
  const canCreateApp = currentAvailableBalance >= appCreationFee;
  const canCompleteGroupTxns = availableAfterAppCreation >= groupTxnCost;
  const finalBalancePositive = finalBalance >= finalMinBalance;
  
  // Calculate total required and add buffer
  const totalRequired = totalFees + totalAlgoSentOut + TRANSACTION_COSTS.APP_CREATION_MIN_BALANCE;
  const totalRequiredWithBuffer = Math.ceil(totalRequired * 1.05);
  
  // FIXED: Use buffered amount for hasSufficientAlgo to match UI display
  const hasSufficientAlgoExact = canCreateApp && canCompleteGroupTxns && finalBalancePositive;
  const hasSufficientAlgoWithBuffer = currentAvailableBalance >= totalRequiredWithBuffer;
  
  // Calculate shortfall based on buffered amount (for consistency)
  let shortfall = 0;
  if (!hasSufficientAlgoWithBuffer) {
    shortfall = totalRequiredWithBuffer - currentAvailableBalance;
  }
  
  return {
    address: accountInfo.address,
    currentBalance: microAlgoToAlgo(currentBalance),
    currentMinBalance: microAlgoToAlgo(currentMinBalance),
    availableBalance: microAlgoToAlgo(currentAvailableBalance),
    requiredForTransaction: microAlgoToAlgo(totalRequiredWithBuffer),
    // FIXED: Use buffered calculation to match what user sees
    hasSufficientAlgo: hasSufficientAlgoWithBuffer,
    canCompleteGroupTxns: hasSufficientAlgoWithBuffer, // Updated for consistency
    shortfall: microAlgoToAlgo(shortfall),
    groupTxnShortfall: microAlgoToAlgo(hasSufficientAlgoWithBuffer ? 0 : shortfall),
    breakdown: {
      // What you get back after cleanup
      recoverable: {
        appReserve: microAlgoToAlgo(TRANSACTION_COSTS.APP_CREATION_MIN_BALANCE),
        appFunding: microAlgoToAlgo(TRANSACTION_COSTS.CONTRACT_FUNDING),
        total: microAlgoToAlgo(TRANSACTION_COSTS.APP_CREATION_MIN_BALANCE + TRANSACTION_COSTS.CONTRACT_FUNDING)
      },
      
      // Real costs (not recoverable)
      realCosts: {
        platformFee: microAlgoToAlgo(TRANSACTION_COSTS.TEMP_ACCOUNT_FUNDING),
        transactionFees: microAlgoToAlgo(totalFees),
        recipientFees: microAlgoToAlgo(payRecipientFees ? TRANSACTION_COSTS.RECIPIENT_FEE_FUNDING : 0),
        total: microAlgoToAlgo(
          TRANSACTION_COSTS.TEMP_ACCOUNT_FUNDING + 
          totalFees + 
          (payRecipientFees ? TRANSACTION_COSTS.RECIPIENT_FEE_FUNDING : 0)
        )
      },
      
      // Summary
      totalRequired: microAlgoToAlgo(totalRequired),
      totalRequiredWithBuffer: microAlgoToAlgo(totalRequiredWithBuffer)
    },
    simulation: {
      // Current state
      currentBalance: microAlgoToAlgo(currentBalance),
      currentMinBalance: microAlgoToAlgo(currentMinBalance),
      currentAvailable: microAlgoToAlgo(currentAvailableBalance),
      
      // After app creation
      balanceAfterAppCreation: microAlgoToAlgo(balanceAfterAppCreation),
      minBalanceAfterAppCreation: microAlgoToAlgo(minBalanceAfterAppCreation),
      availableAfterAppCreation: microAlgoToAlgo(availableAfterAppCreation),
      
      // Final state
      finalBalance: microAlgoToAlgo(finalBalance),
      finalMinBalance: microAlgoToAlgo(finalMinBalance),
      finalAvailable: microAlgoToAlgo(finalAvailableBalance),
      
      // Checks (keep exact calculations for debugging)
      canCreateAppExact: canCreateApp,
      canCompleteGroupTxnsExact: canCompleteGroupTxns,
      finalBalancePositiveExact: finalBalancePositive,
      hasSufficientAlgoExact: hasSufficientAlgoExact,
      // New buffered checks
      hasSufficientAlgoWithBuffer: hasSufficientAlgoWithBuffer
    },
    debug: {
      payRecipientFees,
      groupTxnCost: microAlgoToAlgo(groupTxnCost),
      appCreationFee: microAlgoToAlgo(appCreationFee),
      totalAlgoSentOut: microAlgoToAlgo(totalAlgoSentOut),
      totalFees: microAlgoToAlgo(totalFees),
      totalRequired: microAlgoToAlgo(totalRequired),
      totalRequiredWithBuffer: microAlgoToAlgo(totalRequiredWithBuffer),
      shortfallReason: !hasSufficientAlgoWithBuffer ? 'insufficient_with_buffer' : 'none',
      bufferAmount: microAlgoToAlgo(totalRequiredWithBuffer - totalRequired)
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
 * Accurate simulation-based calculation
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

    // Calculate availability with accurate simulation
    const availability = calculateAlgoAvailability(accountInfo, payRecipientFees);
    
    console.log(`ALGO availability check for ${address}:`, {
      payRecipientFees,
      required: availability.requiredForTransaction,
      available: availability.availableBalance,
      sufficient: availability.hasSufficientAlgo,
      canCompleteGroup: availability.canCompleteGroupTxns,
      shortfall: availability.shortfall,
      shortfallReason: availability.debug.shortfallReason,
      simulation: availability.simulation
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
  
  const baseTransfers = 302000; // 0.302 ALGO (temp: 0.102 + contract: 0.2)
  const recipientFees = payRecipientFees ? 300000 : 0; // 0.3 ALGO if enabled
  const totalTransfers = baseTransfers + recipientFees;
  
  const minBalanceIncrease = 100000; // 0.1 ALGO for app creation
  
  const total = totalFees + totalTransfers + minBalanceIncrease;
  const withBuffer = Math.ceil(total * 1.10);
  
  return {
    fees: microAlgoToAlgo(totalFees),
    baseTransfers: microAlgoToAlgo(baseTransfers),
    contractFunding: microAlgoToAlgo(200000), // 0.2 ALGO contract funding
    minBalanceIncrease: microAlgoToAlgo(minBalanceIncrease), // 0.1 ALGO app creation
    recipientFees: microAlgoToAlgo(recipientFees),
    subtotal: microAlgoToAlgo(total),
    withBuffer: microAlgoToAlgo(withBuffer),
    description: payRecipientFees 
      ? "~0.4 ALGO (includes recipient fees + app min balance + 10% buffer)"
      : "~0.25 ALGO (includes app min balance + 10% buffer, no recipient fees)"
  };
}

module.exports = {
  calculateAlgoAvailability,
  microAlgoToAlgo,
  isValidAlgorandAddress,
  checkAlgoAvailabilityForEscrow,
  getAlgoRequirementSummary
};
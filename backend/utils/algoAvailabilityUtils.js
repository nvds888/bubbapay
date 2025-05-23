const algosdk = require('algosdk');

/**
 * Calculate comprehensive ALGO availability for escrow transactions
 * Includes ALL Algorand minimum balance requirements
 * @param {Object} accountInfo - Account information from algodClient.accountInformation()
 * @param {boolean} payRecipientFees - Whether the sender is paying recipient fees
 * @returns {Object} Availability analysis with detailed breakdown
 */
function calculateAlgoAvailability(accountInfo, payRecipientFees = false) {
  // Algorand minimum balance requirements (in microALGO)
  const CONSTANTS = {
    // Base requirements
    BASE_MIN_BALANCE: 100000,           // 0.1 ALGO base minimum
    ASSET_OPT_IN_COST: 100000,          // 0.1 ALGO per asset opt-in
    ASSET_CREATED_COST: 100000,         // 0.1 ALGO per asset created
    APP_CREATED_COST: 100000,           // 0.1 ALGO per app created (base)
    APP_OPTED_IN_COST: 100000,          // 0.1 ALGO per app opted into (base)
    EXTRA_PAGE_COST: 100000,            // 0.1 ALGO per extra page
    
    // State storage costs
    STATE_ENTRY_COST: 25000,            // 0.025 ALGO per state entry
    INTEGER_ENTRY_COST: 3500,           // 0.0035 ALGO per integer entry
    BYTE_SLICE_ENTRY_COST: 25000,       // 0.025 ALGO per byte slice entry
    
    // Box storage costs (if any)
    BOX_CREATED_COST: 2500,             // 0.0025 ALGO per box
    BOX_BYTE_COST: 400,                 // 0.0004 ALGO per byte in boxes
    
    // Transaction fees for our escrow process
    APP_CREATION_FEE: 1000,             // 0.001 ALGO for app creation
    APP_FUNDING: 300000,                // 0.3 ALGO to fund the contract
    RECIPIENT_FUNDING: 400000,          // 0.4 ALGO if paying recipient fees
    STANDARD_TXN_FEE: 1000,             // 0.001 ALGO standard transaction fee
    INNER_TXN_FEE: 2000,                // 0.002 ALGO for transactions with inner txns
    
    // Our smart contract requirements
    ESTIMATED_EXTRA_PAGES: 2,           // Our smart contract needs ~2 extra pages
    OUR_APP_GLOBAL_INTS: 2,             // Our app uses 2 global integers
    OUR_APP_GLOBAL_BYTES: 2,            // Our app uses 2 global byte slices
  };
  
  // Calculate comprehensive minimum balance
  const minBalanceBreakdown = calculateComprehensiveMinBalance(accountInfo, CONSTANTS);
  
  // Calculate our new app's minimum balance contribution
  const newAppMinBalance = calculateNewAppMinBalance(CONSTANTS);
  
  // Calculate transaction costs for the escrow process
  const transactionCosts = calculateTransactionCosts(payRecipientFees, CONSTANTS);
  
  // Calculate what happens during the transaction flow:
  // 1. After app creation: minimum balance increases by newAppMinBalance
  // 2. During group txns: we send out ALGO (funding + recipient funding)
  const algoSentOut = transactionCosts.appFunding + transactionCosts.recipientFunding;
  const totalFees = transactionCosts.appCreation + transactionCosts.groupFees;
  
  // Total ALGO needed = fees + ALGO sent out + new minimum balance increase
  const totalRequired = totalFees + algoSentOut + newAppMinBalance;
  
  // Add a 5% safety buffer to account for network variations
  const totalRequiredWithBuffer = Math.ceil(totalRequired * 1.05);
  
  // Current balance and available balance
  const currentBalance = accountInfo.amount; // in microALGO
  const currentAvailableBalance = currentBalance - minBalanceBreakdown.total;
  
  // CRITICAL: Account for the sequence of events
  // After app creation, available balance = current available - new app min balance
  // Then we need to have enough for: ALGO sent out + fees
  const availableAfterAppCreation = currentAvailableBalance - newAppMinBalance;
  const neededForGroupTxns = algoSentOut + transactionCosts.groupFees;
  
  // Check if sufficient ALGO is available for the entire flow
  const hasSufficientAlgo = currentAvailableBalance >= totalRequiredWithBuffer;
  const shortfall = hasSufficientAlgo ? 0 : totalRequiredWithBuffer - currentAvailableBalance;
  
  // Additional check: can we complete group transactions after app creation?
  const canCompleteGroupTxns = availableAfterAppCreation >= neededForGroupTxns;
  const groupTxnShortfall = canCompleteGroupTxns ? 0 : neededForGroupTxns - availableAfterAppCreation;
  
  return {
    address: accountInfo.address,
    currentBalance: microAlgoToAlgo(currentBalance),
    currentMinBalance: microAlgoToAlgo(minBalanceBreakdown.total),
    availableBalance: microAlgoToAlgo(currentAvailableBalance),
    availableAfterAppCreation: microAlgoToAlgo(availableAfterAppCreation),
    requiredForTransaction: microAlgoToAlgo(totalRequiredWithBuffer),
    hasSufficientAlgo,
    canCompleteGroupTxns,
    shortfall: microAlgoToAlgo(shortfall),
    groupTxnShortfall: microAlgoToAlgo(groupTxnShortfall),
    breakdown: {
      // Transaction costs breakdown
      appCreationFee: microAlgoToAlgo(transactionCosts.appCreation),
      appFunding: microAlgoToAlgo(transactionCosts.appFunding),
      recipientFunding: microAlgoToAlgo(transactionCosts.recipientFunding),
      groupTransactionFees: microAlgoToAlgo(transactionCosts.groupFees),
      newAppMinBalance: microAlgoToAlgo(newAppMinBalance),
      // Flow breakdown
      algoSentOut: microAlgoToAlgo(algoSentOut),
      totalFees: microAlgoToAlgo(totalFees),
      neededForGroupTxns: microAlgoToAlgo(neededForGroupTxns),
      // Totals
      totalTransactionCosts: microAlgoToAlgo(transactionCosts.total),
      totalRequired: microAlgoToAlgo(totalRequired),
      totalRequiredWithBuffer: microAlgoToAlgo(totalRequiredWithBuffer),
      safetyBufferPercentage: "5%"
    },
    minBalanceBreakdown: {
      base: microAlgoToAlgo(minBalanceBreakdown.base),
      assets: microAlgoToAlgo(minBalanceBreakdown.assets),
      createdAssets: microAlgoToAlgo(minBalanceBreakdown.createdAssets),
      apps: microAlgoToAlgo(minBalanceBreakdown.apps),
      createdApps: microAlgoToAlgo(minBalanceBreakdown.createdApps),
      extraPages: microAlgoToAlgo(minBalanceBreakdown.extraPages),
      globalState: microAlgoToAlgo(minBalanceBreakdown.globalState),
      localState: microAlgoToAlgo(minBalanceBreakdown.localState),
      boxes: microAlgoToAlgo(minBalanceBreakdown.boxes),
      total: microAlgoToAlgo(minBalanceBreakdown.total)
    },
    accountInfo: {
      assetsOptedIn: minBalanceBreakdown.counts.assetsOptedIn,
      assetsCreated: minBalanceBreakdown.counts.assetsCreated,
      appsOptedIn: minBalanceBreakdown.counts.appsOptedIn,
      appsCreated: minBalanceBreakdown.counts.appsCreated,
      totalExtraPages: minBalanceBreakdown.counts.totalExtraPages,
      totalGlobalInts: minBalanceBreakdown.counts.totalGlobalInts,
      totalGlobalBytes: minBalanceBreakdown.counts.totalGlobalBytes,
      totalLocalStateEntries: minBalanceBreakdown.counts.totalLocalStateEntries
    },
    debug: {
      currentBalanceMicroAlgo: currentBalance,
      minBalanceMicroAlgo: minBalanceBreakdown.total,
      availableBalanceMicroAlgo: currentAvailableBalance,
      availableAfterAppCreationMicroAlgo: availableAfterAppCreation,
      totalRequiredMicroAlgo: totalRequiredWithBuffer,
      neededForGroupTxnsMicroAlgo: neededForGroupTxns,
      rawAccountInfo: {
        amount: accountInfo.amount,
        minBalance: accountInfo['min-balance'],
        assets: (accountInfo.assets || []).length,
        createdAssets: (accountInfo['created-assets'] || []).length,
        appsLocalState: (accountInfo['apps-local-state'] || []).length,
        createdApps: (accountInfo['created-apps'] || []).length
      }
    }
  };
}

/**
 * Calculate comprehensive minimum balance including all Algorand requirements
 * @param {Object} accountInfo - Account information
 * @param {Object} CONSTANTS - Cost constants
 * @returns {Object} Detailed minimum balance breakdown
 */
function calculateComprehensiveMinBalance(accountInfo, CONSTANTS) {
  // Base minimum balance
  const base = CONSTANTS.BASE_MIN_BALANCE;
  
  // Assets opted into
  const assetsOptedIn = (accountInfo.assets || []).length;
  const assets = assetsOptedIn * CONSTANTS.ASSET_OPT_IN_COST;
  
  // Assets created
  const assetsCreatedCount = (accountInfo['created-assets'] || []).length;
  const createdAssets = assetsCreatedCount * CONSTANTS.ASSET_CREATED_COST;
  
  // Apps opted into (base cost)
  const appsOptedInCount = (accountInfo['apps-local-state'] || []).length;
  const apps = appsOptedInCount * CONSTANTS.APP_OPTED_IN_COST;
  
  // Apps created (base cost + state costs + extra pages)
  const createdAppsData = calculateCreatedAppsMinBalance(accountInfo, CONSTANTS);
  
  // Local state storage costs
  const localStateData = calculateLocalStateMinBalance(accountInfo, CONSTANTS);
  
  // Box storage costs (if any - this requires additional API calls to get box data)
  const boxes = 0; // TODO: Implement box cost calculation if needed
  
  const total = base + assets + createdAssets + apps + createdAppsData.total + localStateData.total + boxes;
  
  return {
    base,
    assets,
    createdAssets,
    apps,
    createdApps: createdAppsData.total,
    extraPages: createdAppsData.extraPages,
    globalState: createdAppsData.globalState,
    localState: localStateData.total,
    boxes,
    total,
    counts: {
      assetsOptedIn,
      assetsCreated: assetsCreatedCount,
      appsOptedIn: appsOptedInCount,
      appsCreated: createdAppsData.count,
      totalExtraPages: createdAppsData.extraPagesCount,
      totalGlobalInts: createdAppsData.globalInts,
      totalGlobalBytes: createdAppsData.globalBytes,
      totalLocalStateEntries: localStateData.totalEntries
    }
  };
}

/**
 * Calculate minimum balance for created apps including state and extra pages
 * @param {Object} accountInfo - Account information
 * @param {Object} CONSTANTS - Cost constants
 * @returns {Object} Created apps minimum balance breakdown
 */
function calculateCreatedAppsMinBalance(accountInfo, CONSTANTS) {
  const createdApps = accountInfo['created-apps'] || [];
  
  let baseCost = 0;
  let extraPagesCost = 0;
  let globalStateCost = 0;
  let totalExtraPages = 0;
  let totalGlobalInts = 0;
  let totalGlobalBytes = 0;
  
  for (const app of createdApps) {
    // Base cost per app
    baseCost += CONSTANTS.APP_CREATED_COST;
    
    // Extra pages cost
    const extraPages = Math.max(0, (app.params?.['extra-program-pages'] || 0));
    extraPagesCost += extraPages * CONSTANTS.EXTRA_PAGE_COST;
    totalExtraPages += extraPages;
    
    // Global state schema costs
    const globalSchema = app.params?.['global-state-schema'] || {};
    const globalInts = globalSchema['num-uint'] || 0;
    const globalBytes = globalSchema['num-byte-slice'] || 0;
    
    // Cost for global state entries
    globalStateCost += globalInts * (CONSTANTS.STATE_ENTRY_COST + CONSTANTS.INTEGER_ENTRY_COST);
    globalStateCost += globalBytes * (CONSTANTS.STATE_ENTRY_COST + CONSTANTS.BYTE_SLICE_ENTRY_COST);
    
    totalGlobalInts += globalInts;
    totalGlobalBytes += globalBytes;
  }
  
  return {
    count: createdApps.length,
    baseCost,
    extraPages: extraPagesCost,
    extraPagesCount: totalExtraPages,
    globalState: globalStateCost,
    globalInts: totalGlobalInts,
    globalBytes: totalGlobalBytes,
    total: baseCost + extraPagesCost + globalStateCost
  };
}

/**
 * Calculate minimum balance for local state storage
 * @param {Object} accountInfo - Account information
 * @param {Object} CONSTANTS - Cost constants
 * @returns {Object} Local state minimum balance breakdown
 */
function calculateLocalStateMinBalance(accountInfo, CONSTANTS) {
  const appsLocalState = accountInfo['apps-local-state'] || [];
  
  let totalCost = 0;
  let totalEntries = 0;
  
  for (const appState of appsLocalState) {
    const keyValue = appState['key-value'] || {};
    
    // Count local state entries
    for (const [key, value] of Object.entries(keyValue)) {
      totalEntries++;
      
      // Cost depends on value type
      if (value.type === 1) { // bytes
        totalCost += CONSTANTS.STATE_ENTRY_COST + CONSTANTS.BYTE_SLICE_ENTRY_COST;
      } else if (value.type === 2) { // uint
        totalCost += CONSTANTS.STATE_ENTRY_COST + CONSTANTS.INTEGER_ENTRY_COST;
      }
    }
  }
  
  return {
    total: totalCost,
    totalEntries
  };
}

/**
 * Calculate minimum balance increase for our new app
 * @param {Object} CONSTANTS - Cost constants
 * @returns {number} Minimum balance increase in microALGO
 */
function calculateNewAppMinBalance(CONSTANTS) {
  const baseCost = CONSTANTS.APP_CREATED_COST;
  const extraPagesCost = CONSTANTS.ESTIMATED_EXTRA_PAGES * CONSTANTS.EXTRA_PAGE_COST;
  
  // Our app's global state costs
  const globalIntsCost = CONSTANTS.OUR_APP_GLOBAL_INTS * (CONSTANTS.STATE_ENTRY_COST + CONSTANTS.INTEGER_ENTRY_COST);
  const globalBytesCost = CONSTANTS.OUR_APP_GLOBAL_BYTES * (CONSTANTS.STATE_ENTRY_COST + CONSTANTS.BYTE_SLICE_ENTRY_COST);
  
  return baseCost + extraPagesCost + globalIntsCost + globalBytesCost;
}

/**
 * Calculate the total transaction costs for the escrow process
 * @param {boolean} payRecipientFees - Whether paying recipient fees
 * @param {Object} CONSTANTS - Cost constants
 * @returns {Object} Breakdown of transaction costs
 */
function calculateTransactionCosts(payRecipientFees, CONSTANTS) {
  // App creation transaction
  const appCreation = CONSTANTS.APP_CREATION_FEE;
  
  // App funding (sent to the smart contract)
  const appFunding = CONSTANTS.APP_FUNDING;
  
  // Recipient funding (if enabled)
  const recipientFunding = payRecipientFees ? CONSTANTS.RECIPIENT_FUNDING : 0;
  
  // Group transaction fees (corrected based on actual transaction structure):
  // 1. Funding transaction: 1000 microALGO
  // 2. Recipient funding (if enabled): 1000 microALGO  
  // 3. Opt-in transaction (with inner txn): 2000 microALGO
  // 4. Set amount transaction: 1000 microALGO
  // 5. Send USDC transaction: 1000 microALGO
  const groupFees = CONSTANTS.STANDARD_TXN_FEE + // funding
                   (payRecipientFees ? CONSTANTS.STANDARD_TXN_FEE : 0) + // recipient funding
                   CONSTANTS.INNER_TXN_FEE + // opt-in with inner txn
                   CONSTANTS.STANDARD_TXN_FEE + // set amount
                   CONSTANTS.STANDARD_TXN_FEE; // send USDC
  
  // Total: 5000 microALGO without recipient fees, 6000 microALGO with recipient fees
  
  const total = appCreation + appFunding + recipientFunding + groupFees;
  
  return {
    appCreation,
    appFunding,
    recipientFunding,
    groupFees,
    total
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
 * Check if user has sufficient ALGO for both transactions in the escrow process
 * This function provides a comprehensive analysis suitable for UI display
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
    
    // Calculate availability with comprehensive minimum balance
    const availability = calculateAlgoAvailability(accountInfo, payRecipientFees);
    
    // Log for debugging
    console.log(`Comprehensive ALGO check for ${address}:`, {
      reported: {
        balance: availability.currentBalance,
        minBalance: availability.currentMinBalance,
        available: availability.availableBalance
      },
      algorandReported: {
        balance: microAlgoToAlgo(accountInfo.amount),
        minBalance: microAlgoToAlgo(accountInfo['min-balance'] || 0)
      },
      difference: {
        minBalanceDiff: microAlgoToAlgo((accountInfo['min-balance'] || 0) - parseInt(availability.currentMinBalance * 1000000))
      }
    });
    
    return availability;
  } catch (error) {
    console.error('Error fetching account information:', error);
    throw new Error(`Failed to check ALGO availability: ${error.message}`);
  }
}

module.exports = {
  calculateAlgoAvailability,
  calculateComprehensiveMinBalance,
  calculateTransactionCosts,
  microAlgoToAlgo,
  isValidAlgorandAddress,
  checkAlgoAvailabilityForEscrow
};
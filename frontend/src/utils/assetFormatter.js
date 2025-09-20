// src/utils/assetFormatter.js

/**
 * Format asset amount for display based on asset properties
 * Uses minAmount to determine precision 
 * @param {number|string} amount - The amount to format
 * @param {object} assetInfo - Asset info with minAmount, decimals, symbol
 * @returns {string} Formatted amount
 */
export function formatAssetAmount(amount, assetInfo) {
  if (!amount || !assetInfo) return '0';
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return '0';
  
  const { minAmount = 0.01, decimals = 6 } = assetInfo;
  
  // Use minAmount to determine precision 
  if (minAmount < 0.01) {
    // High precision assets (like goBTC) - show full precision without trailing zeros
    return numAmount.toFixed(decimals).replace(/\.?0+$/, '');
  } else {
    // Standard assets (like USDC, TINY, etc.) - show 2 decimals
    return numAmount.toFixed(2);
  }
}

/**
* Format asset amount with symbol for display
* @param {number|string} amount - The amount to format
* @param {object} assetInfo - Asset info with minAmount, decimals, symbol
* @returns {string} Formatted amount with symbol
*/
export function formatAssetAmountWithSymbol(amount, assetInfo) {
  const formattedAmount = formatAssetAmount(amount, assetInfo);
  const symbol = assetInfo?.symbol || 'tokens';
  return `${formattedAmount} ${symbol}`;
}

// ===== NEW VALIDATION HELPERS =====

/**
* Validate if amount meets minimum requirement
* @param {string|number} amount - Amount to validate
* @param {object} assetInfo - Asset info with minAmount
* @returns {object} { isValid: boolean, error?: string }
*/
export function validateMinimumAmount(amount, assetInfo) {
  if (!amount || !assetInfo) {
      return { isValid: false, error: 'Please enter a valid amount greater than 0' };
  }
  
  const numAmount = parseFloat(amount);
  const minAmount = assetInfo.minAmount || 0.01;
  const symbol = assetInfo.symbol || 'tokens';
  
  if (isNaN(numAmount) || numAmount <= 0) {
      return { isValid: false, error: 'Please enter a valid amount greater than 0' };
  }
  
  if (numAmount < minAmount) {
      return { isValid: false, error: `Minimum amount is ${minAmount} ${symbol}` };
  }
  
  return { isValid: true };
}

/**
* Validate if amount is within available balance
* NOTE: maxSendableBalance should come from backend API (already calculated correctly)
* @param {string|number} amount - Amount to validate
* @param {string|number} maxSendableBalance - Max sendable balance from backend
* @param {object} assetInfo - Asset info for formatting
* @returns {object} { isValid: boolean, error?: string }
*/
export function validateSufficientBalance(amount, maxSendableBalance, assetInfo) {
  if (!amount || maxSendableBalance === null || maxSendableBalance === undefined) {
      return { isValid: true }; // Can't validate without required data
  }
  
  const numAmount = parseFloat(amount);
  const maxBalance = parseFloat(maxSendableBalance);
  const symbol = assetInfo?.symbol || 'tokens';
  
  if (isNaN(numAmount)) {
      return { isValid: true }; // Let other validators handle invalid numbers
  }
  
  if (maxBalance === 0) {
      return { isValid: false, error: `Insufficient ${symbol} balance` };
  }
  
  if (numAmount > maxBalance) {
      const formattedMax = formatAssetAmount(maxSendableBalance, assetInfo);
      return { isValid: false, error: `Amount exceeds your sendable balance of ${formattedMax} ${symbol}` };
  }
  
  return { isValid: true };
}

/**
* Check if user has sufficient balance for any transaction
* @param {string|number} maxSendableBalance - Max sendable balance from backend
* @param {object} assetInfo - Asset info
* @returns {boolean} True if user can send at least minimum amount
*/
export function canSendAnyAmount(maxSendableBalance, assetInfo) {
  if (!assetInfo || maxSendableBalance === null || maxSendableBalance === undefined) {
      return false;
  }
  
  const maxBalance = parseFloat(maxSendableBalance);
  const minAmount = assetInfo.minAmount || 0.01;
  
  return maxBalance >= minAmount;
}

/**
* Get the maximum amount user can send (direct passthrough from backend)
* @param {string|number} maxSendableBalance - Already calculated by backend
* @returns {string} Max sendable amount as string
*/
export function getMaxSendableAmount(maxSendableBalance) {
  if (maxSendableBalance === null || maxSendableBalance === undefined) {
      return '0';
  }
  
  const maxBalance = parseFloat(maxSendableBalance);
  return maxBalance > 0 ? maxBalance.toString() : '0';
}

/**
* Comprehensive amount validation
* @param {string|number} amount - Amount to validate
* @param {string|number} maxSendableBalance - Max sendable balance from backend
* @param {object} assetInfo - Asset info
* @returns {object} { isValid: boolean, error?: string }
*/
export function validateAmount(amount, maxSendableBalance, assetInfo) {
  // Check minimum amount first
  const minValidation = validateMinimumAmount(amount, assetInfo);
  if (!minValidation.isValid) {
      return minValidation;
  }
  
  // Check sufficient balance
  const balanceValidation = validateSufficientBalance(amount, maxSendableBalance, assetInfo);
  if (!balanceValidation.isValid) {
      return balanceValidation;
  }
  
  return { isValid: true };
}
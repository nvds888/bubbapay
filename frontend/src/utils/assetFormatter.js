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
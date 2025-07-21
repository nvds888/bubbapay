// assetConfig.js - Simple Asset Configuration

// Supported assets for testnet
const SUPPORTED_ASSETS = {
    10458941: {
      id: 10458941,
      name: 'USDC',
      unitName: 'USDC',
      decimals: 6,
      symbol: 'USDC',
      isDefault: true,
      description: 'USD Coin'
    },
    31566704: {
      id: 31566704,
      name: 'Tether USDt',
      unitName: 'USDt', 
      decimals: 6,
      symbol: 'USDT',
      isDefault: false,
      description: 'Tether USD'
    }
    // Add more assets here as needed
  };
  
  // Get default asset ID (USDC)
  function getDefaultAssetId() {
    const defaultAsset = Object.values(SUPPORTED_ASSETS).find(asset => asset.isDefault);
    return defaultAsset ? defaultAsset.id : 10458941;
  }
  
  // Get asset info
  function getAssetInfo(assetId) {
    return SUPPORTED_ASSETS[parseInt(assetId)] || null;
  }
  
  // Check if asset is supported
  function isAssetSupported(assetId) {
    return SUPPORTED_ASSETS.hasOwnProperty(parseInt(assetId));
  }
  
  // Get all supported assets
  function getSupportedAssets() {
    return Object.values(SUPPORTED_ASSETS);
  }
  
  // Convert amount to micro units
  function toMicroUnits(amount, assetId) {
    const asset = getAssetInfo(assetId);
    const decimals = asset ? asset.decimals : 6;
    return Math.floor(amount * Math.pow(10, decimals));
  }
  
  // Convert from micro units
  function fromMicroUnits(microAmount, assetId) {
    const asset = getAssetInfo(assetId);
    const decimals = asset ? asset.decimals : 6;
    return microAmount / Math.pow(10, decimals);
  }
  
  module.exports = {
    SUPPORTED_ASSETS,
    getDefaultAssetId,
    getAssetInfo,
    isAssetSupported,
    getSupportedAssets,
    toMicroUnits,
    fromMicroUnits,
    // For backwards compatibility
    USDC_ASSET_ID: getDefaultAssetId()
  };
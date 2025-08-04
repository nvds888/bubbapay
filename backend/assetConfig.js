// assetConfig.js - Simple Asset Configuration

const SUPPORTED_ASSETS = {
    31566704: {
      id: 31566704,
      name: 'USDC',
      unitName: 'USDC',
      decimals: 6,
      symbol: 'USDC',
      isDefault: true,
      description: 'USD Coin'
    },
    760037151: {
      id: 760037151,
      name: 'xUSD',
      unitName: 'xUSD', 
      decimals: 6,
      symbol: 'xUSD',
      isDefault: false,
      description: 'xUSD'
    },
    // NEW: Add Monko
    2494786278: {
      id: 2494786278,
      name: 'Monko',
      unitName: 'MONKO',
      decimals: 6,
      symbol: 'MONKO',
      isDefault: false,
      description: 'Be Monko'
    },
    // NEW: Add Alpha
    2726252423: {
      id: 2726252423,
      name: 'Alpha',
      unitName: 'ALPHA',
      decimals: 6,
      symbol: 'ALPHA',
      isDefault: false,
      description: 'Alpha Arcade'
    }
    // Add more assets here as needed
  };
  
  // Get default asset ID (USDC)
  function getDefaultAssetId() {
    const defaultAsset = Object.values(SUPPORTED_ASSETS).find(asset => asset.isDefault);
    return defaultAsset ? defaultAsset.id : 31566704; // Mainnet USDC
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
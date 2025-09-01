// assetConfig.js 

const SUPPORTED_ASSETS = {
    31566704: {
      id: 31566704,
      name: 'USDC',
      unitName: 'USDC',
      decimals: 6,
      symbol: 'USDC',
      isDefault: true,
      description: 'USDC is a stablecoin by Circle' 
    },
    760037151: {
      id: 760037151,
      name: 'xUSD',
      unitName: 'xUSD', 
      decimals: 6,
      symbol: 'xUSD',
      isDefault: false,
      description: 'xUSD is a stablecoin by CompX'
    },
    2494786278: {
      id: 2494786278,
      name: 'Monko',
      unitName: 'MONKO',
      decimals: 6,
      symbol: 'MONKO',
      isDefault: false,
      description: 'Be Monko meme token'
    },
    2726252423: {
      id: 2726252423,
      name: 'Alpha',
      unitName: 'ALPHA',
      decimals: 6,
      symbol: 'ALPHA',
      isDefault: false,
      description: 'Alpha Arcade prediction market token'
    },
    523683256: {
      id: 523683256,
      name: 'Akita Inu',
      unitName: 'AKITA',
      symbol: 'Akita',
      decimals: 6,
      isDefault: false,
      description: 'Akita Inu is an og Algorand meme token'
    },
    2656692124: {
      id: 2656692124,
      name: 'BallSack',
      unitName: 'BALLSACK',
      symbol: 'BallSack',
      decimals: 6,
      isDefault: false,
      description: 'BallSack is a meme token'
    },
    386192725: {
      id: 386192725,
      name: 'goBTC',
      unitName: 'goBTC',
      symbol: 'goBTC',
      decimals: 6,
      isDefault: false,
      description: 'BTC on Algorand by Algomint'
    },
    3160000000: {
      id: 3160000000,
      name: 'Haystack',
      unitName: 'HAY',
      symbol: 'HAY',
      decimals: 6,
      isDefault: false,
      description: 'The token of Haystack: Trading made easy'
    },
    2582294183: {
      id: 2582294183,
      name: 'GONNA',
      unitName: 'GONNA',
      symbol: 'GONNA',
      decimals: 6,
      isDefault: false,
      description: 'The official coin of the Gonnaverse'
    },
    1284444444: {
      id: 1284444444,
      name: 'Orange',
      unitName: 'ORA',
      symbol: 'ORA',
      decimals: 8,
      isDefault: false,
      description: 'Orange is a "mineable" meme'
    },
    2582590415: {
      id: 2582590415,
      name: 'Meep',
      unitName: 'MEEP',
      symbol: 'Meep',
      decimals: 6,
      isDefault: false,
      description: 'A meme coin created by Shep NFT&apos;s GaryJules'
    }
    // more assets here 
  };
  
  // default asset ID (USDC)
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
    // For fallback
    USDC_ASSET_ID: getDefaultAssetId()
  };
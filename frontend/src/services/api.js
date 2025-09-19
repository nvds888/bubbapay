import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';


const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Transaction APIs
export const generateTransactions = async (data) => {
  try {
    const payload = {
      ...data,
      assetId: data.assetId || DEFAULT_ASSET_ID
    };
    const response = await apiClient.post('/generate-transactions', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to generate transaction';
  }
};

export const submitAppCreation = async (data) => {
  try {
    // default assetId if not provided
    const payload = {
      ...data,
      assetId: data.assetId || DEFAULT_ASSET_ID
    };
    const response = await apiClient.post('/submit-app-creation', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to submit app creation transaction';
  }
};

export const submitGroupTransactions = async (data) => {
  try {
    const payload = {
      ...data,
      assetId: data.assetId || DEFAULT_ASSET_ID
    };
    const response = await apiClient.post('/submit-group-transactions', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to submit group transactions';
  }
};

// Escrow APIs
export const getEscrowDetails = async (id) => {
  try {
    const response = await apiClient.get(`/escrow/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch escrow details';
  }
};

export const getUserEscrows = async (address) => {
  try {
    const response = await apiClient.get(`/user-escrows/${address}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch user escrows';
  }
};

// Claim APIs
export const checkOptInStatus = async (address, assetId = DEFAULT_ASSET_ID) => {
  try {
    const response = await apiClient.get(`/check-optin/${address}/${assetId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to check opt-in status';
  }
};

export const generateOptInTransaction = async (data) => {
  try {
    const payload = {
      ...data,
      assetId: data.assetId || DEFAULT_ASSET_ID
    };
    const response = await apiClient.post('/generate-optin', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to generate opt-in transaction';
  }
};

export const submitOptInTransaction = async (data) => {
  try {
    const response = await apiClient.post('/submit-optin', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to submit opt-in transaction';
  }
};


// Generate reclaim transaction
export const generateReclaimTransaction = async (data) => {
  try {
    const response = await apiClient.post('/generate-reclaim', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to generate reclaim transaction';
  }
};

// Submit reclaim transaction
export const submitReclaimTransaction = async (data) => {
  try {
    const response = await apiClient.post('/submit-reclaim', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to submit reclaim transaction';
  }
};

export const fetchAssetBalance = async (address, assetId = DEFAULT_ASSET_ID) => {
  try {
    const response = await apiClient.get(`/assets/balance/${address}/${assetId}`);
    return response.data.balance;
  } catch (error) {
    console.error('Error fetching asset balance:', error);
    // Return a default balance instead of throwing error for better UX
    return '0.00';
  }
};

export const fetchUSDCBalance = (address) => fetchAssetBalance(address, DEFAULT_ASSET_ID);

export const checkAlgoAvailability = async (address, payRecipientFees = false) => {
  try {
    const response = await apiClient.get(`/algo-availability/${address}`, {
      params: { payRecipientFees: payRecipientFees.toString() }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking ALGO availability:', error);
    throw error.response?.data?.error || 'Failed to check ALGO availability';
  }
};

const SUPPORTED_ASSETS = {
  31566704: { 
    id: 31566704, 
    name: 'USDC', 
    symbol: 'USDC', 
    decimals: 6, 
    description: 'USDC is a stablecoin by Circle',
    minAmount: 0.01,
  step: 0.01 
  },
  760037151: { 
    id: 760037151, 
    name: 'xUSD', 
    symbol: 'xUSD', 
    decimals: 6, 
    description: 'xUSD is a stablecoin by CompX',
    minAmount: 0.01,
  step: 0.01 
  },
  2494786278: {
    id: 2494786278,
    name: 'Monko',
    symbol: 'MONKO',
    decimals: 6,
    description: 'Be Monko meme token',
    minAmount: 0.01,
  step: 0.01
  },
  2726252423: {
    id: 2726252423,
    name: 'Alpha',
    symbol: 'ALPHA',
    decimals: 6,
    description: 'Alpha Arcade prediction market token',
    minAmount: 0.01,
  step: 0.01
  },
  523683256: {
    id: 523683256,
    name: 'Akita Inu',
    symbol: 'AKITA',
    decimals: 6,
    description: 'Akita Inu is an og Algorand meme token',
    minAmount: 0.01,
  step: 0.01
  },
  2656692124: {
    id: 2656692124,
    name: 'Ball Sack',
    symbol: 'BALLSACK',
    decimals: 6,
    description: 'Ball Sack meme token',
    minAmount: 0.01,
  step: 0.01
  },
  386192725: {
    id: 386192725,
    name: 'goBTC',
    symbol: 'goBTC',
    decimals: 8,
    description: 'Send BTC on Algorand by Algomint',
    minAmount: 0.00000001,
    step: 0.00000001 
  },
  3160000000: {
    id: 3160000000,
    name: 'Haystack',
    symbol: 'HAY',
    decimals: 6,
    description: 'The token of Haystack: Trading made easy',
    minAmount: 0.01,
  step: 0.01
  },
  2582294183: {
    id: 2582294183,
    name: 'GONNA',
    symbol: 'GONNA',
    decimals: 6,
    description: 'The official coin of the Gonnaverse',
    minAmount: 0.01,
  step: 0.01
  },
  1284444444: {
    id: 1284444444,
    name: 'Orange',
    symbol: 'ORA',
    decimals: 8,
    description: 'Orange is a "mineable" meme',
    minAmount: 0.01,
  step: 0.01
  },
  2582590415: {
    id: 2582590415,
    name: 'Meep',
    symbol: 'MEEP',
    decimals: 6,
    description: 'A meme coin created by Shep NFTs Gary Jules',
    minAmount: 0.01,
  step: 0.01
  },
  2200000000: {
    id: 2200000000,
    name: 'Tinyman',
    symbol: 'TINY',
    decimals: 6,
    description: 'Tinyman is a leading DEX on Algorand',
    minAmount: 0.01,
  step: 0.01
  }
};

const DEFAULT_ASSET_ID = 31566704; // USDC

//  helper functions after the constants
export const getSupportedAssets = () => Object.values(SUPPORTED_ASSETS);
export const getAssetInfo = (assetId) => SUPPORTED_ASSETS[parseInt(assetId)] || null;
export const getDefaultAssetId = () => DEFAULT_ASSET_ID;

// Generate cleanup transaction
export const generateCleanupTransaction = async (data) => {
  try {
    const response = await apiClient.post('/cleanup-contract', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to generate cleanup transaction';
  }
};

// Submit cleanup transaction
export const submitCleanupTransaction = async (data) => {
  try {
    const response = await apiClient.post('/submit-cleanup', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to submit cleanup transaction';
  }
};

// Get minimum amount for an asset
export const getAssetMinAmount = (assetId) => {
  const asset = getAssetInfo(assetId);
  return asset ? asset.minAmount : 0.01;
};

// Get step amount for an asset
export const getAssetStep = (assetId) => {
  const asset = getAssetInfo(assetId);
  return asset ? asset.step : 0.01;
};


export default {
  generateTransactions,
  submitAppCreation,
  submitGroupTransactions,
  getEscrowDetails,
  getUserEscrows,
  checkOptInStatus,
  generateOptInTransaction,
  submitOptInTransaction,
  generateReclaimTransaction,
  submitReclaimTransaction,
  fetchUSDCBalance,
  checkAlgoAvailability,
  getSupportedAssets,
  getAssetInfo,
  getDefaultAssetId,
  fetchAssetBalance,
  generateCleanupTransaction,
  submitCleanupTransaction,
  getAssetMinAmount,
  getAssetStep,
};
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
    // Add default assetId if not provided
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
    // Add default assetId if not provided
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
    // Add default assetId if not provided
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

export const generateClaimTransaction = async (data) => {
  try {
    const response = await apiClient.post('/generate-claim', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to generate claim transaction';
  }
};

export const claimUsdc = async (data) => {
  try {
    const response = await apiClient.post('/claim-usdc', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to claim USDC';
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
    const response = await apiClient.get(`/asset-balance/${address}/${assetId}`);
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

// CHANGE 1: Add supported assets constant at the top (after imports)
const SUPPORTED_ASSETS = {
  31566704: { id: 31566704, name: 'USDC', symbol: 'USDC', decimals: 6, description: 'USD Coin' },
  760037151: { id: 760037151, name: 'xUSD', symbol: 'xUSD', decimals: 6, description: 'Liquid Governance xUSD' }
};

const DEFAULT_ASSET_ID = 31566704; // USDC

// CHANGE 2: Add helper functions after the constants
export const getSupportedAssets = () => Object.values(SUPPORTED_ASSETS);
export const getAssetInfo = (assetId) => SUPPORTED_ASSETS[parseInt(assetId)] || null;
export const getDefaultAssetId = () => DEFAULT_ASSET_ID;

export default {
  generateTransactions,
  submitAppCreation,
  submitGroupTransactions,
  getEscrowDetails,
  getUserEscrows,
  checkOptInStatus,
  generateOptInTransaction,
  submitOptInTransaction,
  generateClaimTransaction,
  claimUsdc,
  generateReclaimTransaction,
  submitReclaimTransaction,
  fetchUSDCBalance,
  checkAlgoAvailability,
  // New exports for asset support
  getSupportedAssets,
  getAssetInfo,
  getDefaultAssetId,
  fetchAssetBalance
};
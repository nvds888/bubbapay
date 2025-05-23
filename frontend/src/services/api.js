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
    const response = await apiClient.post('/generate-transactions', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to generate transaction';
  }
};

export const submitAppCreation = async (data) => {
  try {
    const response = await apiClient.post('/submit-app-creation', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to submit app creation transaction';
  }
};

export const submitGroupTransactions = async (data) => {
  try {
    const response = await apiClient.post('/submit-group-transactions', data);
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
export const checkOptInStatus = async (address) => {
  try {
    const response = await apiClient.get(`/check-optin/${address}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to check opt-in status';
  }
};

export const generateOptInTransaction = async (data) => {
  try {
    const response = await apiClient.post('/generate-optin', data);
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

export const fetchUSDCBalance = async (address) => {
  try {
    // Use our own backend endpoint to fetch USDC balance
    const response = await apiClient.get(`/usdc-balance/${address}`);
    return response.data.balance;
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    // Return a default balance instead of throwing error for better UX
    return '0.00';
  }
};

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
  checkAlgoAvailability
};
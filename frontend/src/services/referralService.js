// src/services/referralService.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const referralApiClient = axios.create({
  baseURL: `${API_URL}/referrals`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Local storage keys
const REFERRAL_STORAGE_KEY = 'bubbapay_referral_code';
const REFERRAL_TIMESTAMP_KEY = 'bubbapay_referral_timestamp';

// Helper functions for local storage
const saveReferralToStorage = (referralCode) => {
  if (referralCode) {
    localStorage.setItem(REFERRAL_STORAGE_KEY, referralCode);
    localStorage.setItem(REFERRAL_TIMESTAMP_KEY, Date.now().toString());
  }
};

const getReferralFromStorage = () => {
  const referralCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
  const timestamp = localStorage.getItem(REFERRAL_TIMESTAMP_KEY);
  
  if (!referralCode || !timestamp) return null;
  
  // Check if referral is older than 24 hours (86400000 ms)
  const isExpired = (Date.now() - parseInt(timestamp)) > 86400000;
  
  if (isExpired) {
    clearReferralFromStorage();
    return null;
  }
  
  return referralCode;
};

const clearReferralFromStorage = () => {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  localStorage.removeItem(REFERRAL_TIMESTAMP_KEY);
};

// Extract referral code from URL and save to storage
export const extractAndSaveReferralFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref');
  
  if (referralCode) {
    // If there's already a stored referral, only replace it if it's different
    const existingReferral = getReferralFromStorage();
    if (existingReferral && existingReferral !== referralCode) {
      // User is using a different referral link, clear the old one
      clearReferralFromStorage();
    }
    saveReferralToStorage(referralCode);
    return referralCode;
  }
  
  return null;
};

// Generate referral link for a user
export const generateReferralLink = async (walletAddress) => {
  try {
    const response = await referralApiClient.post('/generate-referral-link', {
      walletAddress
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to generate referral link';
  }
};

// Link a wallet to a referrer (URL-based only)
export const linkReferral = async (walletAddress, referralCode) => {
  try {
    const response = await referralApiClient.post('/link-referral', {
      walletAddress,
      referralCode
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to link referral';
  }
};

// Get referral stats for a user
export const getReferralStats = async (walletAddress) => {
  try {
    const response = await referralApiClient.get(`/stats/${walletAddress}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to get referral stats';
  }
};

export const handleReferralFromURL = async (walletAddress) => {
  try {
    let referralCode = new URLSearchParams(window.location.search).get('ref');
    
    if (!referralCode) {
      referralCode = getReferralFromStorage();
    }
    
    console.log('🔍 Referral Debug:', {
      walletAddress,
      referralCode,
      urlParams: window.location.search,
      storageCode: getReferralFromStorage()
    });
    
    if (!referralCode || !walletAddress) {
      console.log('❌ Missing referral code or wallet');
      return { linked: false, reason: 'No referral code or wallet' };
    }
    
    const result = await linkReferral(walletAddress, referralCode);
    
    console.log('🔗 Referral Link Result:', result);
    
    if (result.success) {
      clearReferralFromStorage();
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
    
    return { 
      linked: result.success, 
      referrer: result.referrerAddress,
      reason: result.message || result.error // Handle both message and error
    };
  } catch (error) {
    console.error('❌ Error handling referral from URL:', error);
    return { linked: false, reason: error.message || error };
  }
};

export default {
  generateReferralLink,
  linkReferral,
  getReferralStats,
  handleReferralFromURL,
  extractAndSaveReferralFromURL
};
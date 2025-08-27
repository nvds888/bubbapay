// src/services/referralService.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const referralApiClient = axios.create({
  baseURL: `${API_URL}/referrals`,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

// Handle referral linking when wallet connects
export const handleReferralFromURL = async (walletAddress) => {
  try {
    // Get referral code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (!referralCode || !walletAddress) {
      return { linked: false, reason: 'No referral code or wallet' };
    }
    
    // Attempt to link referral
    const result = await linkReferral(walletAddress, referralCode);
    
    // Clean URL after processing
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    
    return { 
      linked: result.success, 
      referrer: result.referrerAddress,
      message: result.message 
    };
  } catch (error) {
    console.error('Error handling referral from URL:', error);
    return { linked: false, reason: error };
  }
};

export default {
  generateReferralLink,
  linkReferral,
  getReferralStats,
  handleReferralFromURL
};
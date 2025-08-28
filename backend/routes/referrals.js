// routes/referrals.js

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Generate referral link for a user
router.post('/generate-referral-link', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const db = req.app.locals.db;
    const referralsCollection = db.collection('referrals');
    
    // Check if user already has a referral code
    let existingReferral = await referralsCollection.findOne({ referrerAddress: walletAddress });
    
    if (existingReferral) {
      const referralUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?ref=${existingReferral.referralCode}`;
      return res.json({
        referralCode: existingReferral.referralCode,
        referralUrl: referralUrl
      });
    }
    
    // Generate unique referral code
    const referralCode = crypto.randomBytes(6).toString('hex').toUpperCase();
    
    // Store referral code mapping
    await referralsCollection.insertOne({
      referrerAddress: walletAddress,
      referralCode: referralCode,
      createdAt: new Date(),
      totalReferrals: 0,
      totalEarnings: 0
    });
    
    const referralUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?ref=${referralCode}`;
    
    res.json({
      referralCode: referralCode,
      referralUrl: referralUrl
    });
    
  } catch (error) {
    console.error('Error generating referral link:', error);
    res.status(500).json({ error: 'Failed to generate referral link', details: error.message });
  }
});

// Link a wallet to a referrer (URL-based only)
router.post('/link-referral', async (req, res) => {
  try {
    const { walletAddress, referralCode } = req.body;
    
    if (!walletAddress || !referralCode) {
      return res.status(400).json({ error: 'Wallet address and referral code are required' });
    }
    
    const db = req.app.locals.db;
    const referralsCollection = db.collection('referrals');
    const referralLinksCollection = db.collection('referralLinks');
    
    // Check if wallet is already linked to someone
    const existingLink = await referralLinksCollection.findOne({ referralAddress: walletAddress });
    if (existingLink) {
      return res.json({ 
        success: false, 
        message: 'Wallet already linked to a referrer',
        existingReferrer: existingLink.referrerAddress
      });
    }
    
    // Find referrer by code
    const referrer = await referralsCollection.findOne({ referralCode: referralCode });
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }
    
    // Prevent self-referral
    if (referrer.referrerAddress === walletAddress) {
      return res.json({ 
        success: false, 
        message: 'Cannot refer yourself' 
      });
    }
    
    // Create referral link
    await referralLinksCollection.insertOne({
      referrerAddress: referrer.referrerAddress,
      referralAddress: walletAddress,
      referralCode: referralCode,
      linkedAt: new Date(),
      totalEarningsGenerated: 0
    });
    
    // Update referrer stats
    await referralsCollection.updateOne(
      { _id: referrer._id },
      { $inc: { totalReferrals: 1 } }
    );
    
    res.json({
      success: true,
      referrerAddress: referrer.referrerAddress
    });
    
  } catch (error) {
    console.error('Error linking referral:', error);
    res.status(500).json({ error: 'Failed to link referral', details: error.message });
  }
});

// Get referrer for a transaction creator (used during claims)
router.get('/get-referrer/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const db = req.app.locals.db;
    const referralLinksCollection = db.collection('referralLinks');
    
    const referralLink = await referralLinksCollection.findOne({ referralAddress: walletAddress });
    
    if (!referralLink) {
      return res.json({ hasReferrer: false });
    }
    
    res.json({
      hasReferrer: true,
      referrerAddress: referralLink.referrerAddress
    });
    
  } catch (error) {
    console.error('Error getting referrer:', error);
    res.status(500).json({ error: 'Failed to get referrer', details: error.message });
  }
});

// Get referral stats for a user
router.get('/stats/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const db = req.app.locals.db;
    const referralsCollection = db.collection('referrals');
    const referralLinksCollection = db.collection('referralLinks');
    
    // Get referrer stats
    const referrerStats = await referralsCollection.findOne({ referrerAddress: walletAddress });
    
    // Get all referrals for this user
    const referrals = await referralLinksCollection.find({ referrerAddress: walletAddress }).toArray();
    
    res.json({
      referralCode: referrerStats?.referralCode || null,
      totalReferrals: referrerStats?.totalReferrals || 0,
      totalEarnings: referrerStats?.totalEarnings || 0,
      referrals: referrals.map(r => ({
        address: r.referralAddress,
        linkedAt: r.linkedAt,
        totalEarningsGenerated: r.totalEarningsGenerated || 0,
        totalClaims: r.totalClaims || 0
      }))
    });
    
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ error: 'Failed to get referral stats', details: error.message });
  }
});


module.exports = router;
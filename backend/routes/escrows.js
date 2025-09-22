const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');

// Get escrow details 
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    let escrow;
    
    // Try to find by MongoDB ID first
    if (ObjectId.isValid(req.params.id)) {
      escrow = await escrowCollection.findOne({ _id: new ObjectId(req.params.id) });
    }
    
    // If not found, try to find by appId
    if (!escrow && !isNaN(parseInt(req.params.id))) {
      escrow = await escrowCollection.findOne({ appId: parseInt(req.params.id) });
    }
    
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }
    
    // Remove sensitive data from response
    const sanitizedEscrow = { ...escrow };
    delete sanitizedEscrow.claimHash; // Don't expose the hash
    
    res.status(200).json(sanitizedEscrow);
  } catch (error) {
    console.error('Error fetching escrow:', error);
    res.status(500).json({ error: 'Failed to fetch escrow details', details: error.message });
  }
});

// Get user escrows
router.get('/user/:address', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrows = await escrowCollection.find({ 
      senderAddress: req.params.address 
    }).sort({ createdAt: -1 }).toArray();
    
    // Remove sensitive data from all escrows
    const sanitizedEscrows = escrows.map(escrow => {
      const sanitized = { ...escrow };
      delete sanitized.claimHash;
      return sanitized;
    });
    
    res.status(200).json(sanitizedEscrows);
  } catch (error) {
    console.error('Error fetching user escrows:', error);
    res.status(500).json({ error: 'Failed to fetch user escrows', details: error.message });
  }
});

// Get incomplete escrows for recovery
router.get('/incomplete/:address', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const incompleteEscrows = await escrowCollection.find({ 
      senderAddress: req.params.address,
      funded: false,
      status: 'APP_CREATED_AWAITING_FUNDING'
    }).sort({ createdAt: -1 }).toArray();
    
    // Remove sensitive data but keep what's needed for recovery
    const sanitizedEscrows = incompleteEscrows.map(escrow => {
      const sanitized = { ...escrow };
      delete sanitized.claimHash; // Don't expose hash
      // Keep groupTransactions for recovery
      return sanitized;
    });
    
    res.status(200).json(sanitizedEscrows);
  } catch (error) {
    console.error('Error fetching incomplete escrows:', error);
    res.status(500).json({ error: 'Failed to fetch incomplete escrows', details: error.message });
  }
});

// Get specific escrow by ID for recovery
router.get('/recovery/:escrowId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    if (!ObjectId.isValid(req.params.escrowId)) {
      return res.status(400).json({ error: 'Invalid escrow ID' });
    }
    
    const escrow = await escrowCollection.findOne({ 
      _id: new ObjectId(req.params.escrowId),
      funded: false,
      status: 'APP_CREATED_AWAITING_FUNDING'
    });
    
    if (!escrow) {
      return res.status(404).json({ error: 'Incomplete escrow not found' });
    }
    
    // Remove sensitive data but keep recovery data
    const sanitizedEscrow = { ...escrow };
    delete sanitizedEscrow.claimHash;
    
    res.status(200).json(sanitizedEscrow);
  } catch (error) {
    console.error('Error fetching escrow for recovery:', error);
    res.status(500).json({ error: 'Failed to fetch escrow for recovery', details: error.message });
  }
});

module.exports = router;
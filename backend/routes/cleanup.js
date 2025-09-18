// routes/cleanup.js

const express = require('express');
const router = express.Router();
const algosdk = require('algosdk');
const { ObjectId } = require('mongodb');

// Initialize Algorand client
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://mainnet-api.algonode.cloud';
const ALGOD_PORT = process.env.ALGOD_PORT || '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

/**
 * Generate cleanup transaction group for a completed contract
 */
async function generateCleanupTransaction({ appId, senderAddress, assetId = null }) {
  try {
    const appIdInt = parseInt(appId);
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Use only the specific asset ID for this contract
    const foreignAssets = assetId ? [assetId] : [];

    const deleteAppTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: senderAddress,
      appIndex: appIdInt,
      onComplete: algosdk.OnApplicationComplete.DeleteApplicationOC,
      foreignAssets: foreignAssets,
      suggestedParams: {
        ...suggestedParams,
        fee: 3000,
        flatFee: true
      }
    });
    
    const encodedTxns = [Buffer.from(algosdk.encodeUnsignedTransaction(deleteAppTxn)).toString('base64')];
    
    return { 
      transactions: encodedTxns,
      totalFee: 3000 / 1e6,
      estimatedRecovery: "0.46 ALGO", // 0.25 app reserve + 0.21 app funding
      description: "Delete application and recover all ALGO + assets"
    };
  } catch (error) {
    console.error("Error in generateCleanupTransaction:", error);
    throw new Error(`Failed to create cleanup transaction: ${error.message}`);
  }
}

/**
 * POST /cleanup-contract
 * Clean up a single completed escrow contract to recover locked ALGO
 */
router.post('/cleanup-contract', async (req, res) => {
  try {
    const { senderAddress, appId } = req.body;
    
    console.log(`Cleanup request for app ${appId} from ${senderAddress}`);
    
    if (!senderAddress || !appId) {
      return res.status(400).json({
        success: false,
        error: 'Missing senderAddress or appId'
      });
    }

    if (!algosdk.isValidAddress(senderAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sender address format'
      });
    }

    const appIdInt = parseInt(appId);
    if (isNaN(appIdInt) || appIdInt <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid app ID'
      });
    }

    // Check if app exists and is completed (claimed = 1)
    try {
      const appInfo = await algodClient.getApplicationByID(appIdInt).do();
      
      // Parse global state to check if completed
      let isCompleted = false;
      let isCreator = false;
      let foundCreatorAddress = null;
      
      if (appInfo.params && appInfo.params.globalState) {
        
        for (const kv of appInfo.params.globalState) {
          const keyBytes = new Uint8Array(Object.values(kv.key));
          const key = Buffer.from(keyBytes).toString();
          
          if (key === 'claimed' && Number(kv.value.uint) === 1) {
            isCompleted = true;
          }
          
          if (key === 'creator') {
            try {
              const addressBytes = new Uint8Array(Object.values(kv.value.bytes));
              foundCreatorAddress = algosdk.encodeAddress(addressBytes);
              isCreator = (foundCreatorAddress === senderAddress);
            } catch (addressError) {
              console.error('DEBUG - Error decoding creator address:', addressError);
            }
          }
        }
      } else {
        console.log('DEBUG - No global state found or wrong structure');
        console.log('DEBUG - appInfo.params keys:', Object.keys(appInfo.params || {}));
      }
      
      if (!isCreator) {
        return res.status(403).json({
          success: false,
          error: `Only the contract creator can clean up this contract. Creator: ${foundCreatorAddress}, Sender: ${senderAddress}`
        });
      }
      
      if (!isCompleted) {
        return res.status(400).json({
          success: false,
          error: 'Contract must be completed (claimed or reclaimed) before cleanup'
        });
      }
      
    } catch (appError) {
      console.error('Error checking app state:', appError);
      return res.status(404).json({
        success: false,
        error: 'Contract not found or invalid'
      });
    }

    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    const escrow = await escrowCollection.findOne({ appId: appIdInt, senderAddress });
    const contractAssetId = escrow ? escrow.assetId : null;

    const cleanupTxns = await generateCleanupTransaction({
      appId: appIdInt,
      senderAddress,
      assetId: contractAssetId 
    });
    
    res.json({
      success: true,
      transactions: cleanupTxns.transactions,
      estimatedRecovery: cleanupTxns.estimatedRecovery,
      appId: appIdInt
    });
    
  } catch (error) {
    console.error('Cleanup contract error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate cleanup transaction'
    });
  }
});

/**
 * POST /submit-cleanup
 * Submit a signed cleanup transaction group
 */
router.post('/submit-cleanup', async (req, res) => {
  try {
    const { signedTxns, appId, senderAddress } = req.body;
    
    console.log(`Submitting cleanup transaction group for app ${appId}`);
    
    if (!signedTxns || !Array.isArray(signedTxns) || !appId || !senderAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters or invalid format'
      });
    }

    let txId;
    
    try {
      // Submit the signed transactions 
      const submitResponse = await algodClient.sendRawTransaction(
        signedTxns.map(txn => Buffer.from(txn, 'base64'))
      ).do();
      txId = submitResponse.txid;
      
      // Wait for confirmation 
      await algosdk.waitForConfirmation(algodClient, txId, 5);
      
    } catch (submitError) {
      // Handle duplicate submission 
      if (submitError.message && submitError.message.includes('transaction already in ledger')) {
        console.log('Cleanup transaction already in ledger, extracting txId...');
        
        const txIdMatch = submitError.message.match(/transaction already in ledger: ([A-Z0-9]+)/);
        if (txIdMatch && txIdMatch[1]) {
          txId = txIdMatch[1];
          console.log(`Extracted cleanup txId from error: ${txId}`);
          
          try {
            await algosdk.waitForConfirmation(algodClient, txId, 5);
            console.log('Successfully confirmed existing cleanup transaction');
          } catch (confirmError) {
            console.error('Error confirming existing cleanup transaction:', confirmError);
            throw new Error('Cleanup transaction was submitted but confirmation failed');
          }
        } else {
          throw new Error('Could not extract transaction ID from cleanup duplicate submission error');
        }
      } else {
        throw submitError;
      }
    }
    
    console.log(`Cleanup transaction group confirmed with ID: ${txId}`);
    
    // Update database to mark contract as cleaned up
    try {
      const db = req.app.locals.db;
      const escrowCollection = db.collection('escrows');
      const escrow = await escrowCollection.findOne({ appId: parseInt(appId), senderAddress });
      if (escrow) {
        await escrowCollection.updateOne(
          { _id: escrow._id },
          { 
            $set: {  
              cleanedUp: true, 
              cleanupTxId: txId,
              cleanedUpAt: new Date()
            }
          }
        );
        console.log(`Database updated for cleaned up contract ${appId}`);
      }
    } catch (dbError) {
      console.warn('Failed to update database after cleanup:', dbError);
    }
    
    // Calculate correct recovery amount
const escrow = await escrowCollection.findOne({ appId: parseInt(appId), senderAddress });
let recoveryAmount = 0.46; // (app reserve + app funding)

if (escrow && escrow.payRecipientFees && escrow.claimType === 'optimized-claim') {
  recoveryAmount += 0.21; // Add unused recipient fee coverage
}

res.json({
  success: true,
  txId,
  message: 'Contract cleaned up successfully',
  estimatedRecovered: `~${recoveryAmount.toFixed(2)} ALGO`
});
    
  } catch (error) {
    console.error('Error submitting cleanup transaction group:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit cleanup transaction group'
    });
  }
});

// Generate cleanup transaction for unfunded app
router.post('/cleanup-unfunded-app', async (req, res) => {
  try {
    const { appId, senderAddress } = req.body;
    
    // Verify this is an unfunded app by this sender
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrow = await escrowCollection.findOne({
      appId: parseInt(appId),
      senderAddress,
      funded: false,
      status: 'APP_CREATED_AWAITING_FUNDING'
    });
    
    if (!escrow) {
      return res.status(404).json({ error: 'Unfunded app not found or not owned by sender' });
    }
    
    // Generate delete transaction (no assets to worry about since unfunded)
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const deleteAppTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: senderAddress,
      appIndex: parseInt(appId),
      onComplete: algosdk.OnApplicationComplete.DeleteApplicationOC,
      suggestedParams: { ...suggestedParams, fee: 2000, flatFee: true }
    });
    
    const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(deleteAppTxn)).toString('base64');
    
    res.json({ transaction: encodedTxn });
  } catch (error) {
    console.error('Error generating cleanup transaction:', error);
    res.status(500).json({ error: 'Failed to generate cleanup transaction' });
  }
});

// Submit cleanup of unfunded app
router.post('/submit-cleanup-unfunded', async (req, res) => {
  try {
    const { signedTxn, appId, escrowId } = req.body;
    
    // Submit transaction
    const { txid } = await algodClient.sendRawTransaction(Buffer.from(signedTxn, 'base64')).do();
    await algosdk.waitForConfirmation(algodClient, txid, 5);
    
    // Mark as cleaned up instead of deleting the record
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    if (escrowId && ObjectId.isValid(escrowId)) {
      await escrowCollection.updateOne(
        { _id: new ObjectId(escrowId) },
        { 
          $set: { 
            cleanedUp: true,
            cleanupTxId: txid,
            cleanedUpAt: new Date(),
            status: 'UNFUNDED_CLEANED_UP' 
          }
        }
      );
    } else {
      await escrowCollection.updateOne(
        { appId: parseInt(appId), funded: false },
        { 
          $set: { 
            cleanedUp: true,
            cleanupTxId: txid,
            cleanedUpAt: new Date(),
            status: 'UNFUNDED_CLEANED_UP'
          }
        }
      );
    }
    
    res.json({ success: true, txid });
  } catch (error) {
    console.error('Error submitting cleanup:', error);
    res.status(500).json({ error: 'Failed to submit cleanup transaction' });
  }
});

module.exports = router;
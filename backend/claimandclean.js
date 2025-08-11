// claimandclean.js - Claim and Cleanup Endpoints (Backend Root)

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const algosdk = require('algosdk');
const { getDefaultAssetId, getAssetInfo } = require('./assetConfig');

// Initialize Algorand client
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://mainnet-api.algonode.cloud';
const ALGOD_PORT = process.env.ALGOD_PORT || '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Helper function to safely convert BigInt to Number
function safeToNumber(value) {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'number') {
    return value;
  }
  return value; // Return the original value
}

// Helper function to hash private keys securely
function hashPrivateKey(privateKey, appId) {
  const hash = crypto.createHash('sha256');
  hash.update(privateKey + appId.toString());
  return hash.digest('hex');
}

// Generate optimized claim transaction group for users already opted in
router.post('/generate-optimized-claim', async (req, res) => {
  try {
    const { tempPrivateKey, appId, recipientAddress, assetId } = req.body;
    
    if (!tempPrivateKey || !appId || !recipientAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // SECURITY: Hash the private key to look up the escrow
    const claimHash = hashPrivateKey(tempPrivateKey, appId);
    
    // Check if escrow exists using the hash
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrow = await escrowCollection.findOne({ 
      claimHash: claimHash,
      appId: parseInt(appId)
    });
    
    if (!escrow) {
      return res.status(404).json({ error: 'Invalid claim link or escrow not found' });
    }
    
    if (escrow.claimed) {
      return res.status(400).json({ error: 'Funds have already been claimed' });
    }
    
    // Reconstruct temporary account from private key
    const secretKeyUint8 = new Uint8Array(Buffer.from(tempPrivateKey, 'hex'));
    const publicKey = secretKeyUint8.slice(32, 64);
    const tempAddress = algosdk.encodeAddress(publicKey);
    
    const tempAccountObj = {
      addr: tempAddress,
      sk: secretKeyUint8
    };
    
    console.log("Generating optimized claim for user already opted in");
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    const targetAssetId = assetId || escrow.assetId || getDefaultAssetId();
    
    // Calculate fee coverage amount to return to creator (if applicable)
    let feeCoverageAmount = 0;
    if (escrow.payRecipientFees) {
      // Check temp account balance
      const tempAccountInfo = await algodClient.accountInformation(tempAddress).do();
      const tempBalance = safeToNumber(tempAccountInfo.amount);
      
      // Reserve amounts for the transactions in this group
      const claimTxnFee = 2000; // App call with inner txn
      const returnFeeTxnFee = 1000; // Payment to creator
      const closeTxnFee = 1000; // Payment to close account
      const minimumBalance = 100000; // Keep some minimum for closure
      
      const totalReserved = claimTxnFee + returnFeeTxnFee + closeTxnFee + minimumBalance;
      feeCoverageAmount = Math.max(0, tempBalance - totalReserved);
      
      console.log(`Fee coverage amount to return to creator: ${feeCoverageAmount / 1e6} ALGO`);
    }
    
    const transactions = [];
    
    // Transaction 1: App call to claim funds (sends asset to user)
    const claimTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: tempAccountObj.addr,
      appIndex: parseInt(appId),
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [new Uint8Array(Buffer.from("claim"))],
      accounts: [recipientAddress],
      foreignAssets: [targetAssetId],
      suggestedParams: { ...suggestedParams, fee: 2000, flatFee: true }
    });
    transactions.push(claimTxn);
    
    // Transaction 2: Return fee coverage to creator (if applicable)
    if (feeCoverageAmount > 0) {
      const returnFeeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: tempAccountObj.addr,
        receiver: escrow.senderAddress,
        amount: feeCoverageAmount,
        note: new Uint8Array(Buffer.from('AlgoSend fee coverage returned to creator')),
        suggestedParams: { ...suggestedParams, fee: 1000, flatFee: true }
      });
      transactions.push(returnFeeTxn);
    }

    // Transaction 3: Close temp account and send remaining balance to platform
    const PLATFORM_ADDRESS = process.env.PLATFORM_ADDRESS || 'REPLACE_WITH_YOUR_PLATFORM_ADDRESS';
    const closeAccountTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: tempAccountObj.addr,
      receiver: PLATFORM_ADDRESS,
      amount: 0, // All remaining balance goes to closeRemainderTo
      closeRemainderTo: PLATFORM_ADDRESS,
      note: new Uint8Array(Buffer.from('AlgoSend platform fee')),
      suggestedParams: { ...suggestedParams, fee: 1000, flatFee: true }
    });
    transactions.push(closeAccountTxn);

    // Group the transactions
    algosdk.assignGroupID(transactions);

    // Sign all transactions with temp account
    const signedTransactions = transactions.map(txn => {
      const signedTxn = algosdk.signTransaction(txn, tempAccountObj.sk);
      return Buffer.from(signedTxn.blob).toString('base64');
    });

    console.log(`Optimized claim transaction group created (${transactions.length} transactions)`);
    
    res.status(200).json({
      signedTransactions,
      txnId: claimTxn.txID(),
      type: 'optimized-claim',
      feeCoverageReturned: feeCoverageAmount > 0,
      feeCoverageAmount: feeCoverageAmount / 1e6
    });
  } catch (error) {
    console.error('Error generating optimized claim transaction:', error);
    res.status(500).json({ error: 'Failed to generate optimized claim transaction', details: error.message });
  }
});

// Generate opt-in and claim group transaction for users who need to opt-in
router.post('/generate-optin-and-claim', async (req, res) => {
  try {
    const { tempPrivateKey, appId, recipientAddress, assetId } = req.body;
    
    if (!tempPrivateKey || !appId || !recipientAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // SECURITY: Hash the private key to look up the escrow
    const claimHash = hashPrivateKey(tempPrivateKey, appId);
    
    // Check if escrow exists using the hash
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrow = await escrowCollection.findOne({ 
      claimHash: claimHash,
      appId: parseInt(appId)
    });
    
    if (!escrow) {
      return res.status(404).json({ error: 'Invalid claim link or escrow not found' });
    }
    
    if (escrow.claimed) {
      return res.status(400).json({ error: 'Funds have already been claimed' });
    }
    
    // Reconstruct temporary account from private key
    const secretKeyUint8 = new Uint8Array(Buffer.from(tempPrivateKey, 'hex'));
    const publicKey = secretKeyUint8.slice(32, 64);
    const tempAddress = algosdk.encodeAddress(publicKey);
    
    const tempAccountObj = {
      addr: tempAddress,
      sk: secretKeyUint8
    };
    
    console.log("Generating opt-in and claim group transaction");
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    const targetAssetId = assetId || escrow.assetId || getDefaultAssetId();
    
    // Calculate fee coverage amount (if escrow includes fee coverage)
    let feeCoverageAmount = 0;
    if (escrow.payRecipientFees) {
      // Check temp account balance
      const tempAccountInfo = await algodClient.accountInformation(tempAddress).do();
      const tempBalance = safeToNumber(tempAccountInfo.amount);
      
      // Reserve amounts for the transactions in this group
      const claimTxnFee = 2000; // App call with inner txn
      const optInTxnFee = 1000; // Asset opt-in (user pays this)
      const feeCoverageTxnFee = 1000; // Payment txn to user
      const closeTxnFee = 1000; // Payment to close account
      const minimumBalance = 100000; // Keep some minimum for closure
      
      const totalReserved = claimTxnFee + feeCoverageTxnFee + closeTxnFee + minimumBalance;
      // Note: We don't include optInTxnFee because user pays for their own opt-in
      feeCoverageAmount = Math.max(0, tempBalance - totalReserved);
      
      console.log(`Fee coverage amount: ${feeCoverageAmount / 1e6} ALGO`);
    }
    
    // Build transaction group
    const transactions = [];
    
    // Transaction 1: Fee coverage from temp account to user (if applicable)
    if (feeCoverageAmount > 0) {
      const feeCoverageTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: tempAccountObj.addr,
        receiver: recipientAddress,
        amount: feeCoverageAmount,
        note: new Uint8Array(Buffer.from('AlgoSend fee coverage')),
        suggestedParams: { ...suggestedParams, fee: 1000, flatFee: true }
      });
      transactions.push(feeCoverageTxn);
    }
    
    // Transaction 2: User opts into asset
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: recipientAddress,
      receiver: recipientAddress,
      closeRemainderTo: undefined,
      revocationTarget: undefined,
      amount: 0,
      assetIndex: targetAssetId,
      suggestedParams: { ...suggestedParams, fee: 1000, flatFee: true }
    });
    transactions.push(optInTxn);
    
    // Transaction 3: App call to claim funds (sends asset to user)
    const claimTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: tempAccountObj.addr,
      appIndex: parseInt(appId),
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [new Uint8Array(Buffer.from("claim"))],
      accounts: [recipientAddress],
      foreignAssets: [targetAssetId],
      suggestedParams: { ...suggestedParams, fee: 2000, flatFee: true }
    });
    transactions.push(claimTxn);
    
    // Transaction 4: Close temp account and send remaining balance to platform
    const PLATFORM_ADDRESS = process.env.PLATFORM_ADDRESS || 'REPLACE_WITH_YOUR_PLATFORM_ADDRESS';
    const closeAccountTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: tempAccountObj.addr,
      receiver: PLATFORM_ADDRESS,
      amount: 0, // All remaining balance goes to closeRemainderTo
      closeRemainderTo: PLATFORM_ADDRESS,
      note: new Uint8Array(Buffer.from('AlgoSend platform fee')),
      suggestedParams: { ...suggestedParams, fee: 1000, flatFee: true }
    });
    transactions.push(closeAccountTxn);
    
    // Group all transactions
    algosdk.assignGroupID(transactions);
    
    // Sign transactions that the temp account is responsible for - FIXED ORDER-BASED APPROACH
    const signedTransactions = [];
    let userTxnIndex = -1;

    // We know exactly which transaction is the user's based on how we built the array
    let currentIndex = 0;

    // Transaction 1: Fee coverage (temp account) - if applicable
    if (feeCoverageAmount > 0) {
      const signedTxn = algosdk.signTransaction(transactions[currentIndex], tempAccountObj.sk);
      signedTransactions.push(Buffer.from(signedTxn.blob).toString('base64'));
      currentIndex++;
    }

    // Transaction 2: User opt-in (user account) - ALWAYS at this position
    signedTransactions.push(null); // User must sign this
    userTxnIndex = currentIndex;
    currentIndex++;

    // Transaction 3: App call claim (temp account)
    const signedClaimTxn = algosdk.signTransaction(transactions[currentIndex], tempAccountObj.sk);
    signedTransactions.push(Buffer.from(signedClaimTxn.blob).toString('base64'));
    currentIndex++;

    // Transaction 4: Close account (temp account)
    const signedCloseTxn = algosdk.signTransaction(transactions[currentIndex], tempAccountObj.sk);
    signedTransactions.push(Buffer.from(signedCloseTxn.blob).toString('base64'));
    
    // Encode unsigned transactions for user to sign
    const unsignedTransactions = transactions.map(txn => 
      Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64')
    );

    console.log(`Opt-in and claim group transaction created (${transactions.length} transactions)`);
    
    res.status(200).json({
      unsignedTransactions,
      partiallySignedTransactions: signedTransactions,
      userTxnIndex,
      txnId: claimTxn.txID(),
      type: 'optin-and-claim',
      feeCoverageProvided: feeCoverageAmount > 0,
      feeCoverageAmount: feeCoverageAmount / 1e6
    });
  } catch (error) {
    console.error('Error generating opt-in and claim transaction:', error);
    res.status(500).json({ error: 'Failed to generate opt-in and claim transaction', details: error.message });
  }
});

// Submit optimized claim transactions
router.post('/submit-optimized-claim', async (req, res) => {
  try {
    const { signedTransactions, appId, recipientAddress, tempPrivateKey, type } = req.body;
    
    if (!signedTransactions || !Array.isArray(signedTransactions) || !appId || !recipientAddress || !tempPrivateKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // SECURITY: Hash the private key to look up the escrow
    const claimHash = hashPrivateKey(tempPrivateKey, appId);
    
    // Check if escrow exists and is not claimed
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrow = await escrowCollection.findOne({ 
      claimHash: claimHash,
      appId: parseInt(appId)
    });
    
    if (!escrow) {
      return res.status(404).json({ error: 'Invalid claim link or escrow not found' });
    }
    
    if (escrow.claimed) {
      return res.status(400).json({ error: 'Funds have already been claimed' });
    }
    
    // Submit the signed transaction group
    try {
      const { txid } = await algodClient.sendRawTransaction(
        signedTransactions.map(txn => Buffer.from(txn, 'base64'))
      ).do();
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txid, 5);
      
      // Update the escrow record
      await escrowCollection.updateOne(
        { _id: escrow._id },
        { 
          $set: { 
            claimed: true,
            claimedAt: new Date(),
            claimedBy: recipientAddress,
            claimType: type // Track which flow was used
          } 
        }
      );
      
      const assetInfo = getAssetInfo(escrow.assetId);
      let message = `Successfully claimed ${escrow.amount} ${assetInfo?.symbol || 'tokens'}`;
      
      if (type === 'optimized-claim') {
        message += '. Fee coverage was returned to creator.';
      } else if (type === 'optin-and-claim') {
        message += '. Opted in and claimed in one transaction.';
      }
      
      res.status(200).json({
        success: true,
        amount: escrow.amount,
        claimType: type,
        message
      });
    } catch (error) {
      console.error('Error submitting optimized claim transaction:', error);
      
      // Check if this is an app rejection
      if (error.message.includes('rejected')) {
        return res.status(400).json({
          success: false,
          error: 'Claim rejected by the smart contract. The funds may have already been claimed.'
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error processing optimized claim:', error);
    res.status(500).json({ error: 'Failed to process optimized claim', details: error.message });
  }
});

/**
 * Generate cleanup transaction group for a completed contract
 */
async function generateCleanupTransaction({ appId, senderAddress, assetId = null }) {
  try {
    const appIdInt = parseInt(appId);
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // ✅ Just pass the common assets - TEAL will figure out which ones to opt out of
    const commonAssets = [31566704, 760037151, 2494786278, 2726252423]; // USDC, xUSD, MONKO, ALPHA
    
    const deleteAppTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: senderAddress,
      appIndex: appIdInt,
      onComplete: algosdk.OnApplicationComplete.DeleteApplicationOC,
      foreignAssets: commonAssets,
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
      estimatedRecovery: "0.31 ALGO", // 0.1 app reserve + 0.21 app funding
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

    // No need to query database anymore!
    const cleanupTxns = await generateCleanupTransaction({
      appId: appIdInt,
      senderAddress
      // ✅ No assetId needed!
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
      // Submit the signed transactions (same pattern as submit-group-transactions)
      const submitResponse = await algodClient.sendRawTransaction(
        signedTxns.map(txn => Buffer.from(txn, 'base64'))
      ).do();
      txId = submitResponse.txid;
      
      // Wait for confirmation (same pattern as other endpoints)
      await algosdk.waitForConfirmation(algodClient, txId, 5);
      
    } catch (submitError) {
      // Handle duplicate submission (same pattern as submit-app-creation)
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
            $set: {  // ADD $set operator for MongoDB
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
      // Don't fail the request if database update fails
    }
    
    res.json({
      success: true,
      txId,
      message: 'Contract cleaned up successfully',
      estimatedRecovered: "~0.31 ALGO"
    });
    
  } catch (error) {
    console.error('Error submitting cleanup transaction group:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit cleanup transaction group'
    });
  }
});

module.exports = router;
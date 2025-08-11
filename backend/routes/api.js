// routes/api.js - Complete Updated Implementation with Corrected Fee Flow

const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto'); // Add crypto for hashing
const { 
  generateUnsignedDeployTransactions, 
  generatePostAppTransactions,
  generateReclaimTransaction,
} = require('../atomic-deploy-email-escrow');
const algosdk = require('algosdk');
const { checkAlgoAvailabilityForEscrow } = require('../utils/algoAvailabilityUtils');
const { getDefaultAssetId, getAssetInfo, isAssetSupported, toMicroUnits, fromMicroUnits } = require('../assetConfig');

// Initialize Algorand client
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://mainnet-api.algonode.cloud';
const ALGOD_PORT = process.env.ALGOD_PORT || '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);


function safeJson(obj) {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value,
    2
  );
}


function safeToNumber(value) {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'number') {
    return value;
  }
  // Don't default to 0 for undefined/null - that's the bug!
  return value; // Return the original value
}

// Helper function to hash private keys securely
function hashPrivateKey(privateKey, appId) {
  // Create a hash using the private key and app ID for uniqueness
  const hash = crypto.createHash('sha256');
  hash.update(privateKey + appId.toString());
  return hash.digest('hex');
}

// Helper function to validate claim parameters
function validateClaimParameters(tempPrivateKey, appId, claimHash) {
  if (!tempPrivateKey || !appId) {
    return { valid: false, error: 'Missing required parameters' };
  }
  
  // Recreate the hash and compare
  const expectedHash = hashPrivateKey(tempPrivateKey, appId);
  if (expectedHash !== claimHash) {
    return { valid: false, error: 'Invalid claim parameters' };
  }
  
  return { valid: true };
}

// Generate unsigned transactions for app creation
router.post('/generate-transactions', async (req, res) => {
  try {
    const { amount, recipientEmail, senderAddress, assetId } = req.body;
    
    console.log("API received parameters:", {
      amount,
      recipientEmail,
      senderAddress: senderAddress || "UNDEFINED"
    });
    
    if (!amount) {
      return res.status(400).json({ error: 'Missing amount parameter' });
    }
    
    if (!senderAddress) {
      return res.status(400).json({ error: 'Missing sender address - please connect your wallet' });
    }
    
    // Additional validation
    try {
      algosdk.decodeAddress(senderAddress);
    } catch (error) {
      console.error("Invalid address format:", senderAddress);
      return res.status(400).json({ error: 'Invalid sender address format' });
    }

    // Validate asset
    const targetAssetId = assetId || getDefaultAssetId();
    if (!isAssetSupported(targetAssetId)) {
      return res.status(400).json({ error: 'Unsupported asset selected' });
    }
    
    // Generate the transactions
    const txnData = await generateUnsignedDeployTransactions({
      amount: parseFloat(amount),
      recipientEmail: recipientEmail || 'shareable@link.com',
      senderAddress,
      assetId: targetAssetId
    });
    
    res.status(200).json(txnData);
  } catch (error) {
    console.error('Error generating transactions:', error);
    res.status(500).json({ error: 'Failed to generate transactions', details: error.message });
  }
});

router.post('/submit-app-creation', async (req, res) => {
  try {
    const {
      signedTxn,
      tempAccount,
      amount,
      microAmount,
      recipientEmail,
      senderAddress,
      payRecipientFees,
      assetId
    } = req.body;

    if (!signedTxn || !tempAccount || !amount || !senderAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let txId;

    // Step 1: Submit transaction
    try {
      const submitResponse = await algodClient
        .sendRawTransaction(Buffer.from(signedTxn, 'base64'))
        .do();

      console.log('Submit response:', JSON.stringify(submitResponse, null, 2));

      txId = submitResponse.txid;
    } catch (submitError) {
      console.error('submitError details:', submitError);

      // Handle "already in ledger" case
      if (
        submitError.message &&
        submitError.message.includes('transaction already in ledger')
      ) {
        console.log('Transaction already in ledger, extracting txId and confirming...');

        const txIdMatch = submitError.message.match(/transaction already in ledger: ([A-Z0-9]+)/);
        if (txIdMatch && txIdMatch[1]) {
          txId = txIdMatch[1];
          console.log(`Extracted txId from error: ${txId}`);
        } else {
          throw new Error('Could not extract transaction ID from duplicate submission error');
        }
      } else {
        throw submitError; // Re-throw all other errors
      }
    }

    // Step 2: Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 5);

    // Step 3: Get full confirmed txn info
    const confirmedTxn = await algodClient.pendingTransactionInformation(txId).do();
    const appId = confirmedTxn['applicationIndex'] || confirmedTxn['applicationIndex'];
    console.log('Confirmed App ID:', appId);

    if (!appId) {
      console.log('Confirmed txn:', safeJson(confirmedTxn));
      throw new Error('Application ID not found in transaction result');
    }

    // Step 4: Generate post-creation transactions
    const postAppTxns = await generatePostAppTransactions({
      appId,
      senderAddress,
      microAmount,
      tempAccount,
      payRecipientFees,
      assetId: assetId || getDefaultAssetId()
    });

    // Step 5: Send response
    res.status(200).json({
      appId: Number(appId),  // Convert BigInt to number
      appAddress: postAppTxns.appAddress,
      groupTransactions: postAppTxns.groupTransactions,
      tempAccount: postAppTxns.tempAccount
    });

  } catch (error) {
    console.error('Error submitting app creation:', error);
    res.status(500).json({
      error: 'Failed to submit app creation',
      details: error.message
    });
  }
});



// Submit signed group transactions
router.post('/submit-group-transactions', async (req, res) => {
  try {
    const { signedTxns, appId, tempAccount, amount, recipientEmail, senderAddress, payRecipientFees, assetId } = req.body;
    
    if (!signedTxns || !appId || !tempAccount || !amount || !senderAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
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
      // Handle duplicate submission for group transactions too
      if (submitError.message && submitError.message.includes('transaction already in ledger')) {
        console.log('Group transaction already in ledger, extracting txId...');
        
        const txIdMatch = submitError.message.match(/transaction already in ledger: ([A-Z0-9]+)/);
        if (txIdMatch && txIdMatch[1]) {
          txId = txIdMatch[1];
          console.log(`Extracted group txId from error: ${txId}`);
          
          try {
            await algosdk.waitForConfirmation(algodClient, txId, 5);
            console.log('Successfully confirmed existing group transaction');
          } catch (confirmError) {
            console.error('Error confirming existing group transaction:', confirmError);
            throw new Error('Group transaction was submitted but confirmation failed');
          }
        } else {
          throw new Error('Could not extract transaction ID from group duplicate submission error');
        }
      } else {
        throw submitError;
      }
    }
    
    // Get the app address
    const appAddress = algosdk.getApplicationAddress(parseInt(appId));
    
    // Store the escrow in the database
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    // SECURITY: Hash the private key instead of storing it directly
    const claimHash = hashPrivateKey(tempAccount.privateKey, appId);
    
    // Generate claim URL with hashed reference (private key still in URL for signing)
    const claimUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/claim?app=${appId}#key=${tempAccount.privateKey}`;
    
    const escrowRecord = {
      appId: Number(appId),
      appAddress,
      network: 'mainnet',
      assetId: assetId || getDefaultAssetId(),
      recipientEmail: recipientEmail || null,
      isShareable: !recipientEmail,
      authorizedClaimer: tempAccount.address,
      // SECURITY: Store hashed private key instead of the actual key
      claimHash: claimHash, // This is what we store for lookup
      amount: parseFloat(amount),
      createdAt: new Date(),
      claimed: false,
      funded: false,
      senderAddress,
      payRecipientFees: !!payRecipientFees,
      cleanedUp: false,
      cleanupTxId: null,
      cleanedUpAt: null
    };
    
    const result = await escrowCollection.insertOne(escrowRecord);
    
    // Send email if recipient email is provided
    if (recipientEmail) {
      const assetInfo = getAssetInfo(assetId || getDefaultAssetId());
      const symbol = assetInfo?.symbol || 'tokens';
      const msg = {
        to: recipientEmail,
        from: process.env.FROM_EMAIL,
        subject: `You've received ${amount} ${symbol} via AlgoSend!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've received ${amount} ${symbol}!</h2>
            <p>Someone has sent you ${amount} ${symbol} using AlgoSend. Click the button below to claim your funds:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${claimUrl}" 
                 style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                 Claim Your ${symbol}
              </a>
            </div>
            <p>This link will expire once the funds are claimed.</p>
            <p>If you're new to cryptocurrency, don't worry! You'll be guided through the process.</p>
          </div>
        `
      };
      
      await sgMail.send(msg);
    }
    
    res.status(201).json({
      success: true,
      escrowId: result.insertedId,
      appId,
      claimUrl,
      isShareable: !recipientEmail
    });
  } catch (error) {
    console.error('Error submitting group transactions:', error);
    res.status(500).json({ error: 'Failed to submit group transactions', details: error.message });
  }
});

// Get escrow details - Updated to work with claim hash
router.get('/escrow/:id', async (req, res) => {
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
router.get('/user-escrows/:address', async (req, res) => {
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

// Check if user has opted into USDC (with assetId)
router.get('/check-optin/:address/:assetId', async (req, res) => {
  try {
    const accountInfo = await algodClient.accountInformation(req.params.address).do();
    const targetAssetId = parseInt(req.params.assetId) || getDefaultAssetId();
    
    // DEBUG: Log the asset structure
    console.log('DEBUG - Account assets:', accountInfo.assets?.slice(0, 2)); // Just first 2 for brevity
    console.log('DEBUG - Looking for asset ID:', targetAssetId);
    console.log('DEBUG - Asset field names:', accountInfo.assets?.[0] ? Object.keys(accountInfo.assets[0]) : 'No assets');
    
    const hasOptedIn = accountInfo.assets?.some(asset => {
      // Try both possible field names and log what we find
      const assetId1 = asset['asset-id'];
      const assetId2 = asset.assetId;
      console.log(`DEBUG - Asset: asset-id=${assetId1} (type: ${typeof assetId1}), assetId=${assetId2} (type: ${typeof assetId2})`);
      
      return Number(asset['asset-id']) === targetAssetId || Number(asset.assetId) === targetAssetId;
    }) || false;
    
    console.log('DEBUG - Has opted in result:', hasOptedIn);
    
    res.status(200).json({ hasOptedIn, assetId: targetAssetId });
  } catch (error) {
    console.error('Error checking opt-in status:', error);
    res.status(500).json({ error: 'Failed to check opt-in status', details: error.message });
  }
});

// Check if user has opted into USDC (without assetId)
router.get('/check-optin/:address', async (req, res) => {
  try {
    const accountInfo = await algodClient.accountInformation(req.params.address).do();
    const targetAssetId = getDefaultAssetId();
    const hasOptedIn = accountInfo.assets?.some(asset => asset['asset-id'] === targetAssetId) || false;
    res.status(200).json({ hasOptedIn, assetId: targetAssetId });
  } catch (error) {
    console.error('Error checking opt-in status:', error);
    res.status(500).json({ error: 'Failed to check opt-in status', details: error.message });
  }
});

// Generate opt-in transaction
router.post('/generate-optin', async (req, res) => {
  try {
    const { recipientAddress, assetId } = req.body;
    
    if (!recipientAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: recipientAddress,
      receiver: recipientAddress,
      closeRemainderTo: undefined,
      revocationTarget: undefined,
      amount: 0,
      note: undefined,
      assetIndex: assetId || getDefaultAssetId(),
      suggestedParams: suggestedParams
    });
    
    const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(optInTxn)).toString('base64');
    
    res.status(200).json({
      transaction: encodedTxn,
      txnId: optInTxn.txID()
    });
  } catch (error) {
    console.error('Error generating opt-in transaction:', error);
    res.status(500).json({ error: 'Failed to generate opt-in transaction', details: error.message });
  }
});

// Submit opt-in transaction
router.post('/submit-optin', async (req, res) => {
  try {
    const { signedTxn } = req.body;
    
    if (!signedTxn) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Submit the signed transaction
    const { txid } = await algodClient.sendRawTransaction(Buffer.from(signedTxn, 'base64')).do();
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txid, 5);
    
    res.status(200).json({ success: true, txid });
  } catch (error) {
    console.error('Error submitting opt-in transaction:', error);
    res.status(500).json({ error: 'Failed to submit opt-in transaction', details: error.message });
  }
});


// Asset balance endpoint (with assetId)
router.get('/asset-balance/:address/:assetId', async (req, res) => {
  try {
    const address = req.params.address;
    
    // Validate the Algorand address
    try {
      algosdk.decodeAddress(address);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid Algorand address format' });
    }
    
    // Query account info including assets
    const accountInfo = await algodClient.accountInformation(address).do();
    
    // Find asset among user's assets
    const targetAssetId = parseInt(req.params.assetId) || getDefaultAssetId();
    const assetInfo = getAssetInfo(targetAssetId);

    let assetBalance = '0.00';
    const assets = accountInfo.assets || [];

    for (const asset of assets) {
      if (Number(asset.assetId) === targetAssetId) {
        const microBalance = safeToNumber(asset.amount);
        assetBalance = fromMicroUnits(microBalance, targetAssetId).toFixed(assetInfo?.decimals || 2);
        break;
      }
    }
    
    // Return the balance
    res.status(200).json({
      address,
      assetId: targetAssetId,
      balance: assetBalance,
      assetInfo: assetInfo
    });
    
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    res.status(500).json({ error: 'Failed to fetch USDC balance', details: error.message });
  }
});

// Asset balance endpoint (without assetId)
router.get('/asset-balance/:address', async (req, res) => {
  try {
    const address = req.params.address;
    
    // Validate the Algorand address
    try {
      algosdk.decodeAddress(address);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid Algorand address format' });
    }
    
    // Query account info including assets
    const accountInfo = await algodClient.accountInformation(address).do();
    
    // Find asset among user's assets
    const targetAssetId = getDefaultAssetId();
    const assetInfo = getAssetInfo(targetAssetId);

    let assetBalance = '0.00';
    const assets = accountInfo.assets || [];

    for (const asset of assets) {
      if (asset['asset-id'] === targetAssetId) {
        const microBalance = safeToNumber(asset.amount);
        assetBalance = fromMicroUnits(microBalance, targetAssetId).toFixed(assetInfo?.decimals || 2);
        break;
      }
    }
    
    // Return the balance
    res.status(200).json({
      address,
      assetId: targetAssetId,
      balance: assetBalance,
      assetInfo: assetInfo
    });
    
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    res.status(500).json({ error: 'Failed to fetch USDC balance', details: error.message });
  }
});

// Check ALGO availability
router.get('/algo-availability/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const { payRecipientFees } = req.query;
    
    // Convert query parameter to boolean
    const shouldPayRecipientFees = payRecipientFees === 'true';
    
    // Use the utility function to check ALGO availability
    const availability = await checkAlgoAvailabilityForEscrow(
      algodClient, 
      address, 
      shouldPayRecipientFees
    );
    
    // Log debug information for monitoring
    console.log(`ALGO Availability Check for ${address}:`, {
      payRecipientFees: shouldPayRecipientFees,
      hasSufficientAlgo: availability.hasSufficientAlgo,
      shortfall: availability.shortfall,
      requiredForTransaction: availability.requiredForTransaction
    });
    
    res.status(200).json(availability);
    
  } catch (error) {
    console.error('Error checking ALGO availability:', error);
    
    // Return appropriate error based on type
    if (error.message.includes('Invalid Algorand address')) {
      return res.status(400).json({ 
        error: 'Invalid Algorand address format',
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to check ALGO availability', 
      details: error.message 
    });
  }
});

// Generate reclaim transaction
router.post('/generate-reclaim', async (req, res) => {
  try {
    const { appId, senderAddress } = req.body;
    
    if (!appId || !senderAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Verify the requester is the original sender
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrow = await escrowCollection.findOne({ 
      appId: parseInt(appId),
      senderAddress
    });
    
    if (!escrow) {
      return res.status(403).json({ 
        error: 'You are not authorized to reclaim these funds' 
      });
    }
    
    if (escrow.claimed) {
      return res.status(400).json({ 
        error: 'Funds have already been claimed and cannot be reclaimed' 
      });
    }
    
    if (escrow.reclaimed) {
      return res.status(400).json({ 
        error: 'Funds have already been reclaimed' 
      });
    }
    
    // Generate the reclaim transaction
    const txnData = await generateReclaimTransaction({
      appId: parseInt(appId),
      senderAddress,
      assetId: escrow.assetId
    });
    
    res.status(200).json(txnData);
  } catch (error) {
    console.error('Error generating reclaim transaction:', error);
    res.status(500).json({ 
      error: 'Failed to generate reclaim transaction', 
      details: error.message 
    });
  }
});

// Submit reclaim transaction
router.post('/submit-reclaim', async (req, res) => {
  try {
    const { signedTxn, appId, senderAddress } = req.body;
    
    if (!signedTxn || !appId || !senderAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Verify the requester is the original sender
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrow = await escrowCollection.findOne({ 
      appId: parseInt(appId),
      senderAddress
    });
    
    if (!escrow) {
      return res.status(403).json({ 
        error: 'You are not authorized to reclaim these funds' 
      });
    }
    
    if (escrow.claimed) {
      return res.status(400).json({ 
        error: 'Funds have already been claimed and cannot be reclaimed' 
      });
    }
    
    if (escrow.reclaimed) {
      return res.status(400).json({ 
        error: 'Funds have already been reclaimed' 
      });
    }
    
    // Submit the signed transaction
    try {
      const { txid } = await algodClient.sendRawTransaction(Buffer.from(signedTxn, 'base64')).do();
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txid, 5);
      
      // Update the escrow record
      await escrowCollection.updateOne(
        { _id: escrow._id },
        { 
          $set: { 
            reclaimed: true,
            reclaimedAt: new Date()
          } 
        }
      );
      
      // If the escrow had a recipient email, send notification about reclaim
      if (escrow.recipientEmail) {
        try {
          const assetInfo = getAssetInfo(escrow.assetId);
          const msg = {
            to: escrow.recipientEmail,
            from: process.env.FROM_EMAIL,
            subject: `${assetInfo?.symbol || 'Token'} Transfer Cancelled`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>${assetInfo?.symbol || 'Token'} Transfer Cancelled</h2>
                <p>We're writing to let you know that the ${escrow.amount} ${assetInfo?.symbol || 'tokens'} transfer that was sent to you has been cancelled by the sender and is no longer available to claim.</p>
                <p>If you believe this is a mistake, please contact the sender directly.</p>
              </div>
            `
          };
          
          await sgMail.send(msg);
        } catch (emailError) {
          console.error('Error sending reclaim notification email:', emailError);
          // Continue processing even if email fails
        }
      }
      
      const assetInfo = getAssetInfo(escrow.assetId);
      res.status(200).json({
        success: true,
        amount: escrow.amount,
        message: `Successfully reclaimed ${escrow.amount} ${assetInfo?.symbol || 'tokens'}`
      });
    } catch (error) {
      console.error('Error submitting reclaim transaction:', error);
      
      // Check if this is an app rejection
      if (error.message.includes('rejected')) {
        return res.status(400).json({
          success: false,
          error: 'Reclaim rejected by the smart contract. The funds may have already been claimed or reclaimed.'
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error reclaiming USDC:', error);
    res.status(500).json({ 
      error: 'Failed to reclaim USDC', 
      details: error.message 
    });
  }
});

// Get supported assets
router.get('/supported-assets', async (req, res) => {
  try {
    const { getSupportedAssets } = require('../assetConfig');
    const assets = getSupportedAssets();
    res.status(200).json({ assets });
  } catch (error) {
    console.error('Error fetching supported assets:', error);
    res.status(500).json({ error: 'Failed to fetch supported assets' });
  }
});


module.exports = router;
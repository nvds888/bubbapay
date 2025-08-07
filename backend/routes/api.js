// routes/api.js - Complete Updated Implementation with Corrected Fee Flow

const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto'); // Add crypto for hashing
const { 
  generateUnsignedDeployTransactions, 
  generatePostAppTransactions,
  generateClaimTransaction,
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

// Temporary debugging - add at the very top of api.js
const originalRoute = require('express').Router().route;
require('express').Router.prototype.route = function(path) {
  console.log('Registering route:', path);
  if (path.includes('?')) {
    console.error('❌ PROBLEMATIC ROUTE FOUND:', path);
  }
  return originalRoute.call(this, path);
};

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

// Submit signed app creation transaction
router.post('/submit-app-creation', async (req, res) => {
  try {
    const { signedTxn, tempAccount, amount, microAmount, recipientEmail, senderAddress, payRecipientFees, assetId } = req.body;
    
    if (!signedTxn || !tempAccount || !amount || !senderAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let txId;
    let txnResult;

    try {
      // Wait for confirmation
      txnResult = await algosdk.waitForConfirmation(algodClient, txId, 5);
      ;
      
      // Extract app ID from transaction result
      const appId = txnResult['application-index']
      
      if (!appId) {
        throw new Error('Application ID not found in transaction result');
      }

    } catch (submitError) {
      console.error('submitError details:', submitError);
      // Check if this is a "transaction already in ledger" error
      if (submitError.message && submitError.message.includes('transaction already in ledger')) {
        console.log('Transaction already in ledger, extracting txId and confirming...');
        
        // Extract transaction ID from error message
        const txIdMatch = submitError.message.match(/transaction already in ledger: ([A-Z0-9]+)/);
        if (txIdMatch && txIdMatch[1]) {
          txId = txIdMatch[1];
          console.log(`Extracted txId from error: ${txId}`);
          
          // Wait for confirmation of the existing transaction
          try {
            txnResult = await algosdk.waitForConfirmation(algodClient, txId, 5);
            console.log('Successfully confirmed existing transaction');
          } catch (confirmError) {
            console.error('Error confirming existing transaction:', confirmError);
            throw new Error('Transaction was submitted but confirmation failed');
          }
        } else {
          throw new Error('Could not extract transaction ID from duplicate submission error');
        }
      } else {
        // Re-throw other errors
        throw submitError;
      }
    }

    // Extract app ID from transaction result
    const appId = txnResult['application-index'];
    
    if (!appId) {
      throw new Error('Application ID not found in transaction result');
    }

    // Generate the second group of transactions
    const postAppTxns = await generatePostAppTransactions({
      appId,
      senderAddress,
      microAmount: microAmount,
      tempAccount,
      payRecipientFees,
      assetId: assetId || getDefaultAssetId()
    });
    
    res.status(200).json({
      appId,
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
      appId: parseInt(appId),
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
    const hasOptedIn = accountInfo.assets?.some(asset => asset['asset-id'] === targetAssetId) || false;
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

// Generate claim transaction - SIMPLIFIED (no transferFees parameter)
router.post('/generate-claim', async (req, res) => {
  try {
    const { tempPrivateKey, appId, recipientAddress } = req.body;
    
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
    
    // Generate claim transaction group (with temp account closure)
    const txnData = await generateClaimTransaction({
      appId: parseInt(appId),
      tempPrivateKey,
      recipientAddress,
      assetId: escrow.assetId
    });
    
    res.status(200).json(txnData);
  } catch (error) {
    console.error('Error generating claim transaction:', error);
    res.status(500).json({ error: 'Failed to generate claim transaction', details: error.message });
  }
});

// Claim USDC - SIMPLIFIED (only single transaction support)
router.post('/claim-usdc', async (req, res) => {
  try {
    const { signedTransactions, appId, recipientAddress, tempPrivateKey } = req.body;
    
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
            claimedBy: recipientAddress
          } 
        }
      );
      
      const assetInfo = getAssetInfo(escrow.assetId);
      let message = `Successfully claimed ${escrow.amount} ${assetInfo?.symbol || 'tokens'}`;
      if (escrow.payRecipientFees) {
        message += '. Fee coverage was provided for all transactions.';
      }
      
      res.status(200).json({
        success: true,
        amount: escrow.amount,
        feeCoverageProvided: escrow.payRecipientFees,
        message
      });
    } catch (error) {
      console.error('Error submitting claim transaction:', error);
      
      // Check if this is an app rejection (e.g., already claimed)
      if (error.message.includes('rejected')) {
        return res.status(400).json({
          success: false,
          error: 'Claim rejected by the smart contract. The funds may have already been claimed.'
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error claiming USDC:', error);
    res.status(500).json({ error: 'Failed to claim USDC', details: error.message });
  }
});

// Fund wallet - CORRECTED to use temp account instead of funder account
router.post('/fund-wallet', async (req, res) => {
  try {
    const { recipientAddress, appId, tempPrivateKey } = req.body;
    
    if (!recipientAddress || !appId || !tempPrivateKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // SECURITY: Use hash-based lookup for escrow validation
    const claimHash = hashPrivateKey(tempPrivateKey, appId);
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrow = await escrowCollection.findOne({ 
      claimHash: claimHash,
      appId: parseInt(appId)
    });
    
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }
    
    // FIXED: If already funded, return success instead of error
    if (escrow.funded) {
      return res.status(200).json({
        success: true,
        fundingAmount: 0,
        message: 'Wallet funding was already provided for this escrow',
        alreadyFunded: true
      });
    }
    
    // Validate the recipient address
    try {
      algosdk.decodeAddress(recipientAddress);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid Algorand address format' });
    }
    
    // Only proceed if this escrow is set to pay recipient fees
    if (!escrow.payRecipientFees) {
      return res.status(200).json({
        success: true,
        fundingAmount: 0,
        message: 'No funding needed for this escrow'
      });
    }
    
    // Reconstruct temporary account from private key
    const secretKeyUint8 = new Uint8Array(Buffer.from(tempPrivateKey, 'hex'));
    const publicKey = secretKeyUint8.slice(32, 64);
    const tempAddress = algosdk.encodeAddress(publicKey);
    
    const tempAccountObj = {
      addr: tempAddress,
      sk: secretKeyUint8
    };
    
    console.log(`Funding wallet ${recipientAddress} from temp account ${tempAddress}`);
    
    // Check temp account balance first
    const tempAccountInfo = await algodClient.accountInformation(tempAccountObj.addr).do();
    const tempBalance = safeToNumber(tempAccountInfo.amount);
    
    console.log(`Temp account balance: ${tempBalance / 1e6} ALGO`);
    
    // Calculate how much to send (reserve some for minimum balance and the funding transaction fee)
    const fundingTransactionFee = 1000; // 0.001 ALGO for the funding transaction
    const minimumTempBalance = 100000; // 0.1 ALGO minimum for temp account
    const claimTransactionReserve = 2000; // 0.002 ALGO reserve for claim transaction
    
    const maxTransferAmount = tempBalance - fundingTransactionFee - minimumTempBalance - claimTransactionReserve;
    
    // The target funding amount is 0.21 ALGO, but we'll send what's available up to that amount
    const targetFundingAmount = 210000; 
    const actualFundingAmount = Math.min(maxTransferAmount, targetFundingAmount);
    
    console.log(`Calculated funding amount: ${actualFundingAmount / 1e6} ALGO`);
    
    if (actualFundingAmount <= 0) {
      return res.status(400).json({ 
        error: 'Insufficient balance in temp account for funding',
        details: `Temp balance: ${tempBalance / 1e6} ALGO, but need reserves for transactions`
      });
    }
    
    // Get suggested parameters for the transaction
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create and sign the funding transaction FROM temp account TO recipient
    const fundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: tempAccountObj.addr,
      receiver: recipientAddress,
      amount: actualFundingAmount,
      note: new Uint8Array(Buffer.from('AlgoSend fee coverage')),
      suggestedParams: {
        ...suggestedParams,
        fee: fundingTransactionFee,
        flatFee: true
      }
    });
    
    // Sign with temp account
    const signedTxn = algosdk.signTransaction(fundingTxn, tempAccountObj.sk);
    
    // Submit the transaction
    const { txid } = await algodClient.sendRawTransaction(signedTxn.blob).do();
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txid, 5);
    
    // Mark escrow as funded
    await escrowCollection.updateOne(
      { _id: escrow._id },
      { $set: { funded: true, fundedAt: new Date() } }
    );
    
    console.log(`Successfully funded wallet with ${actualFundingAmount / 1e6} ALGO`);
    
    res.status(200).json({
      success: true,
      txId,
      fundingAmount: actualFundingAmount / 1e6, // Convert to ALGO for display
      message: `Wallet funded with ${(actualFundingAmount / 1e6).toFixed(3)} ALGO for transaction fees`
    });
    
  } catch (error) {
    console.error('Error funding wallet:', error);
    res.status(500).json({ error: 'Failed to fund wallet', details: error.message });
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

/**
 * POST /api/cleanup-contract
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
      
      if (appInfo.params && appInfo.params['global-state']) {
        for (const kv of appInfo.params['global-state']) {
          const key = Buffer.from(kv.key, 'base64').toString();
          
          if (key === 'claimed' && kv.value.uint === 1) {
            isCompleted = true;
          }
          
          if (key === 'creator') {
            const creatorAddress = algosdk.encodeAddress(Buffer.from(kv.value.bytes, 'base64'));
            isCreator = (creatorAddress === senderAddress);
          }
        }
      }
      
      if (!isCreator) {
        return res.status(403).json({
          success: false,
          error: 'Only the contract creator can clean up this contract'
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
 * Generate cleanup transaction group for a completed contract
 */
async function generateCleanupTransaction({ appId, senderAddress, assetId = null }) {
  try {
    const appIdInt = parseInt(appId);
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // ✅ Just pass the common assets - TEAL will figure out which ones to opt out of
    const commonAssets = [31566704, 760037151, 2494786278, 2726252423]; // USDC, xUSD, MONKO, ALPHA
    
    const deleteAppTxn = algosdk.makeApplicationCallTxnWithSuggestedParamsFromObject({
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
 * POST /api/submit-cleanup
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

// Helper function for waiting for confirmation (if not already present)
async function waitForConfirmation(client, txId, timeout) {
  let response = await client.status().do();
  let lastRound = response['last-round'];
  
  while (true) {
    const pendingInfo = await client.pendingTransactionInformation(txId).do();
    
    if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
      return pendingInfo;
    }
    
    lastRound++;
    await client.statusAfterBlock(lastRound).do();
    
    timeout--;
    if (timeout <= 0) {
      throw new Error('Transaction confirmation timeout');
    }
  }
}

module.exports = router;
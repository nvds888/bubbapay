// mcpapi.js - Improved MCP-specific API routes with unified database approach
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');
const { 
  generateUnsignedDeployTransactions, 
  generatePostAppTransactions,
  generateReclaimTransaction
} = require('../atomic-deploy-email-escrow');
const algosdk = require('algosdk');

// Initialize Algorand client
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = process.env.ALGOD_PORT || '';
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// USDC Asset ID
const USDC_ASSET_ID = parseInt(process.env.USDC_ASSET_ID) || 10458941;

// Helper function to hash private keys securely (same as main API)
function hashPrivateKey(privateKey, appId) {
  const hash = crypto.createHash('sha256');
  hash.update(privateKey + appId.toString());
  return hash.digest('hex');
}

// Helper function to validate user address
function validateAddress(address) {
  try {
    algosdk.decodeAddress(address);
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to create consistent escrow records
function createEscrowRecord({
  appId = null,
  appAddress = null,
  recipientEmail,
  isShareable,
  authorizedClaimer = null,
  tempPrivateKey = null,
  amount,
  senderAddress,
  payRecipientFees,
  status = 'pending_wallet_connection',
  tempAccount = null,
  deployTransaction = null
}) {
  const record = {
    appId: appId ? parseInt(appId) : null,
    appAddress,
    network: 'testnet',
    assetId: USDC_ASSET_ID,
    recipientEmail: recipientEmail || null,
    isShareable: !!isShareable,
    authorizedClaimer,
    amount: parseFloat(amount),
    createdAt: new Date(),
    claimed: false,
    funded: false,
    senderAddress,
    payRecipientFees: !!payRecipientFees,
    createdVia: 'mcp',
    status, // pending_wallet_connection, ready_to_sign, app_created, completed
    tempAccount,
    deployTransaction
  };

  // Add claimHash if we have the private key and appId
  if (tempPrivateKey && appId) {
    record.claimHash = hashPrivateKey(tempPrivateKey, appId);
  }

  return record;
}

// MCP: Create USDC Escrow - Simplified database approach
router.post('/create-escrow', async (req, res) => {
  try {
    const { 
      userAddress, 
      amount, 
      recipientEmail, 
      coverRecipientFees = true,
      shareable = false,
      description = ''
    } = req.body;

    console.log('MCP Escrow Request:', {
      userAddress: userAddress || 'NOT_PROVIDED',
      amount,
      recipientEmail: recipientEmail ? 'PROVIDED' : 'NONE',
      coverRecipientFees,
      shareable
    });

    // Validation
    if (userAddress && !validateAddress(userAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user address format',
        code: 'INVALID_ADDRESS'
      });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Must be a positive number',
        code: 'INVALID_AMOUNT'
      });
    }

    if (!shareable && !recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Must provide recipient email or set shareable to true',
        code: 'MISSING_RECIPIENT'
      });
    }

    // Generate deployment transaction if userAddress provided
    let deployTxnData = null;
    let status = 'pending_wallet_connection';
    
    if (userAddress) {
      deployTxnData = await generateUnsignedDeployTransactions({
        usdcAmount: amount,
        recipientEmail: shareable ? null : recipientEmail,
        senderAddress: userAddress
      });
      status = 'ready_to_sign';
    }

    // Create escrow record in database immediately
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrowRecord = createEscrowRecord({
      recipientEmail: shareable ? null : recipientEmail,
      isShareable: shareable,
      authorizedClaimer: deployTxnData?.tempAccount?.address || null,
      tempPrivateKey: deployTxnData?.tempAccount?.privateKey || null,
      amount,
      senderAddress: userAddress || null,
      payRecipientFees: coverRecipientFees,
      status,
      tempAccount: deployTxnData?.tempAccount || null,
      deployTransaction: deployTxnData?.transaction || null
    });

    const result = await escrowCollection.insertOne(escrowRecord);
    const escrowId = result.insertedId.toString();

    // Return sanitized data for AI
    const sanitizedResponse = {
      success: true,
      action: 'escrow_created',
      escrowId,
      signingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/send?escrow_id=${escrowId}`,
      details: {
        amount: amount,
        recipient: shareable ? 'shareable_link' : recipientEmail,
        feesCovered: coverRecipientFees,
        transactionSteps: 2,
        status: status
      },
      userMessage: `I've prepared your ${amount} USDC escrow${shareable ? ' with shareable link' : ` for ${recipientEmail}`}. Please click the secure link above to ${userAddress ? 'sign the transactions' : 'connect your wallet and sign'}.`,
      instructions: userAddress ? [
        'Click the signing link to open AlgoSend',
        'Review the transaction details',
        'Sign 2 transactions (deployment + funding)',
        'Get your claim link to share'
      ] : [
        'Click the signing link to open AlgoSend',
        'Connect your Pera Wallet',
        'Sign 2 transactions (deployment + funding)',
        'Get your claim link to share'
      ]
    };

    res.json(sanitizedResponse);

  } catch (error) {
    console.error('MCP Escrow Creation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create escrow session',
      code: 'ESCROW_CREATION_FAILED',
      details: error.message
    });
  }
});

// MCP: Update escrow with wallet address (replaces session update)
router.post('/connect-wallet/:escrowId', async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { userAddress } = req.body;

    if (!ObjectId.isValid(escrowId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid escrow ID format'
      });
    }

    if (!validateAddress(userAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user address format'
      });
    }

    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    // Find the pending escrow
    const escrow = await escrowCollection.findOne({ 
      _id: new ObjectId(escrowId),
      status: 'pending_wallet_connection',
      createdVia: 'mcp'
    });

    if (!escrow) {
      return res.status(404).json({
        success: false,
        error: 'Escrow not found or wallet already connected'
      });
    }

    console.log('DEBUG - Amount type:', typeof amount);
console.log('DEBUG - Amount value:', amount);
console.log('DEBUG - Amount parsed:', parseFloat(amount));
console.log('DEBUG - Is NaN?:', isNaN(parseFloat(amount)));

    // Generate deployment transaction now that we have address
    const deployTxnData = await generateUnsignedDeployTransactions({
      usdcAmount: escrow.amount,
      recipientEmail: escrow.recipientEmail,
      senderAddress: userAddress
    });

    // Update escrow with wallet info and transaction data
    await escrowCollection.updateOne(
      { _id: new ObjectId(escrowId) },
      { 
        $set: { 
          senderAddress: userAddress,
          authorizedClaimer: deployTxnData.tempAccount.address,
          tempAccount: deployTxnData.tempAccount,
          deployTransaction: deployTxnData.transaction,
          status: 'ready_to_sign',
          walletConnectedAt: new Date()
        } 
      }
    );

    res.json({
      success: true,
      escrowId,
      status: 'ready_to_sign',
      message: 'Wallet connected successfully. Ready to sign transactions.'
    });

  } catch (error) {
    console.error('Error connecting wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect wallet',
      details: error.message
    });
  }
});

// MCP: Get escrow details for the web interface (replaces signing-session)
router.get('/escrow/:escrowId', async (req, res) => {
  try {
    const { escrowId } = req.params;

    if (!ObjectId.isValid(escrowId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid escrow ID format'
      });
    }

    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrow = await escrowCollection.findOne({ 
      _id: new ObjectId(escrowId),
      createdVia: 'mcp'
    });

    if (!escrow) {
      return res.status(404).json({
        success: false,
        error: 'Escrow not found',
        code: 'ESCROW_NOT_FOUND'
      });
    }

    // Return escrow data for the web interface
    res.json({
      success: true,
      escrow: {
        id: escrow._id.toString(),
        userAddress: escrow.senderAddress,
        amount: escrow.amount,
        recipientEmail: escrow.recipientEmail,
        shareable: escrow.isShareable,
        coverRecipientFees: escrow.payRecipientFees,
        status: escrow.status,
        deployTransaction: escrow.deployTransaction,
        tempAccount: escrow.tempAccount,
        createdAt: escrow.createdAt,
        appId: escrow.appId,
        appAddress: escrow.appAddress
      }
    });

  } catch (error) {
    console.error('Error fetching escrow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch escrow',
      details: error.message
    });
  }
});

// MCP: Submit deployment transaction (reuses main API logic)
router.post('/submit-deployment/:escrowId', async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { signedTxn } = req.body;

    if (!ObjectId.isValid(escrowId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid escrow ID format'
      });
    }

    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrow = await escrowCollection.findOne({ 
      _id: new ObjectId(escrowId),
      createdVia: 'mcp',
      status: { $in: ['ready_to_sign', 'app_created'] }
    });

    if (!escrow) {
      return res.status(404).json({
        success: false,
        error: 'Escrow not found or not ready for signing'
      });
    }

    // Prevent duplicate processing
    if (escrow.appId) {
      console.log(`Escrow ${escrowId} already has app ID ${escrow.appId}, returning existing data`);
      return res.json({
        success: true,
        appId: escrow.appId,
        appAddress: escrow.appAddress,
        status: 'app_created'
      });
    }

    // Submit the deployment transaction
    let txId, txnResult, appId;
    
    try {
      const { txId: submittedTxId } = await algodClient.sendRawTransaction(Buffer.from(signedTxn, 'base64')).do();
      txId = submittedTxId;
      txnResult = await algosdk.waitForConfirmation(algodClient, txId, 5);
      appId = txnResult['application-index'];
    } catch (submitError) {
      // Check if transaction was already submitted
      if (submitError.message.includes('already in ledger')) {
        console.log('Transaction already in ledger, attempting to find app ID...');
        
        const decodedTxn = algosdk.decodeSignedTransaction(Buffer.from(signedTxn, 'base64'));
        txId = decodedTxn.txn.txID();
        
        txnResult = await algosdk.waitForConfirmation(algodClient, txId, 5);
        appId = txnResult['application-index'];
        
        console.log(`Found existing app ID: ${appId}`);
      } else {
        throw submitError;
      }
    }

    // Generate post-app transactions
    const postAppTxns = await generatePostAppTransactions({
      appId,
      senderAddress: escrow.senderAddress,
      microUSDCAmount: escrow.amount * 1e6,
      tempAccount: escrow.tempAccount,
      payRecipientFees: escrow.payRecipientFees
    });

    // Generate claimHash now that we have appId
    const claimHash = hashPrivateKey(escrow.tempAccount.privateKey, appId);

    // Update escrow with app details
    await escrowCollection.updateOne(
      { _id: new ObjectId(escrowId) },
      { 
        $set: { 
          appId: parseInt(appId),
          appAddress: postAppTxns.appAddress,
          claimHash: claimHash,
          status: 'app_created',
          deployedAt: new Date()
        } 
      }
    );

    res.json({
      success: true,
      appId,
      appAddress: postAppTxns.appAddress,
      groupTransactions: postAppTxns.groupTransactions,
      status: 'app_created'
    });

  } catch (error) {
    console.error('Error submitting deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit deployment transaction',
      details: error.message
    });
  }
});

// MCP: Submit funding transactions (final step)
router.post('/submit-funding/:escrowId', async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { signedTxns } = req.body;

    if (!ObjectId.isValid(escrowId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid escrow ID format'
      });
    }

    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrow = await escrowCollection.findOne({ 
      _id: new ObjectId(escrowId),
      createdVia: 'mcp',
      status: 'app_created'
    });

    if (!escrow || !escrow.appId) {
      return res.status(404).json({
        success: false,
        error: 'Escrow not found or not ready for funding'
      });
    }

    // Submit group transactions
    const { txId } = await algodClient.sendRawTransaction(
      signedTxns.map(txn => Buffer.from(txn, 'base64'))
    ).do();

    await algosdk.waitForConfirmation(algodClient, txId, 5);

    // Generate claim URL
    const claimUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/claim?app=${escrow.appId}#key=${escrow.tempAccount.privateKey}`;

    // Update escrow to completed status
    await escrowCollection.updateOne(
      { _id: new ObjectId(escrowId) },
      { 
        $set: { 
          status: 'completed',
          fundedAt: new Date()
        } 
      }
    );

    // Send email if recipient email provided
    if (escrow.recipientEmail && !escrow.isShareable) {
      try {
        const sgMail = require('@sendgrid/mail');
        const msg = {
          to: escrow.recipientEmail,
          from: process.env.FROM_EMAIL,
          subject: `You've received ${escrow.amount} USDC via AlgoSend!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You've received ${escrow.amount} USDC!</h2>
              <p>Someone has sent you ${escrow.amount} USDC using AlgoSend. Click the button below to claim your funds:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${claimUrl}" 
                   style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                   Claim Your USDC
                </a>
              </div>
              <p>This link will expire once the funds are claimed.</p>
            </div>
          `
        };
        
        await sgMail.send(msg);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue processing even if email fails
      }
    }

    // Return success (AI-friendly response)
    res.json({
      success: true,
      escrowId,
      amount: escrow.amount,
      recipient: escrow.isShareable ? 'shareable_link' : escrow.recipientEmail,
      claimUrl: escrow.isShareable ? claimUrl : undefined, // Only include for shareable links
      emailSent: !!escrow.recipientEmail && !escrow.isShareable,
      message: `Successfully created ${escrow.amount} USDC escrow${escrow.isShareable ? ' with shareable link' : ` for ${escrow.recipientEmail}`}`
    });

  } catch (error) {
    console.error('Error submitting funding transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete escrow creation',
      details: error.message
    });
  }
});

// MCP: Get User Escrows (sanitized for AI)
router.get('/user-escrows/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { status = 'all' } = req.query;

    if (!validateAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    let query = { senderAddress: address };
    
    // Add status filter
    if (status !== 'all') {
      switch (status) {
        case 'active':
          query.claimed = false;
          query.reclaimed = { $ne: true };
          query.status = 'completed';
          break;
        case 'claimed':
          query.claimed = true;
          break;
        case 'reclaimed':
          query.reclaimed = true;
          break;
        case 'pending':
          query.status = { $in: ['pending_wallet_connection', 'ready_to_sign', 'app_created'] };
          break;
      }
    }

    const escrows = await escrowCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    // Sanitize escrows for AI consumption (remove sensitive data)
    const sanitizedEscrows = escrows.map(escrow => ({
      id: escrow._id.toString(),
      appId: escrow.appId,
      amount: escrow.amount,
      recipientEmail: escrow.recipientEmail,
      isShareable: escrow.isShareable,
      status: escrow.claimed ? 'claimed' : escrow.reclaimed ? 'reclaimed' : escrow.status === 'completed' ? 'active' : escrow.status,
      createdAt: escrow.createdAt,
      claimedAt: escrow.claimedAt,
      claimedBy: escrow.claimedBy,
      payRecipientFees: escrow.payRecipientFees,
      createdVia: escrow.createdVia || 'web'
    }));

    res.json({
      success: true,
      escrows: sanitizedEscrows,
      total: sanitizedEscrows.length,
      summary: {
        active: sanitizedEscrows.filter(e => e.status === 'active').length,
        claimed: sanitizedEscrows.filter(e => e.status === 'claimed').length,
        reclaimed: sanitizedEscrows.filter(e => e.status === 'reclaimed').length,
        pending: sanitizedEscrows.filter(e => ['pending_wallet_connection', 'ready_to_sign', 'app_created'].includes(e.status)).length
      }
    });

  } catch (error) {
    console.error('Error fetching user escrows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user escrows',
      details: error.message
    });
  }
});

// MCP: Create Reclaim Transaction (reuses main API pattern)
router.post('/create-reclaim', async (req, res) => {
  try {
    const { userAddress, appId } = req.body;

    if (!validateAddress(userAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user address'
      });
    }

    if (!appId || isNaN(parseInt(appId))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid app ID'
      });
    }

    // Verify ownership and eligibility
    const db = req.app.locals.db;
    const escrowCollection = db.collection('escrows');
    
    const escrow = await escrowCollection.findOne({ 
      appId: parseInt(appId),
      senderAddress: userAddress
    });

    if (!escrow) {
      return res.status(403).json({
        success: false,
        error: 'Escrow not found or you are not the creator',
        code: 'UNAUTHORIZED'
      });
    }

    if (escrow.claimed) {
      return res.status(400).json({
        success: false,
        error: 'Funds have already been claimed',
        code: 'ALREADY_CLAIMED'
      });
    }

    if (escrow.reclaimed) {
      return res.status(400).json({
        success: false,
        error: 'Funds have already been reclaimed',
        code: 'ALREADY_RECLAIMED'
      });
    }

    // Generate reclaim transaction
    const reclaimTxnData = await generateReclaimTransaction({
      appId: parseInt(appId),
      senderAddress: userAddress
    });

    // Create a pending reclaim escrow record
    const reclaimEscrow = {
      type: 'reclaim',
      originalAppId: parseInt(appId),
      userAddress,
      amount: escrow.amount,
      recipientEmail: escrow.recipientEmail,
      reclaimTransaction: reclaimTxnData.transaction,
      createdAt: new Date(),
      status: 'ready_to_reclaim',
      createdVia: 'mcp'
    };

    const result = await escrowCollection.insertOne(reclaimEscrow);
    const reclaimEscrowId = result.insertedId.toString();

    res.json({
      success: true,
      action: 'reclaim_prepared',
      reclaimEscrowId,
      signingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/send?reclaim_id=${reclaimEscrowId}`,
      details: {
        amount: escrow.amount,
        recipient: escrow.recipientEmail || 'shareable_link',
        transactionSteps: 1
      },
      userMessage: `I've prepared the reclaim transaction for your ${escrow.amount} USDC escrow. Click the link above to sign and reclaim your funds.`,
      instructions: [
        'Click the signing link to open AlgoSend',
        'Review the reclaim transaction',
        'Sign the transaction with your wallet',
        'Your USDC will be returned to your wallet'
      ]
    });

  } catch (error) {
    console.error('Error creating reclaim transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create reclaim transaction',
      details: error.message
    });
  }
});

// MCP: Health Check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'AlgoSend MCP API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    storageType: 'database',
    features: ['unified_schema', 'no_sessions', 'ai_optimized']
  });
});

module.exports = router;
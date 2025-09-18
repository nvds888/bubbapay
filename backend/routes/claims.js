// routes/claims.js

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const algosdk = require('algosdk');
const { getDefaultAssetId, getAssetInfo } = require('../assetConfig');

// Initialize Algorand client
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://mainnet-api.algonode.cloud';
const ALGOD_PORT = process.env.ALGOD_PORT || '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Helper function to get referrer for transaction creator
async function getTransactionCreatorReferrer(db, transactionCreatorAddress) {
  const referralLinksCollection = db.collection('referralLinks');
  
  try {
    const referralLink = await referralLinksCollection.findOne({ 
      referralAddress: transactionCreatorAddress 
    });
    
    return referralLink ? referralLink.referrerAddress : null;
  } catch (error) {
    console.error('Error getting transaction creator referrer:', error);
    return null;
  }
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
    
    // Hash the private key to look up the escrow
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

    // Transaction 2: Close temp account and send remaining balance to platform or referrer
    const referrerAddress = await getTransactionCreatorReferrer(db, escrow.senderAddress);
    const closeToAddress = referrerAddress || (process.env.PLATFORM_ADDRESS || 'REPLACE_WITH_YOUR_PLATFORM_ADDRESS');

    const closeAccountTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: tempAccountObj.addr,
      receiver: closeToAddress,
      amount: 0,
      closeRemainderTo: closeToAddress,
      note: new Uint8Array(Buffer.from(referrerAddress ? 'BubbaPay referral fee' : 'BubbaPay platform fee')),
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
    
    // Hash the private key to look up the escrow
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
    
    // Build transaction group
    const transactions = [];

    // Transaction 1: Claim fee coverage from app (if applicable)
    if (escrow.payRecipientFees) {
      const claimFeeCoverageTxn = algosdk.makeApplicationCallTxnFromObject({
        sender: tempAccountObj.addr,
        appIndex: parseInt(appId),
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [new Uint8Array(Buffer.from("claim_fee_coverage"))],
        accounts: [recipientAddress],
        suggestedParams: { ...suggestedParams, fee: 2000, flatFee: true }
      });
      transactions.push(claimFeeCoverageTxn);
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
    
    // Transaction 4: Close temp account and send remaining balance to platform or referrer
    const referrerAddress = await getTransactionCreatorReferrer(db, escrow.senderAddress);
    const closeToAddress = referrerAddress || (process.env.PLATFORM_ADDRESS || 'REPLACE_WITH_YOUR_PLATFORM_ADDRESS');

    const closeAccountTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: tempAccountObj.addr,
      receiver: closeToAddress,
      amount: 0,
      closeRemainderTo: closeToAddress,
      note: new Uint8Array(Buffer.from(referrerAddress ? 'BubbaPay referral fee' : 'BubbaPay platform fee')),
      suggestedParams: { ...suggestedParams, fee: 1000, flatFee: true }
    });
    transactions.push(closeAccountTxn);
    
    // Group all transactions
    algosdk.assignGroupID(transactions);
    
    // Sign transactions that the temp account is responsible for 
    const signedTransactions = [];
    let userTxnIndex = -1;

    let currentIndex = 0;

    // Transaction 1: Claim fee coverage (temp account) - if applicable
    if (escrow.payRecipientFees) {
      const signedTxn = algosdk.signTransaction(transactions[currentIndex], tempAccountObj.sk);
      signedTransactions.push(Buffer.from(signedTxn.blob).toString('base64'));
      currentIndex++;
    }

    // Transaction 2: User opt-in (user account) 
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
    
    // Hash the private key to look up the escrow
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
            claimType: type 
          } 
        }
      );

      // Record referral earnings if there's a referrer
      const referrerAddress = await getTransactionCreatorReferrer(db, escrow.senderAddress);
      if (referrerAddress) {
        const referralEarning = 0.105; // Full platform fee goes to referrer
        
        try {
          // Record the earning and claim count directly in database
          const referralsCollection = db.collection('referrals');
          const referralLinksCollection = db.collection('referralLinks');
          
          await referralsCollection.updateOne(
            { referrerAddress: referrerAddress },
            { 
              $inc: { 
                totalEarnings: referralEarning,
                totalClaims: 1 
              } 
            }
          );
          
          // Update specific referral link earnings and claims
          await referralLinksCollection.updateOne(
            { referrerAddress: referrerAddress, referralAddress: escrow.senderAddress },
            { 
              $inc: { 
                totalEarningsGenerated: referralEarning,
                totalClaims: 1
              } 
            }
          );
          
          console.log(`Recorded ${referralEarning} ALGO referral earning and 1 claim for ${referrerAddress} from transaction by ${escrow.senderAddress}`);
        } catch (earningError) {
          console.error('Error recording referral earnings:', earningError);
          // Continue processing even if earnings recording fails
        }
      }
      
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
    res.status(500).json({ error: 'Insufficient Algo to opt-in to asset', details: error.message });
  }
});

module.exports = router;
// routes/assets.js

const express = require('express');
const router = express.Router();
const algosdk = require('algosdk');
const { getDefaultAssetId, getAssetInfo, fromMicroUnits } = require('../assetConfig');

// Initialize Algorand client
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://mainnet-api.algonode.cloud';
const ALGOD_PORT = process.env.ALGOD_PORT || '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

function safeToNumber(value) {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'number') {
    return value;
  }
  return value; 
}

// Asset balance endpoint (with assetId)
router.get('/balance/:address/:assetId', async (req, res) => {
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

    let assetBalance = '0';
    const assets = accountInfo.assets || [];

    for (const asset of assets) {
      // Check both possible property names for asset ID
      const assetId = Number(asset.assetId) || Number(asset['asset-id']);
      if (assetId === targetAssetId) {
        const microBalance = safeToNumber(asset.amount);
        const rawBalance = fromMicroUnits(microBalance, targetAssetId);
        const minAmount = assetInfo?.minAmount || 0.01;
        const step = assetInfo?.step || 0.01;

        // Calculate max sendable balance (not display balance)
        let maxSendable;
        if (minAmount < 0.01) {
          // High precision assets - use full balance
          maxSendable = rawBalance;
        } else {
          // Standard assets - calculate max sendable (rounded down to step)
          maxSendable = Math.floor(rawBalance / step) * step;
          
          // Fix floating point precision
          const stepDecimals = step.toString().split('.')[1]?.length || 0;
          maxSendable = parseFloat(maxSendable.toFixed(stepDecimals));
        }

        assetBalance = maxSendable.toString();
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
    console.error('Error fetching asset balance:', error);
    res.status(500).json({ error: 'Failed to fetch asset balance', details: error.message });
  }
});

// Asset balance endpoint (without assetId - uses default)
router.get('/balance/:address', async (req, res) => {
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

    let assetBalance = '0';
    const assets = accountInfo.assets || [];

    for (const asset of assets) {
      const assetId = Number(asset.assetId) || Number(asset['asset-id']);
      if (assetId === targetAssetId) {
        const microBalance = safeToNumber(asset.amount);
        const rawBalance = fromMicroUnits(microBalance, targetAssetId);
        const minAmount = assetInfo?.minAmount || 0.01;
        const step = assetInfo?.step || 0.01;

        // Calculate max sendable balance (same logic as first endpoint)
        let maxSendable;
        if (minAmount < 0.01) {
          maxSendable = rawBalance;
        } else {
          maxSendable = Math.floor(rawBalance / step) * step;
          const stepDecimals = step.toString().split('.')[1]?.length || 0;
          maxSendable = parseFloat(maxSendable.toFixed(stepDecimals));
        }

        assetBalance = maxSendable.toString();
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
    console.error('Error fetching asset balance:', error);
    res.status(500).json({ error: 'Failed to fetch asset balance', details: error.message });
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

module.exports = router;
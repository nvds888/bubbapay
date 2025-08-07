// atomic-deploy-email-escrow-v3.js - Fixed for algosdk v3 compatibility

const algosdk = require('algosdk');
const crypto = require('crypto');
const { createApprovalProgram, createClearProgram } = require('./teal-programs');
const { getDefaultAssetId, toMicroUnits, getAssetInfo } = require('./assetConfig');

// Configuration
const ALGOD_TOKEN = '';
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://mainnet-api.algonode.cloud';
const ALGOD_PORT = '';

// ADD this constant at the top of the file (after existing constants)
const PLATFORM_ADDRESS = process.env.PLATFORM_ADDRESS || 'REPLACE_WITH_YOUR_PLATFORM_ADDRESS';

// Initialize Algorand client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Fee calculation helper
function calculateTransactionFee(hasInnerTxn = false, innerTxnCount = 1) {
  const baseFee = 1000; // 0.001 ALGO
  const innerFee = hasInnerTxn ? (innerTxnCount * 1000) : 0;
  return baseFee + innerFee;
}

// EXACT FEE CONTROL - Updated without platform fee
const EXACT_FEES = {
  FUNDING: 1000,           // Payment to fund app (reduced amount)
  TEMP_FUNDING: 1000,      // Payment to fund temp account
  RECIPIENT_FUNDING: 1000, // Payment for recipient fees (if enabled)
  OPT_IN: 2000,           // App call with inner transaction
  SET_AMOUNT: 1000,       // App call (no inner transaction)
  SEND_ASSET: 1000        // Asset transfer (was SEND_USDC)
};

// Generate unsigned transaction for app creation
async function generateUnsignedDeployTransactions({ amount, recipientEmail, senderAddress, assetId = null }) {
  const targetAssetId = assetId || getDefaultAssetId();

  try {
    console.log("Generating deployment transaction for sender:", senderAddress);
    
    // Input validation
    if (!senderAddress || typeof senderAddress !== 'string') {
      throw new Error("Invalid or missing 'senderAddress'. Must be a non-empty string.");
    }
    
    if (!algosdk.isValidAddress(senderAddress)) {
      throw new Error(`Invalid sender address format: ${senderAddress}`);
    }
    
    // Convert string amount to number if needed
    amount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error("Invalid 'amount'. Must be a positive number.");
    }
    
    // Generate temporary account for authorization
    const tempAccount = algosdk.generateAccount();
    const tempAddress = tempAccount.addr;
    const tempPrivateKey = Buffer.from(tempAccount.sk).toString('hex');
    
    console.log(`Generated temporary account: ${tempAddress}`);
    
    // Convert to microUnits
    const microAmount = toMicroUnits(amount, targetAssetId);
    
    // Get suggested parameters
console.log("Fetching suggested parameters...");
let suggestedParams = await algodClient.getTransactionParams().do();

// ADD THIS INSTEAD (handles BigInt):
console.log("Debug - suggestedParams full object:", {
  ...suggestedParams,
  fee: suggestedParams.fee?.toString(),
  firstRound: suggestedParams.firstRound?.toString(),
  lastRound: suggestedParams.lastRound?.toString(),
  minFee: suggestedParams.minFee?.toString()
});

console.log("Processing parameters complete. Generating TEAL programs...");
    
    // Compile the TEAL programs - now using imported functions
    const approvalProgramSource = createApprovalProgram(senderAddress, tempAddress, targetAssetId);
    const approvalProgram = await compileProgram(approvalProgramSource);
    
    const clearProgramSource = createClearProgram();
    const clearProgram = await compileProgram(clearProgramSource);
    
    console.log("TEAL compilation successful");
    
    console.log("Debug - OnApplicationComplete values:", {
      NoOpOC: algosdk.OnApplicationComplete.NoOpOC,
      OptInOC: algosdk.OnApplicationComplete.OptInOC,
      CloseOutOC: algosdk.OnApplicationComplete.CloseOutOC,
      ClearStateOC: algosdk.OnApplicationComplete.ClearStateOC,
      UpdateApplicationOC: algosdk.OnApplicationComplete.UpdateApplicationOC,
      DeleteApplicationOC: algosdk.OnApplicationComplete.DeleteApplicationOC
    });
    
    try {
      console.log("TEST: Creating minimal app transaction...");
      const testTxn = algosdk.makeApplicationCreateTxnFromObject({
        from: senderAddress,
        approvalProgram: approvalProgram,
        clearProgram: clearProgram,
        numLocalInts: 0,
        numLocalByteSlices: 0,
        numGlobalInts: 2,
        numGlobalByteSlices: 2,
        suggestedParams: suggestedParams
      });
      console.log("TEST: Minimal transaction created successfully!");
    } catch (testError) {
      console.log("TEST: Minimal transaction failed:", testError.message);
    }
    
    // Now try with onComplete
    try {
      console.log("TEST: Adding onComplete...");
      const testTxn2 = algosdk.makeApplicationCreateTxnFromObject({
        from: senderAddress,
        approvalProgram: approvalProgram,
        clearProgram: clearProgram,
        numLocalInts: 0,
        numLocalByteSlices: 0,
        numGlobalInts: 2,
        numGlobalByteSlices: 2,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        suggestedParams: suggestedParams
      });
      console.log("TEST: With onComplete created successfully!");
    } catch (testError) {
      console.log("TEST: With onComplete failed:", testError.message);
    }
    
    // Now try with foreignAssets
    try {
      console.log("TEST: Adding foreignAssets...");
      const testTxn3 = algosdk.makeApplicationCreateTxnFromObject({
        from: senderAddress,
        approvalProgram: approvalProgram,
        clearProgram: clearProgram,
        numLocalInts: 0,
        numLocalByteSlices: 0,
        numGlobalInts: 2,
        numGlobalByteSlices: 2,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        foreignAssets: [targetAssetId],
        suggestedParams: suggestedParams
      });
      console.log("TEST: With foreignAssets created successfully!");
    } catch (testError) {
      console.log("TEST: With foreignAssets failed:", testError.message);
    }
    
    // Create application transaction using v3 maker function
    try {
      console.log("Creating application transaction...");
      
      console.log("Creating app with the following values:");

      // Before creating the transaction:
console.log("Debug - senderAddress:", senderAddress);
console.log("Debug - senderAddress valid?", algosdk.isValidAddress(senderAddress));
console.log("Debug - suggestedParams keys:", Object.keys(suggestedParams));
console.log("Debug - targetAssetId:", targetAssetId);

console.log("Debug - approvalProgram:", approvalProgram ? `Uint8Array(${approvalProgram.length})` : 'null/undefined');
console.log("Debug - clearProgram:", clearProgram ? `Uint8Array(${clearProgram.length})` : 'null/undefined');
console.log("Debug - foreignAssets:", [targetAssetId]);
console.log("Debug - onComplete value:", algosdk.OnApplicationComplete.NoOpOC);

console.log("Debug - OnApplicationComplete.NoOpOC actual value:", algosdk.OnApplicationComplete.NoOpOC);
console.log("Debug - OnApplicationComplete object:", algosdk.OnApplicationComplete);
console.log("Debug - typeof OnApplicationComplete.NoOpOC:", typeof algosdk.OnApplicationComplete.NoOpOC);
console.log("Debug - algosdk exports:", Object.keys(algosdk).filter(k => k.includes('Application') || k.includes('OnComplete')));
// Try passing suggestedParams directly first
const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
  from: senderAddress,
  approvalProgram: approvalProgram,
  clearProgram: clearProgram,
  numLocalInts: 0,
  numLocalByteSlices: 0,
  numGlobalInts: 2,
  numGlobalByteSlices: 2,
  onComplete: algosdk.OnApplicationComplete.NoOpOC,
  foreignAssets: [BigInt(targetAssetId)],
  suggestedParams: suggestedParams  // Pass directly without modification
});

// Then set fee after creation
appCreateTxn.fee = 1000;
appCreateTxn.flatFee = true;

      // Add this after fetching suggestedParams to debug:
console.log("Suggested params structure:", JSON.stringify(suggestedParams, null, 2));
      
      // Encode the transaction for the frontend using v3 method
      console.log("Transaction created successfully, encoding...");
      const encodedTxn = algosdk.encodeMsgpack(appCreateTxn);
      const encodedTxnB64 = Buffer.from(encodedTxn).toString('base64');
      
      console.log("Transaction encoded successfully");
      return {
        transaction: encodedTxnB64,
        tempAccount: {
          address: tempAddress,
          privateKey: tempPrivateKey
        },
        amount: amount,
        microAmount: microAmount
      };
    } catch (txnError) {
      console.error("Transaction creation failed:", txnError);
      throw txnError;
    }
  } catch (error) {
    console.error("Error in generateUnsignedDeployTransactions:", error);
    console.error("Stack trace:", error.stack);
    throw new Error(`Failed to create deployment transaction: ${error.message}`);
  }
}

// Generate transactions after app creation for funding and setup
async function generatePostAppTransactions({ appId, senderAddress, microAmount, tempAccount, payRecipientFees = false, assetId = null }) {
  const targetAssetId = assetId || getDefaultAssetId();

  try {
    console.log("Generating post-app transactions for appId:", appId);
    
    // Validate inputs
    if (!appId || isNaN(parseInt(appId))) {
      throw new Error("Invalid app ID");
    }
    
    if (!algosdk.isValidAddress(senderAddress)) {
      throw new Error("Invalid sender address");
    }
    
    if (!tempAccount || !tempAccount.address) {
      throw new Error("Invalid temporary account");
    }
    
    const appIdInt = parseInt(appId);
    const appAddress = algosdk.getApplicationAddress(appIdInt);
    console.log(`App address: ${appAddress}`);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Calculate total fee budget (no platform fee)
    const totalFeeNeeded = EXACT_FEES.FUNDING + 
                          EXACT_FEES.TEMP_FUNDING +
                          (payRecipientFees ? EXACT_FEES.RECIPIENT_FUNDING : 0) +
                          EXACT_FEES.OPT_IN + 
                          EXACT_FEES.SET_AMOUNT + 
                          EXACT_FEES.SEND_ASSET;
    
    console.log(`Group transaction total fee budget: ${totalFeeNeeded / 1e6} ALGO`);
    
    // 1. Fund the app with ALGO (back to 0.21 ALGO since no platform fee)
    const fundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: senderAddress,
      to: appAddress,
      amount: 210000,
      suggestedParams: {
        ...suggestedParams,
        fee: EXACT_FEES.FUNDING,
        flatFee: true
      }
    });
    
    // 2. Fund the temporary account with minimal ALGO for claim transaction
    const tempFundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: senderAddress,
      to: tempAccount.address,
      amount: 102000,
      suggestedParams: {
        ...suggestedParams,
        fee: EXACT_FEES.TEMP_FUNDING,
        flatFee: true
      }
    });
    
    // 3. Send cover fee to temporary account (if enabled)
    let recipientFundingTxn = null;
    if (payRecipientFees) {
      recipientFundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddress,
        to: tempAccount.address,
        amount: 210000,
        note: new Uint8Array(Buffer.from('Recipient fee funding to temp account')),
        suggestedParams: {
          ...suggestedParams,
          fee: EXACT_FEES.RECIPIENT_FUNDING,
          flatFee: true
        }
      });
    }
    
    // 4. Opt the app into asset
    const optInTxn = algosdk.makeApplicationCallTxnFromObject({
      from: senderAddress,
      appIndex: appIdInt,
      appArgs: [new Uint8Array(Buffer.from("opt_in_asset"))],
      foreignAssets: [targetAssetId],
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: {
        ...suggestedParams,
        fee: EXACT_FEES.OPT_IN,
        flatFee: true
      }
    });
    
    // 5. Set the amount
    const setAmountTxn = algosdk.makeApplicationCallTxnFromObject({
      from: senderAddress,
      appIndex: appIdInt,
      appArgs: [
        new Uint8Array(Buffer.from("set_amount")),
        algosdk.encodeUint64(microAmount)
      ],
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: {
        ...suggestedParams,
        fee: EXACT_FEES.SET_AMOUNT,
        flatFee: true
      }
    });
    
    // 6. Send asset to the app
    const sendAssetTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: senderAddress,
      to: appAddress,
      assetIndex: targetAssetId,
      amount: microAmount,
      suggestedParams: {
        ...suggestedParams,
        fee: EXACT_FEES.SEND_ASSET,
        flatFee: true
      }
    });
    
    // Group transactions (no platform fee)
    const txnGroup = recipientFundingTxn 
      ? [fundingTxn, tempFundingTxn, recipientFundingTxn, optInTxn, setAmountTxn, sendAssetTxn]
      : [fundingTxn, tempFundingTxn, optInTxn, setAmountTxn, sendAssetTxn];
    
    // Assign group ID
    algosdk.assignGroupID(txnGroup);
    
    // Verify total fees
    const actualTotalFee = txnGroup.reduce((sum, txn) => sum + txn.fee, 0);
    console.log(`Actual group fee total: ${actualTotalFee / 1e6} ALGO`);
    
    // Convert to base64 for transmission using v3 encoding
    const encodedTxns = txnGroup.map(txn => {
      const encoded = algosdk.encodeMsgpack(txn);
      return Buffer.from(encoded).toString('base64');
    });
    
    return {
      appAddress,
      groupTransactions: encodedTxns,
      totalFee: actualTotalFee / 1e6,
      tempAccount
    };
  } catch (error) {
    console.error("Error in generatePostAppTransactions:", error);
    throw new Error(`Failed to create post-app transactions: ${error.message}`);
  }
}

// Generate claim transaction with platform fee
async function generateClaimTransaction({ appId, tempPrivateKey, recipientAddress, assetId = null }) {
  const targetAssetId = assetId || getDefaultAssetId();

  try {
    console.log("Generating claim transaction group with temp account closure for app:", appId);
    
    // Validate inputs
    if (!appId || isNaN(parseInt(appId))) {
      throw new Error("Invalid app ID");
    }
    
    if (!tempPrivateKey || typeof tempPrivateKey !== 'string') {
      throw new Error("Invalid temporary private key");
    }
    
    if (!algosdk.isValidAddress(recipientAddress)) {
      throw new Error("Invalid recipient address");
    }
    
    if (!algosdk.isValidAddress(PLATFORM_ADDRESS)) {
      throw new Error("Invalid platform address - check PLATFORM_ADDRESS environment variable");
    }
    
    const appIdInt = parseInt(appId);
    
    // Reconstruct temporary account from private key
    const secretKeyUint8 = new Uint8Array(Buffer.from(tempPrivateKey, 'hex'));
    
    // Extract public key from secret key (last 32 bytes) and get address
    const publicKey = secretKeyUint8.slice(32, 64);
    const address = algosdk.encodeAddress(publicKey);
    
    const tempAccountObj = {
      addr: address,
      sk: secretKeyUint8
    };
    
    console.log("Reconstructed temp account address:", tempAccountObj.addr);
    console.log("Platform address for closure:", PLATFORM_ADDRESS);
    
    // Get suggested parameters
    let suggestedParams = await algodClient.getTransactionParams().do();
    
    // Transaction 1: App call to claim funds
    const claimTxn = algosdk.makeApplicationCallTxnFromObject({
      from: tempAccountObj.addr,
      appIndex: appIdInt,
      appArgs: [new Uint8Array(Buffer.from("claim"))],
      accounts: [recipientAddress], // Where to send asset
      foreignAssets: [targetAssetId],
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: {
        ...suggestedParams,
        fee: calculateTransactionFee(true, 1), // 2000 microALGO
        flatFee: true
      }
    });

    // Transaction 2: Close temp account and send remaining ALGO to platform
    const closeAccountTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: tempAccountObj.addr,
      to: PLATFORM_ADDRESS,
      amount: 0, // Implicit 0, all remaining goes to closeRemainderTo
      closeRemainderTo: PLATFORM_ADDRESS, // KEY: This closes the account
      note: new Uint8Array(Buffer.from('AlgoSend platform fee')),
      suggestedParams: {
        ...suggestedParams,
        fee: 1000, // Standard fee for payment transaction
        flatFee: true
      }
    });

    // Group the transactions together
    const txnGroup = [claimTxn, closeAccountTxn];
    algosdk.assignGroupID(txnGroup);

    // Sign both transactions with temp account
    const signedClaimTxn = algosdk.signTransaction(claimTxn, tempAccountObj.sk);
    const signedCloseTxn = algosdk.signTransaction(closeAccountTxn, tempAccountObj.sk);

    console.log(`Claim transaction group created and signed (2 transactions)`);
    console.log(`Expected platform revenue: ~${(100000 - 3000) / 1e6} ALGO per claim`); // ~0.097 ALGO
    
    // Return group transaction format (changed from single transaction)
    return { 
      signedTransactions: [
        Buffer.from(signedClaimTxn.blob).toString('base64'),
        Buffer.from(signedCloseTxn.blob).toString('base64')
      ],
      txnId: claimTxn.txID()
    };
  } catch (error) {
    console.error("Error in generateClaimTransaction:", error);
    throw new Error(`Failed to create claim transaction: ${error.message}`);
  }
}

// Safer TEAL compilation with error handling
async function compileProgram(programSource) {
  try {
    const compileResponse = await algodClient.compile(programSource).do();
    if (!compileResponse || !compileResponse.result) {
      throw new Error('Compilation failed: empty result');
    }
    return new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
  } catch (error) {
    console.error('TEAL compilation error:', error);
    throw new Error(`Failed to compile TEAL program: ${error.message}`);
  }
}

async function generateReclaimTransaction({ appId, senderAddress, assetId = null }) {
  const targetAssetId = assetId || getDefaultAssetId();

  try {
    console.log("Generating reclaim transaction for app:", appId);
    
    if (!appId || isNaN(parseInt(appId))) {
      throw new Error("Invalid app ID");
    }
    
    if (!algosdk.isValidAddress(senderAddress)) {
      throw new Error("Invalid sender address");
    }
    
    const appIdInt = parseInt(appId);
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Calculate exact fee (1 inner transaction for asset transfer)
    const exactFee = calculateTransactionFee(true, 1); // 2000 microALGO
    
    const reclaimTxn = algosdk.makeApplicationCallTxnFromObject({
      from: senderAddress,
      appIndex: appIdInt,
      appArgs: [new Uint8Array(Buffer.from("reclaim"))],
      foreignAssets: [targetAssetId],
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: {
        ...suggestedParams,
        fee: exactFee,
        flatFee: true
      }
    });
    
    // Encode using v3 method
    const encoded = algosdk.encodeMsgpack(reclaimTxn);
    const encodedTxn = Buffer.from(encoded).toString('base64');
    
    console.log(`Reclaim transaction created with exact fee: ${exactFee / 1e6} ALGO`);
    return { transaction: encodedTxn };
  } catch (error) {
    console.error("Error in generateReclaimTransaction:", error);
    throw new Error(`Failed to create reclaim transaction: ${error.message}`);
  }
}

// Export functions for use by API
module.exports = {
  generateUnsignedDeployTransactions,
  generatePostAppTransactions,
  generateClaimTransaction,
  generateReclaimTransaction,
};
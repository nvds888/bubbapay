const algosdk = require('algosdk');
const crypto = require('crypto');
const { createApprovalProgram, createClearProgram } = require('./teal-programs');
const { getDefaultAssetId, toMicroUnits, getAssetInfo } = require('./assetConfig');

// Configuration
const ALGOD_TOKEN = '';
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://mainnet-api.algonode.cloud';
const ALGOD_PORT = '';
const PLATFORM_ADDRESS = process.env.PLATFORM_ADDRESS || 'REPLACE_WITH_YOUR_PLATFORM_ADDRESS';

// Initialize Algorand client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Fee calculation helper
function calculateTransactionFee(hasInnerTxn = false, innerTxnCount = 1) {
  const baseFee = 1000; // 0.001 ALGO
  const innerFee = hasInnerTxn ? (innerTxnCount * 1000) : 0;
  return baseFee + innerFee;
}

// EXACT FEE CONTROL
const EXACT_FEES = {
  FUNDING: 1000,
  TEMP_FUNDING: 1000,
  RECIPIENT_FUNDING: 1000,
  OPT_IN: 2000,
  SET_AMOUNT: 1000,
  SEND_ASSET: 1000
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
let suggestedParams;
try {
  suggestedParams = await algodClient.getTransactionParams().do();
} catch (error) {
  console.error("Failed to fetch transaction parameters:", error);
  throw new Error(`Failed to fetch transaction parameters: ${error.message}`);
}

// Validate suggested parameters
const firstRound = suggestedParams.firstRound ?? suggestedParams.firstValid;
const lastRound = suggestedParams.lastRound ?? suggestedParams.lastValid;

if (!suggestedParams || 
    (firstRound === undefined || firstRound === null) || 
    (lastRound === undefined || lastRound === null) || 
    !suggestedParams.genesisID || 
    !suggestedParams.genesisHash) {
  console.error("Invalid suggested parameters:", JSON.stringify(suggestedParams, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value));
  throw new Error("Invalid transaction parameters: missing or invalid firstRound/firstValid, lastRound/lastValid, genesisID, or genesisHash");
}

// Ensure genesisHash is a base64 string if it's a Uint8Array
const genesisHash = suggestedParams.genesisHash instanceof Uint8Array 
  ? Buffer.from(suggestedParams.genesisHash).toString('base64')
  : suggestedParams.genesisHash;

// Create clean parameters object 
const processedParams = {
  fee: 1000,
  firstRound: Number(firstRound),
  lastRound: Number(lastRound),
  genesisID: suggestedParams.genesisID,
  genesisHash: genesisHash,
  flatFee: true
};

// Validate targetAssetId
const targetAssetId = assetId || getDefaultAssetId();
if (!targetAssetId || isNaN(targetAssetId) || targetAssetId <= 0) {
  console.error("Invalid targetAssetId:", targetAssetId);
  throw new Error("Invalid asset ID: assetId must be a positive integer");
}
console.log("Using targetAssetId:", targetAssetId);
    
    console.log("Processing parameters complete. Generating TEAL programs...");
    
    // Compile the TEAL programs
    const approvalProgramSource = createApprovalProgram(senderAddress, tempAddress, targetAssetId);
    const approvalProgram = await compileProgram(approvalProgramSource);
    
    const clearProgramSource = createClearProgram();
    const clearProgram = await compileProgram(clearProgramSource);
    
    console.log("TEAL compilation successful");
    
    // Create application transaction
    try {
      console.log("Creating application transaction...");
      
      const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
        sender: senderAddress,
        suggestedParams: processedParams,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: approvalProgram,
        clearProgram: clearProgram,
        numLocalInts: 0,
        numLocalByteSlices: 0,
        numGlobalInts: 2,
        numGlobalByteSlices: 2,
        foreignAssets: [Number(targetAssetId)]
      });
      
      // Encode the transaction for the frontend
      console.log("Transaction created successfully, encoding...");
      const encodedTxn = Buffer.from(appCreateTxn.toByte()).toString('base64');
      
      console.log("Transaction encoded successfully");
      return {
        transaction: encodedTxn,
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
    
    // Calculate total fee budget
    const totalFeeNeeded = EXACT_FEES.FUNDING + 
                          EXACT_FEES.TEMP_FUNDING +
                          (payRecipientFees ? EXACT_FEES.RECIPIENT_FUNDING : 0) +
                          EXACT_FEES.OPT_IN + 
                          EXACT_FEES.SET_AMOUNT + 
                          EXACT_FEES.SEND_ASSET;
    
    console.log(`Group transaction total fee budget: ${totalFeeNeeded / 1e6} ALGO`);
    
    // Create base parameters
    const baseParams = {
      firstRound: Number(suggestedParams.firstRound),
      lastRound: Number(suggestedParams.lastRound),
      genesisID: suggestedParams.genesisID,
      genesisHash: suggestedParams.genesisHash,
      flatFee: true
    };
    
    // 1. Fund the app with ALGO
    const fundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: senderAddress,
      to: appAddress,
      amount: 210000,
      suggestedParams: { ...baseParams, fee: EXACT_FEES.FUNDING }
    });
    
    // 2. Fund the temporary account with minimal ALGO
    const tempFundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: senderAddress,
      to: tempAccount.address,
      amount: 102000,
      suggestedParams: { ...baseParams, fee: EXACT_FEES.TEMP_FUNDING }
    });
    
    // 3. Send cover fee to temporary account (if enabled)
    let recipientFundingTxn = null;
    if (payRecipientFees) {
      recipientFundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddress,
        to: tempAccount.address,
        amount: 210000,
        note: new Uint8Array(Buffer.from('Recipient fee funding to temp account')),
        suggestedParams: { ...baseParams, fee: EXACT_FEES.RECIPIENT_FUNDING }
      });
    }
    
    // 4. Opt the app into asset
    const optInTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: senderAddress,
      suggestedParams: { ...baseParams, fee: EXACT_FEES.OPT_IN },
      appIndex: appIdInt,
      appArgs: [new Uint8Array(Buffer.from("opt_in_asset"))],
      foreignAssets: [targetAssetId]
    });
    
    // 5. Set the amount
    const setAmountTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: senderAddress,
      suggestedParams: { ...baseParams, fee: EXACT_FEES.SET_AMOUNT },
      appIndex: appIdInt,
      appArgs: [
        new Uint8Array(Buffer.from("set_amount")),
        algosdk.encodeUint64(microAmount)
      ]
    });
    
    // 6. Send asset to the app
    const sendAssetTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: senderAddress,
      to: appAddress,
      amount: microAmount,
      assetIndex: targetAssetId,
      suggestedParams: { ...baseParams, fee: EXACT_FEES.SEND_ASSET }
    });
    
    // Group transactions
    const txnGroup = recipientFundingTxn 
      ? [fundingTxn, tempFundingTxn, recipientFundingTxn, optInTxn, setAmountTxn, sendAssetTxn]
      : [fundingTxn, tempFundingTxn, optInTxn, setAmountTxn, sendAssetTxn];
    
    // Assign group ID
    algosdk.assignGroupID(txnGroup);
    
    // Verify total fees
    const actualTotalFee = txnGroup.reduce((sum, txn) => sum + txn.fee, 0);
    console.log(`Actual group fee total: ${actualTotalFee / 1e6} ALGO`);
    
    // Convert to base64 for transmission
    const encodedTxns = txnGroup.map(txn => 
      Buffer.from(txn.toByte()).toString('base64')
    );
    
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
    
    // Create base parameters for both transactions
    const baseParams = {
      firstRound: suggestedParams.firstRound,
      lastRound: suggestedParams.lastRound,
      genesisID: suggestedParams.genesisID,
      genesisHash: suggestedParams.genesisHash,
      flatFee: true
    };
    
    // Transaction 1: App call to claim funds
    const claimTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: tempAccountObj.addr,
      suggestedParams: { ...baseParams, fee: calculateTransactionFee(true, 1) },
      appIndex: appIdInt,
      appArgs: [new Uint8Array(Buffer.from("claim"))],
      accounts: [recipientAddress],
      foreignAssets: [targetAssetId]
    });

    // Transaction 2: Close temp account and send remaining ALGO to platform
    const closeAccountTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: tempAccountObj.addr,
      to: PLATFORM_ADDRESS,
      amount: 0,
      closeRemainderTo: PLATFORM_ADDRESS,
      note: new Uint8Array(Buffer.from('AlgoSend platform fee')),
      suggestedParams: { ...baseParams, fee: 1000 }
    });

    // Group the transactions together
    const txnGroup = [claimTxn, closeAccountTxn];
    algosdk.assignGroupID(txnGroup);

    // Sign both transactions with temp account
    const signedClaimTxn = claimTxn.signTxn(tempAccountObj.sk);
    const signedCloseTxn = closeAccountTxn.signTxn(tempAccountObj.sk);

    console.log(`Claim transaction group created and signed (2 transactions)`);
    console.log(`Expected platform revenue: ~${(100000 - 3000) / 1e6} ALGO per claim`);
    
    return { 
      signedTransactions: [
        Buffer.from(signedClaimTxn).toString('base64'),
        Buffer.from(signedCloseTxn).toString('base64')
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
    
    // Calculate exact fee
    const exactFee = calculateTransactionFee(true, 1);
    
    const reclaimTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: senderAddress,
      suggestedParams: { ...suggestedParams, fee: exactFee, flatFee: true },
      appIndex: appIdInt,
      appArgs: [new Uint8Array(Buffer.from("reclaim"))],
      foreignAssets: [targetAssetId]
    });
    
    const encodedTxn = Buffer.from(reclaimTxn.toByte()).toString('base64');
    
    console.log(`Reclaim transaction created with exact fee: ${exactFee / 1e6} ALGO`);
    return { transaction: encodedTxn };
  } catch (error) {
    console.error("Error in generateReclaimTransaction:", error);
    throw new Error(`Failed to create reclaim transaction: ${error.message}`);
  }
}

module.exports = {
  generateUnsignedDeployTransactions,
  generatePostAppTransactions,
  generateClaimTransaction,
  generateReclaimTransaction,
};
// atomic-deploy-email-escrow.js 

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
    
    // Generate temporary account
const tempAccount = algosdk.generateAccount();

// Build multisig params (2-of-2 in this example)
const msigParams = {
  version: 1,
  threshold: 1,
  addrs: [ senderAddress, tempAccount.addr ],
};

// Derive the multisig address
const multisigAddress = algosdk.multisigAddress(msigParams);

    const tempPrivateKey = Buffer.from(tempAccount.sk).toString('hex');
    
    
    // Convert to microUnits
    const microAmount = toMicroUnits(amount, targetAssetId);
    
    // Get suggested parameters
    console.log("Fetching suggested parameters...");
    let suggestedParams = await algodClient.getTransactionParams().do();
    
    
    console.log("Processing parameters complete. Generating TEAL programs...");
    
    // Compile the TEAL programs - now using imported functions
    const approvalProgramSource = createApprovalProgram(senderAddress, multisigAddress, targetAssetId);
    const approvalProgram = await compileProgram(approvalProgramSource);
    
    const clearProgramSource = createClearProgram();
    const clearProgram = await compileProgram(clearProgramSource);
    
    console.log("TEAL compilation successful");
    
    // Create application transaction 
    try {
      console.log("Creating application transaction...");
      
      const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
        sender: senderAddress,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        numLocalInts: 0,
        numLocalByteSlices: 0,
        numGlobalInts: 2,
        numGlobalByteSlices: 2,
        approvalProgram: approvalProgram,
        clearProgram: clearProgram,
        foreignAssets: [targetAssetId],
        suggestedParams: suggestedParams
      });
      
      // Encode the transaction for the frontend
      console.log("Transaction created successfully, encoding...");
      const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(appCreateTxn)).toString('base64');
      
      console.log("Transaction encoded successfully");
      return {
        transaction: encodedTxn,
        tempAccount: {
          address: multisigAddress,
          privateKey: tempPrivateKey,
          msigParams
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

    let tempAccountAddress;
if (tempAccount.address && tempAccount.address.publicKey && typeof tempAccount.address.publicKey === 'object') {
  // The publicKey was JSON-serialized, convert it back to Uint8Array and encode address
  const publicKeyArray = new Uint8Array(Object.values(tempAccount.address.publicKey));
  tempAccountAddress = algosdk.encodeAddress(publicKeyArray);
} else if (typeof tempAccount.address === 'string') {
  // Already a string address
  tempAccountAddress = tempAccount.address;
} else {
  throw new Error("Invalid temporary account address format");
}

console.log("DEBUG - Reconstructed tempAccountAddress:", tempAccountAddress);
    
    const appIdInt = Number(appId); 
    const appAddressObj = algosdk.getApplicationAddress(appIdInt);
const appAddress = appAddressObj.toString();
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
      sender: senderAddress,
      receiver: appAddress,
      amount: 210000,
      suggestedParams: { ...suggestedParams, fee: EXACT_FEES.FUNDING, flatFee: true }
    });
    
    // 2. Fund the temporary account with minimal ALGO for claim transaction
    const tempFundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: senderAddress,
      receiver: tempAccountAddress,
      amount: 102000,
      suggestedParams: { ...suggestedParams, fee: EXACT_FEES.TEMP_FUNDING, flatFee: true }
    });
    
    // 3. Send cover fee to temporary account (if enabled)
    let recipientFundingTxn = null;
    if (payRecipientFees) {
      recipientFundingTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: senderAddress,
        receiver: tempAccountAddress,
        amount: 210000,
        note: new Uint8Array(Buffer.from('Recipient fee funding to temp account')),
        suggestedParams: { ...suggestedParams, fee: EXACT_FEES.RECIPIENT_FUNDING, flatFee: true }
      });
    }
    
    // 4. Opt the app into asset
    const optInTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: senderAddress,
      appIndex: appIdInt,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [new Uint8Array(Buffer.from("opt_in_asset"))],
      foreignAssets: [targetAssetId],
      suggestedParams: { ...suggestedParams, fee: EXACT_FEES.OPT_IN, flatFee: true }
    });
    
    // 5. Set the amount
    const setAmountTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: senderAddress,
      appIndex: appIdInt,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new Uint8Array(Buffer.from("set_amount")),
        algosdk.encodeUint64(microAmount)
      ],
      suggestedParams: { ...suggestedParams, fee: EXACT_FEES.SET_AMOUNT, flatFee: true }
    });
    
    // 6. Send asset to the app
    const sendAssetTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: senderAddress,
      receiver: appAddress,
      assetIndex: targetAssetId,
      amount: microAmount,
      suggestedParams: { ...suggestedParams, fee: EXACT_FEES.SEND_ASSET, flatFee: true }
    });
    
    // Group transactions (no platform fee)
    const txnGroup = recipientFundingTxn 
      ? [fundingTxn, tempFundingTxn, recipientFundingTxn, optInTxn, setAmountTxn, sendAssetTxn]
      : [fundingTxn, tempFundingTxn, optInTxn, setAmountTxn, sendAssetTxn];
    
    // Assign group ID
    algosdk.assignGroupID(txnGroup);
    
    // Verify total fees
    const actualTotalFee = txnGroup.reduce((sum, txn) => sum + Number(txn.fee), 0);
    console.log(`Actual group fee total: ${actualTotalFee / 1e6} ALGO`);
    
    // Convert to base64 for transmission
    const encodedTxns = txnGroup.map(txn => 
      Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64')
    );
    
    return {
      appAddress,
      groupTransactions: encodedTxns,
      totalFee: actualTotalFee / 1e6,
      tempAccount: {
        address: tempAccountAddress,  // Use the clean string address
        privateKey: tempAccount.privateKey  // Keep only the private key string
      }
    };
  } catch (error) {
    console.error("Error in generatePostAppTransactions:", error);
    throw new Error(`Failed to create post-app transactions: ${error.message}`);
  }
}


//TEAL compilation with error handling
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

// Add this debugging code to your generateReclaimTransaction function

async function generateReclaimTransaction({ appId, senderAddress, assetId = null, tempAccount }) {
  const targetAssetId = assetId || getDefaultAssetId();

  try {
    console.log("=== DEBUGGING MULTISIG ADDRESS CALCULATION ===");
    console.log("Raw tempAccount.msigParams:", JSON.stringify(tempAccount.msigParams, null, 2));
    
    // Clean up the addresses
    const cleanAddrs = tempAccount.msigParams.addrs.map((addr, index) => {
      console.log(`Processing address ${index}:`, addr);
      
      if (typeof addr === 'string') {
        console.log(`  → Already a string: ${addr}`);
        return addr;
      } else if (addr && addr.publicKey && typeof addr.publicKey === 'object') {
        const publicKeyArray = new Uint8Array(Object.values(addr.publicKey));
        const address = algosdk.encodeAddress(publicKeyArray);
        console.log(`  → Converted from publicKey: ${address}`);
        return address;
      } else {
        throw new Error(`Invalid address format at index ${index}`);
      }
    });

    const cleanMsigParams = {
      version: tempAccount.msigParams.version,
      threshold: tempAccount.msigParams.threshold,
      addrs: cleanAddrs
    };

    console.log("Clean multisig params:", cleanMsigParams);
    
    // FIXED: Properly handle Address object - use encodeAddress for conversion
    const calculatedMultisigAddressObj = algosdk.multisigAddress(cleanMsigParams);
    const calculatedMultisigAddress = algosdk.encodeAddress(calculatedMultisigAddressObj.publicKey);
    
    console.log("Calculated multisig address:", calculatedMultisigAddress);
    console.log("Expected from wallet display: 442B3WRL6RWLGGPSITQFE5VFLX5VLTSF2RUH3WWZ3WVYNFNODTSDSH77RE");
    console.log("Addresses match:", calculatedMultisigAddress === "442B3WRL6RWLGGPSITQFE5VFLX5VLTSF2RUH3WWZ3WVYNFNODTSDSH77RE");
    
    let finalMsigParams = cleanMsigParams;
    let multisigAddress = calculatedMultisigAddress;
    
    // If addresses don't match, try different order
    if (calculatedMultisigAddress !== "442B3WRL6RWLGGPSITQFE5VFLX5VLTSF2RUH3WWZ3WVYNFNODTSDSH77RE") {
      console.log("=== TRYING REVERSED ADDRESS ORDER ===");
      const reversedMsigParams = {
        version: tempAccount.msigParams.version,
        threshold: tempAccount.msigParams.threshold,
        addrs: [...cleanAddrs].reverse() // Try reversed order
      };
      
      const reversedMultisigAddressObj = algosdk.multisigAddress(reversedMsigParams);
      const reversedMultisigAddress = algosdk.encodeAddress(reversedMultisigAddressObj.publicKey);
      
      console.log("Reversed order multisig address:", reversedMultisigAddress);
      console.log("Reversed matches:", reversedMultisigAddress === "442B3WRL6RWLGGPSITQFE5VFLX5VLTSF2RUH3WWZ3WVYNFNODTSDSH77RE");
      
      if (reversedMultisigAddress === "442B3WRL6RWLGGPSITQFE5VFLX5VLTSF2RUH3WWZ3WVYNFNODTSDSH77RE") {
        // Use the reversed order
        finalMsigParams = reversedMsigParams;
        multisigAddress = reversedMultisigAddress;
      } else {
        // Neither matches - this is a problem with the stored parameters
        console.error("=== CRITICAL ERROR ===");
        console.error("Neither normal nor reversed multisig parameters generate the expected address!");
        console.error("This suggests the stored multisig parameters are incorrect.");
        console.error("Expected: 442B3WRL6RWLGGPSITQFE5VFLX5VLTSF2RUH3WWZ3WVYNFNODTSDSH77RE");
        console.error("Calculated (normal): " + calculatedMultisigAddress);
        console.error("Calculated (reversed): " + reversedMultisigAddress);
        
        // For now, continue with the calculated address (normal order)
        // But this will likely fail in the wallet
        console.error("Continuing with calculated address, but this will likely fail...");
      }
    }
    
    console.log("Final multisig address to use:", multisigAddress);
    
    // Continue with rest of function...
    const appIdInt = Number(appId);
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const reclaimTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: senderAddress,
      appIndex: appIdInt,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [new Uint8Array(Buffer.from("reclaim"))],
      foreignAssets: [targetAssetId],
      suggestedParams: { 
        ...suggestedParams,
        fee: 2000,
        flatFee: true 
      }
    });

    const closeMultisigTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: multisigAddress, // Use the string address
      receiver: senderAddress,
      amount: 0,
      closeRemainderTo: senderAddress,
      suggestedParams: { 
        ...suggestedParams,
        fee: 1000,
        flatFee: true 
      }
    });

    const txnGroup = [reclaimTxn, closeMultisigTxn];
    algosdk.assignGroupID(txnGroup);

    console.log("Final multisig transaction sender:", algosdk.encodeAddress(closeMultisigTxn.sender.publicKey));

const walletTransactions = [
  {
    txn: Buffer.from(algosdk.encodeUnsignedTransaction(reclaimTxn)).toString('base64')
  },
  {
    txn: Buffer.from(algosdk.encodeUnsignedTransaction(closeMultisigTxn)).toString('base64'),
    msig: finalMsigParams,
    signers: [senderAddress]
  }
];



    console.log("=== WALLET TRANSACTION STRUCTURE ===");
    console.log("Transaction 2 msig field:", walletTransactions[1].msig);
    console.log("Transaction 2 signers:", walletTransactions[1].signers);
    
    return { 
      walletTransactions,
      multisigParams: finalMsigParams
    };
  } catch (error) {
    console.error("Error in generateReclaimTransaction:", error);
    throw new Error(`Failed to create reclaim transaction: ${error.message}`);
  }
}


// Export functions 
module.exports = {
  generateUnsignedDeployTransactions,
  generatePostAppTransactions,
  generateReclaimTransaction,
};
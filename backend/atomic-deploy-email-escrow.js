// atomic-deploy-email-escrow.js - Updated Implementation

const algosdk = require('algosdk');
const crypto = require('crypto');

// Configuration
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';
const USDC_ASSET_ID = 10458941; // Testnet USDC asset ID

// Initialize Algorand client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Fee calculation helper
function calculateTransactionFee(hasInnerTxn = false, innerTxnCount = 1) {
  const baseFee = 1000; // 0.001 ALGO
  const innerFee = hasInnerTxn ? (innerTxnCount * 1000) : 0;
  return baseFee + innerFee;
}

function createApprovalProgram(senderAddress, authorizedClaimerAddress) {
  return `#pragma version 8
// Global state variables
byte "creator"           // Creator address
byte "amount"           // USDC amount to transfer
byte "claimed"          // Whether funds have been claimed (0 or 1)
byte "authorized_claimer" // Address that can claim funds

// Check if creating application
txn ApplicationID
int 0
==
bnz creation

// Handle application calls
txn TypeEnum
int 6 // ApplicationCall
==
bnz handle_app_call

// Handle asset transfers
txn TypeEnum
int 4 // AssetTransfer
==
bnz handle_transfer

// Reject other types
err

// App creation logic
creation:
// Store creator as the sender address
byte "creator"
txn Sender
app_global_put

// Store initial claimed status as 0 (false)
byte "claimed"
int 0
app_global_put

// Store authorized claimer address (passed in during creation)
byte "authorized_claimer"
addr ${authorizedClaimerAddress}
app_global_put

// Approve creation
int 1
return

// Handle app calls
handle_app_call:
// Check if opting into an asset
txn ApplicationArgs 0
byte "opt_in_asset"
==
bnz handle_opt_in_asset

// Check if setting authorized claimer
txn ApplicationArgs 0
byte "set_claimer"
==
bnz handle_set_claimer

// Check if claiming USDC
txn ApplicationArgs 0
byte "claim"
==
bnz handle_claim

// Check if setting USDC amount
txn ApplicationArgs 0
byte "set_amount"
==
bnz handle_set_amount

// Check if creator is reclaiming USDC
txn ApplicationArgs 0
byte "reclaim"
==
bnz handle_reclaim

// Reject unknown app calls
err

// Handle asset opt-in
handle_opt_in_asset:
// Only creator can trigger opt-in
txn Sender
byte "creator"
app_global_get 
==
bz reject

// Begin inner transaction to opt into the asset
itxn_begin
int 4 // AssetTransfer
itxn_field TypeEnum
txn Assets 0
itxn_field XferAsset
int 0
itxn_field AssetAmount
global CurrentApplicationAddress
itxn_field Sender
global CurrentApplicationAddress
itxn_field AssetReceiver
int 0
itxn_field Fee
itxn_submit

int 1
return

// Handle setting authorized claimer (called during setup)
handle_set_claimer:
// Only creator can set claimer
txn Sender
byte "creator"
app_global_get 
==
bz reject

// Verify we have exactly one account in foreign accounts
txn NumAccounts
int 1
==
bz reject

// Store the authorized claimer address
byte "authorized_claimer"
txn Accounts 1  // First foreign account
app_global_put

int 1
return

// Handle USDC claim - SIMPLIFIED VERSION
handle_claim:
// Verify the claim hasn't already been processed
byte "claimed"
app_global_get
int 0
==
bz reject_already_claimed

// Verify sender is the authorized claimer
txn Sender
byte "authorized_claimer"
app_global_get
==
bz reject_unauthorized

// Verify we have a recipient address in accounts
txn NumAccounts
int 1
>=
bz reject_no_recipient

// Mark as claimed
byte "claimed"
int 1
app_global_put

// Get the claim amount
byte "amount"
app_global_get
store 0 // Store amount in register 0

// Begin inner transaction to transfer USDC
itxn_begin
int 4 // AssetTransfer
itxn_field TypeEnum
txn Assets 0
itxn_field XferAsset
load 0 // Load amount from register 0
itxn_field AssetAmount
global CurrentApplicationAddress
itxn_field Sender
txn Accounts 1  // Recipient address from foreign accounts
itxn_field AssetReceiver
int 0
itxn_field Fee
itxn_submit

int 1
return

// Set USDC amount (called after depositing USDC)
handle_set_amount:
// Only creator can set amount
txn Sender
byte "creator"
app_global_get 
==
bz reject

// Verify the amount parameter
txn ApplicationArgs 1
len
int 8
==
bz reject

// Store amount from the application argument
byte "amount"
txn ApplicationArgs 1
btoi
app_global_put

int 1
return

// Handle reclaim (by creator if funds haven't been claimed)
handle_reclaim:
// Only creator can reclaim
txn Sender
byte "creator"
app_global_get 
==
bz reject

// Verify funds haven't been claimed yet
byte "claimed"
app_global_get
int 0
==
bz reject_already_claimed

// Mark as claimed to prevent double-claims
byte "claimed"
int 1
app_global_put

// Get asset balance
global CurrentApplicationAddress
txn Assets 0 // USDC asset ID
asset_holding_get AssetBalance
store 1 // Store asset balance flag in register 1
store 0 // Store asset balance in register 0

// Check if we have any balance
load 1
load 0
int 0
>
&&
bz reject_no_balance

// Begin inner transaction to transfer all USDC back to creator
itxn_begin
int 4 // AssetTransfer
itxn_field TypeEnum
txn Assets 0
itxn_field XferAsset
load 0
itxn_field AssetAmount
global CurrentApplicationAddress
itxn_field Sender
byte "creator"
app_global_get
itxn_field AssetReceiver
int 0
itxn_field Fee
itxn_submit

int 1
return

// Handle asset transfers
handle_transfer:
// Check if this is USDC
txn XferAsset
int ${USDC_ASSET_ID}
==
bz reject

// Allow transfers from the app itself (for claims)
txn Sender
global CurrentApplicationAddress
==
bnz allow

// Allow transfers from the creator (for funding)
txn Sender
byte "creator"
app_global_get
==
bnz allow

reject_already_claimed:
int 0
return

reject_unauthorized:
int 0
return

reject_no_recipient:
int 0
return

reject_no_balance:
int 0
return

reject:
int 0
return

allow:
int 1
return`;
}

function createClearProgram() {
  return `#pragma version 8
int 1
return`;
}

// Generate unsigned transaction for app creation
async function generateUnsignedDeployTransactions({ usdcAmount, recipientEmail, senderAddress }) {
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
    usdcAmount = typeof usdcAmount === 'string' ? parseFloat(usdcAmount) : usdcAmount;
    
    if (typeof usdcAmount !== 'number' || isNaN(usdcAmount) || usdcAmount <= 0) {
      throw new Error("Invalid 'usdcAmount'. Must be a positive number.");
    }
    
    // Generate temporary account for authorization
    const tempAccount = algosdk.generateAccount();
    const tempAddress = tempAccount.addr;
    const tempPrivateKey = Buffer.from(tempAccount.sk).toString('hex');
    
    console.log(`Generated temporary account: ${tempAddress}`);
    
    // Convert to microUnits
    const microUSDCAmount = Math.floor(usdcAmount * 1e6);
    
    // Get suggested parameters
    console.log("Fetching suggested parameters...");
    let suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create clean parameters object 
    const processedParams = {
      fee: 1000,
      firstRound: Number(suggestedParams.firstRound),
      lastRound: Number(suggestedParams.lastRound),
      genesisID: suggestedParams.genesisID,
      genesisHash: suggestedParams.genesisHash,
      flatFee: true
    };
    
    console.log("Processing parameters complete. Generating TEAL programs...");
    
    // Compile the TEAL programs
    const approvalProgramSource = createApprovalProgram(senderAddress, tempAddress);
    const approvalProgram = await compileProgram(approvalProgramSource);
    
    const clearProgramSource = createClearProgram();
    const clearProgram = await compileProgram(clearProgramSource);
    
    console.log("TEAL compilation successful");
    
    // Create application transaction
    try {
      console.log("Creating application transaction...");
      
      const appCreateTxn = new algosdk.Transaction({
        from: senderAddress,
        appIndex: 0,
        appOnComplete: algosdk.OnApplicationComplete.NoOpOC,
        appLocalInts: 0,
        appLocalByteSlices: 0,
        appGlobalInts: 2,
        appGlobalByteSlices: 2,
        appApprovalProgram: approvalProgram,
        appClearProgram: clearProgram,
        appForeignAssets: [USDC_ASSET_ID],
        type: 'appl',
        fee: processedParams.fee,
        flatFee: true,
        firstRound: processedParams.firstRound,
        lastRound: processedParams.lastRound,
        genesisID: processedParams.genesisID,
        genesisHash: processedParams.genesisHash
      });
      
      // Encode the transaction for the frontend
      console.log("Transaction created successfully, encoding...");
      const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(appCreateTxn)).toString('base64');
      
      console.log("Transaction encoded successfully");
      return {
        transaction: encodedTxn,
        tempAccount: {
          address: tempAddress,
          privateKey: tempPrivateKey
        },
        amount: usdcAmount,
        microAmount: microUSDCAmount
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
async function generatePostAppTransactions({ appId, senderAddress, microUSDCAmount, tempAccount, payRecipientFees = false }) {
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
    
    // EXPLICIT FEE CONTROL
    const EXACT_FEES = {
      FUNDING: 1000,           // Payment to fund app
      TEMP_FUNDING: 1000,      // Payment to fund temp account
      RECIPIENT_FUNDING: 1000, // Payment for recipient fees (if enabled)
      SET_CLAIMER: 1000,       // App call to set authorized claimer
      OPT_IN: 2000,           // App call with inner transaction
      SET_AMOUNT: 1000,       // App call (no inner transaction)
      SEND_USDC: 1000         // Asset transfer
    };
    
    // Calculate total fee budget
    const totalFeeNeeded = EXACT_FEES.FUNDING + 
                          EXACT_FEES.TEMP_FUNDING +
                          (payRecipientFees ? EXACT_FEES.RECIPIENT_FUNDING : 0) +
                          EXACT_FEES.SET_CLAIMER +
                          EXACT_FEES.OPT_IN + 
                          EXACT_FEES.SET_AMOUNT + 
                          EXACT_FEES.SEND_USDC;
    
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
    const fundingTxn = new algosdk.Transaction({
      from: senderAddress,
      to: appAddress,
      amount: 300000, // 0.3 ALGO
      fee: EXACT_FEES.FUNDING,
      ...baseParams,
      type: 'pay'
    });
    
    // 2. Fund the temporary account with minimal ALGO for claim transaction
    const tempFundingTxn = new algosdk.Transaction({
      from: senderAddress,
      to: tempAccount.address,
      amount: 102000, 
      fee: EXACT_FEES.TEMP_FUNDING,
      ...baseParams,
      type: 'pay'
    });
    
    // 3. Create recipient funding transaction if enabled
    let recipientFundingTxn = null;
    if (payRecipientFees && process.env.FUNDER_MNEMONIC) {
      try {
        const fundingAccount = algosdk.mnemonicToSecretKey(process.env.FUNDER_MNEMONIC);
        
        recipientFundingTxn = new algosdk.Transaction({
          from: senderAddress,
          to: fundingAccount.addr,
          amount: 400000, // 0.4 ALGO
          fee: EXACT_FEES.RECIPIENT_FUNDING,
          ...baseParams,
          type: 'pay',
          note: new Uint8Array(Buffer.from('Recipient fee funding'))
        });
      } catch (error) {
        console.warn("Warning: Could not decode funding mnemonic, skipping recipient fee payment:", error.message);
      }
    }
    
    // 4. Set the authorized claimer
    const setClaimerTxn = new algosdk.Transaction({
      from: senderAddress,
      appIndex: appIdInt,
      appArgs: [new Uint8Array(Buffer.from("set_claimer"))],
      appAccounts: [tempAccount.address], // Foreign account
      fee: EXACT_FEES.SET_CLAIMER,
      ...baseParams,
      type: 'appl'
    });
    
    // 5. Opt the app into USDC
    const optInTxn = new algosdk.Transaction({
      from: senderAddress,
      appIndex: appIdInt,
      appArgs: [new Uint8Array(Buffer.from("opt_in_asset"))],
      appForeignAssets: [USDC_ASSET_ID],
      fee: EXACT_FEES.OPT_IN,
      ...baseParams,
      type: 'appl'
    });
    
    // 6. Set the amount
    const setAmountTxn = new algosdk.Transaction({
      from: senderAddress,
      appIndex: appIdInt,
      appArgs: [
        new Uint8Array(Buffer.from("set_amount")),
        algosdk.encodeUint64(microUSDCAmount)
      ],
      fee: EXACT_FEES.SET_AMOUNT,
      ...baseParams,
      type: 'appl'
    });
    
    // 7. Send USDC to the app
    const sendUSDCTxn = new algosdk.Transaction({
      from: senderAddress,
      to: appAddress,
      assetIndex: USDC_ASSET_ID,
      amount: microUSDCAmount,
      fee: EXACT_FEES.SEND_USDC,
      ...baseParams,
      type: 'axfer'
    });
    
    // Group transactions
    const txnGroup = recipientFundingTxn 
      ? [fundingTxn, tempFundingTxn, recipientFundingTxn, setClaimerTxn, optInTxn, setAmountTxn, sendUSDCTxn]
      : [fundingTxn, tempFundingTxn, setClaimerTxn, optInTxn, setAmountTxn, sendUSDCTxn];
    
    // Assign group ID
    algosdk.assignGroupID(txnGroup);
    
    // Verify total fees
    const actualTotalFee = txnGroup.reduce((sum, txn) => sum + txn.fee, 0);
    console.log(`Actual group fee total: ${actualTotalFee / 1e6} ALGO`);
    
    // Convert to base64 for transmission
    const encodedTxns = txnGroup.map(txn => 
      Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64')
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

// Generate claim transaction using temporary account
async function generateClaimTransaction({ appId, tempPrivateKey, recipientAddress }) {
  try {
    console.log("Generating claim transaction for app:", appId);
    
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
    
    const appIdInt = parseInt(appId);
    
    // Reconstruct temporary account from private key - FIXED
    const secretKeyUint8 = new Uint8Array(Buffer.from(tempPrivateKey, 'hex'));
    
    // Extract public key from secret key (last 32 bytes) and get address
    const publicKey = secretKeyUint8.slice(32, 64);
    const address = algosdk.encodeAddress(publicKey);
    
    const tempAccountObj = {
      addr: address,
      sk: secretKeyUint8
    };
    
    console.log("Reconstructed temp account address:", tempAccountObj.addr);
    
    // Get suggested parameters
    let suggestedParams = await algodClient.getTransactionParams().do();
    
    // Calculate exact fee
    const exactFee = calculateTransactionFee(true, 1); // 2000 microALGO
    
    // Create claim transaction
    const claimTxn = new algosdk.Transaction({
      from: tempAccountObj.addr,
      appIndex: appIdInt,
      appArgs: [new Uint8Array(Buffer.from("claim"))],
      appAccounts: [recipientAddress], // Where to send USDC
      appForeignAssets: [USDC_ASSET_ID],
      fee: exactFee,
      flatFee: true,
      firstRound: suggestedParams.firstRound,
      lastRound: suggestedParams.lastRound,
      genesisID: suggestedParams.genesisID,
      genesisHash: suggestedParams.genesisHash,
      type: 'appl'
    });
    
    // Sign with temporary account
    const signedTxn = algosdk.signTransaction(claimTxn, tempAccountObj.sk);
    
    console.log(`Claim transaction created and signed with exact fee: ${exactFee / 1e6} ALGO`);
    return { 
      signedTransaction: Buffer.from(signedTxn.blob).toString('base64'),
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

async function generateReclaimTransaction({ appId, senderAddress }) {
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
    
    // Calculate exact fee (1 inner transaction for USDC transfer)
    const exactFee = calculateTransactionFee(true, 1); // 2000 microALGO
    
    const reclaimTxn = new algosdk.Transaction({
      from: senderAddress,
      appIndex: appIdInt,
      appArgs: [new Uint8Array(Buffer.from("reclaim"))],
      appForeignAssets: [USDC_ASSET_ID],
      fee: exactFee,
      flatFee: true, // CRITICAL: Prevents network fee estimation
      firstRound: suggestedParams.firstRound,
      lastRound: suggestedParams.lastRound,
      genesisID: suggestedParams.genesisID,
      genesisHash: suggestedParams.genesisHash,
      type: 'appl'
    });
    
    const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(reclaimTxn)).toString('base64');
    
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
  generateReclaimTransaction, // Placeholder - needs separate implementation
}
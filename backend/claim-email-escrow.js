const algosdk = require('algosdk');
const crypto = require('crypto');
const { hashClaimCode: hexHashClaimCode } = require('./utils/hashUtils');

// Configuration
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = process.env.ALGOD_PORT || '';
const USDC_ASSET_ID = parseInt(process.env.USDC_ASSET_ID) || 10458941; // Testnet USDC asset ID

// Initialize Algorand client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Simple hash function - MUST MATCH the one in deployment script
// This returns binary format for smart contract operations
function hashClaimCode(claimCode) {
  // Use a simple hash approach - SHA256 in binary format
  return crypto.createHash('sha256').update(claimCode).digest();
}

// Function to create a derived hash that incorporates the recipient address
function createDerivedHash(claimCode, recipientAddress) {
  // First convert the address to its byte representation
  const addressBytes = algosdk.decodeAddress(recipientAddress).publicKey;
  
  // Concatenate the claim code (as buffer) with the address bytes
  const combinedBuffer = Buffer.concat([
    Buffer.from(claimCode),
    Buffer.from(addressBytes)
  ]);
  
  // Hash the combined buffer and return binary format
  return crypto.createHash('sha256').update(combinedBuffer).digest();
}

// Function to print the app's global state for debugging
async function printAppState(appId) {
  try {
    const appInfo = await algodClient.getApplicationByID(appId).do();
    const globalState = appInfo.params['global-state'] || [];
    
    console.log(`\nApp ${appId} Global State:`);
    for (const item of globalState) {
      const key = Buffer.from(item.key, 'base64').toString();
      let value;
      
      if (item.value.type === 1) { // Byte array
        try {
          const bytes = Buffer.from(item.value.bytes, 'base64');
          // Try to convert to hex string first (for hash)
          try {
            value = bytes.toString('hex') + " (hex)";
          } catch (e) {
            // If it looks like an address, try to decode it
            if (bytes.length === 32) {
              try {
                const potentialAddress = algosdk.encodeAddress(bytes);
                value = `${bytes.toString('hex')} (potential address: ${potentialAddress})`;
              } catch (e) {
                value = bytes.toString('hex') + " (hex)";
              }
            } else {
              value = bytes.toString('hex') + " (hex)";
            }
          }
        } catch (e) {
          value = item.value.bytes + " (base64)";
        }
      } else { // Uint
        value = item.value.uint;
      }
      
      console.log(`${key}: ${value}`);
    }
    console.log("");
  } catch (error) {
    console.error("Error fetching app state:", error);
  }
}

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
    
    // Reconstruct temporary account from private key
    const secretKeyUint8 = new Uint8Array(Buffer.from(tempPrivateKey, 'hex'));
    const publicKey = secretKeyUint8.slice(32, 64);
    const address = algosdk.encodeAddress(publicKey);
    
    const tempAccountObj = {
      addr: address,
      sk: secretKeyUint8
    };
    
    console.log("Reconstructed temp account address:", tempAccountObj.addr);
    
    // Get suggested parameters
    let suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create ONLY the claim transaction (fees already transferred when wallet connected)
    const claimTxn = new algosdk.Transaction({
      from: tempAccountObj.addr,
      appIndex: appIdInt,
      appArgs: [new Uint8Array(Buffer.from("claim"))],
      appAccounts: [recipientAddress], // Where to send USDC
      appForeignAssets: [USDC_ASSET_ID],
      fee: calculateTransactionFee(true, 1), // 2000 microALGO
      flatFee: true,
      firstRound: suggestedParams.firstRound,
      lastRound: suggestedParams.lastRound,
      genesisID: suggestedParams.genesisID,
      genesisHash: suggestedParams.genesisHash,
      type: 'appl'
    });

    // Sign the transaction with temp account
    const signedTxn = algosdk.signTransaction(claimTxn, tempAccountObj.sk);

    console.log(`Claim transaction created and signed`);
    
    // Return single transaction format (no fee transfer needed)
    return { 
      signedTransaction: Buffer.from(signedTxn.blob).toString('base64'),
      txnId: claimTxn.txID()
    };
  } catch (error) {
    console.error("Error in generateClaimTransaction:", error);
    throw new Error(`Failed to create claim transaction: ${error.message}`);
  }
}

async function generateOptInTransaction(recipientAddress) {
  try {
    console.log("Generating opt-in transaction for:", recipientAddress);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // CHANGE: Use makeAssetTransferTxnWithSuggestedParams instead of direct constructor
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      recipientAddress, // from
      recipientAddress, // to
      undefined, // closeRemainderTo
      undefined, // revocationTarget
      0, // amount (0 for opt-in)
      undefined, // note
      USDC_ASSET_ID, // assetIndex
      suggestedParams // suggestedParams
    );
    
    console.log("Opt-in transaction created successfully");
    
    // CHANGE: Use encodeUnsignedTransaction for consistency
    return {
      transaction: Buffer.from(algosdk.encodeUnsignedTransaction(optInTxn)).toString('base64'),
      txnId: optInTxn.txID()
    };
  } catch (error) {
    console.error("Error generating opt-in transaction:", error);
    throw error;
  }
}

async function checkUserOptedIn(address) {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return accountInfo.assets?.some(asset => asset['asset-id'] === USDC_ASSET_ID) || false;
  } catch (error) {
    console.error("Error checking opt-in status:", error);
    return false;
  }
}

async function claimUSDC(params) {
  try {
    const { claimCode, appId, recipientAddress, signedTransaction } = params;
    
    if (!claimCode || !appId || !recipientAddress) {
      throw new Error("Missing required parameters");
    }
    
    // Check if this is a signed transaction we're submitting
    if (signedTransaction) {
      try {
        console.log("Submitting signed transaction...");
        // Parse transaction from base64
        const txnBytes = Buffer.from(signedTransaction, 'base64');
        
        // Submit the transaction
        const { txId } = await algodClient.sendRawTransaction(txnBytes).do();
        console.log(`Submitted claim transaction with ID: ${txId}`);
        
        // Wait for confirmation
        const txnResult = await algosdk.waitForConfirmation(algodClient, txId, 5);
        
        // Get the app state to verify claim
        await printAppState(appId);
        
        return {
          success: true,
          txId,
          confirmedRound: txnResult['confirmed-round']
        };
      } catch (error) {
        console.error("Error submitting claim transaction:", error);
        return {
          success: false,
          error: error.message
        };
      }
    } else {
      // Just generate the claim transaction
      const txnData = await generateClaimTransaction({
        claimCode,
        appId,
        recipientAddress
      });
      
      return {
        success: true,
        transaction: txnData.transaction,
        txnId: txnData.txnId
      };
    }
  } catch (error) {
    console.error("Error in claim process:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to verify claim code hash match
// This is used to verify a claim attempt matches our database record
async function verifyClaimCodeHash(claimCode, storedHashHex) {
  // Use the hex hash function from utils for database comparison
  const providedHashHex = hexHashClaimCode(claimCode);
  return providedHashHex === storedHashHex;
}

module.exports = {
  claimUSDC,
  generateClaimTransaction,
  generateOptInTransaction,
  checkUserOptedIn,
  hashClaimCode,
  createDerivedHash,
  verifyClaimCodeHash
};
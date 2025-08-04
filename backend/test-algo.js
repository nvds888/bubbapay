const algosdk = require('algosdk');

// Initialize client
const algodClient = new algosdk.Algodv2('', 'https://mainnet-api.algonode.cloud', '');

async function testTransaction() {
  try {
    console.log("Testing Algorand SDK with minimal example");
    console.log("SDK version test: Checking for version info...");
    
    try {
      // Different ways to try getting the version
      if (algosdk.version) {
        console.log("SDK version from direct property:", algosdk.version);
      } else {
        console.log("No direct version property found");
      }
    } catch (e) {
      console.log("Could not access version info:", e.message);
    }
    
    // Create a test account and examine its structure
    console.log("\n=== ACCOUNT GENERATION TEST ===");
    const account = algosdk.generateAccount();
    console.log("Account object type:", typeof account);
    console.log("Account object keys:", Object.keys(account));
    
    // Examine the addr property
    if (account.addr) {
      console.log("addr property type:", typeof account.addr);
      console.log("addr value:", account.addr);
      
      if (typeof account.addr === 'object') {
        console.log("addr is an object with keys:", Object.keys(account.addr));
        
        // Try to extract the actual address
        if (account.addr.publicKey) {
          const encodedAddr = algosdk.encodeAddress(account.addr.publicKey);
          console.log("Encoded address from publicKey:", encodedAddr);
        }
      }
    } else {
      console.log("No addr property found on account");
    }
    
    // Try to get a string address
    let addressStr;
    if (typeof account.addr === 'string') {
      addressStr = account.addr;
    } else if (typeof account.addr === 'object' && account.addr.publicKey) {
      addressStr = algosdk.encodeAddress(account.addr.publicKey);
    } else if (account.sk) {
      console.log("Trying to recover address from secret key");
      const recoveredAcc = algosdk.mnemonicToSecretKey(algosdk.secretKeyToMnemonic(account.sk));
      addressStr = recoveredAcc.addr;
    }
    
    if (!addressStr) {
      throw new Error("Could not get a valid address string");
    }
    
    console.log("Final address string:", addressStr);
    console.log("Address validation:", algosdk.isValidAddress(addressStr));
    
    // Get parameters
    console.log("\n=== PARAMETER FETCHING TEST ===");
    const params = await algodClient.getTransactionParams().do();
    console.log("Raw parameters:", params);
    
    // Process parameters
    const processedParams = {
      fee: 1000,
      firstRound: Number(params.firstValid || params.firstRound || 0),
      lastRound: Number(params.lastValid || params.lastRound || 0),
      genesisID: params.genesisID,
      flatFee: true
    };
    
    // Handle genesisHash specifically
    if (params.genesisHash) {
      if (typeof params.genesisHash === 'object') {
        console.log("genesisHash is an object, converting to base64 string");
        const hashArray = Object.values(params.genesisHash);
        processedParams.genesisHash = Buffer.from(hashArray).toString('base64');
      } else {
        processedParams.genesisHash = params.genesisHash;
      }
    }
    
    console.log("Processed parameters:", processedParams);
    
    // Try various transaction creation methods
    console.log("\n=== TRANSACTION CREATION TESTS ===");
    
    // Test 1: Direct Transaction constructor
    console.log("\nTest 1: Using direct Transaction constructor");
    try {
      const txn1 = new algosdk.Transaction({
        from: addressStr,
        to: addressStr,
        fee: processedParams.fee,
        amount: 1000,
        firstRound: processedParams.firstRound,
        lastRound: processedParams.lastRound,
        genesisID: processedParams.genesisID,
        genesisHash: processedParams.genesisHash,
        type: 'pay'
      });
      
      console.log("Successfully created transaction with direct constructor!");
      console.log("Transaction object:", txn1);
      
      // Test encoding
      const encoded = algosdk.encodeUnsignedTransaction(txn1);
      console.log("Successfully encoded transaction, length:", encoded.length);
    } catch (e) {
      console.error("Direct constructor failed:", e);
    }
    
    // Test 2: Try using makePaymentTxnWithSuggestedParams if available
    console.log("\nTest 2: Using makePaymentTxnWithSuggestedParams (if available)");
    if (typeof algosdk.makePaymentTxnWithSuggestedParams === 'function') {
      try {
        const txn2 = algosdk.makePaymentTxnWithSuggestedParams(
          addressStr,
          addressStr,
          1000,
          undefined,
          undefined,
          processedParams
        );
        console.log("Successfully created transaction with makePaymentTxnWithSuggestedParams!");
      } catch (e) {
        console.error("makePaymentTxnWithSuggestedParams failed:", e);
      }
    } else {
      console.log("makePaymentTxnWithSuggestedParams function not available");
    }
    
    // Test 3: Try using makePaymentTxnWithSuggestedParamsFromObject
    console.log("\nTest 3: Using makePaymentTxnWithSuggestedParamsFromObject");
    if (typeof algosdk.makePaymentTxnWithSuggestedParamsFromObject === 'function') {
      try {
        const txn3 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: addressStr,
          to: addressStr,
          amount: 1000,
          suggestedParams: processedParams
        });
        console.log("Successfully created transaction with makePaymentTxnWithSuggestedParamsFromObject!");
      } catch (e) {
        console.error("makePaymentTxnWithSuggestedParamsFromObject failed:", e);
      }
    } else {
      console.log("makePaymentTxnWithSuggestedParamsFromObject function not available");
    }
    
    // Final success summary
    console.log("\n=== TEST SUMMARY ===");
    let successMethod = "None of the methods worked";
    
    try {
      // One last test with minimal dependencies
      const finalTxn = new algosdk.Transaction({
        from: addressStr,
        to: addressStr,
        fee: 1000,
        amount: 1000,
        firstRound: processedParams.firstRound,
        lastRound: processedParams.lastRound,
        genesisID: processedParams.genesisID,
        genesisHash: processedParams.genesisHash,
        type: 'pay'
      });
      
      const encodedFinal = algosdk.encodeUnsignedTransaction(finalTxn);
      successMethod = "Direct Transaction constructor";
      return `Success using ${successMethod}`;
    } catch (finalError) {
      console.error("Final test also failed:", finalError);
      return `All transaction methods failed: ${finalError.message}`;
    }
  } catch (error) {
    console.error("Test failed with error:", error);
    console.error("Error stack:", error.stack);
    return `Test failed: ${error.message}`;
  }
}

// Run the test
testTransaction()
  .then(result => console.log("Test result:", result))
  .catch(err => console.error("Test error:", err));
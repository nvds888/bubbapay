// teal-programs.js - TEAL Program Generation

// CHANGE 1: Add this import at the top
const { getDefaultAssetId } = require('./assetConfig');

// USDC Asset ID
const USDC_ASSET_ID = 31566704; // Mainnet USDC asset ID

function createApprovalProgram(senderAddress, authorizedClaimerAddress, assetId = null) {
  const targetAssetId = assetId || getDefaultAssetId();
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

// Store authorized claimer address (SET ONCE during creation)
byte "authorized_claimer"
addr ${authorizedClaimerAddress}
app_global_put

// Approve creation
int 1
return

// Handle app calls
handle_app_call:
// CHANGE: Check OnComplete action FIRST before trying to access ApplicationArgs
txn OnCompletion
int 5 // DeleteApplication
==
bnz handle_delete

// CHANGE: Check if we have application arguments before accessing them
txn NumAppArgs
int 0
>
bz reject

// Now safe to check application arguments for NoOp calls
txn ApplicationArgs 0
byte "opt_in_asset"
==
bnz handle_opt_in_asset

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

// Handle delete application
handle_delete:
// Only creator can delete
txn Sender
byte "creator"
app_global_get 
==
bz reject

// Only allow delete when claimed=1
byte "claimed"
app_global_get
int 1
==
bz reject_not_completed

// STEP 1: Opt out of any assets first
txn NumAssets
int 0
>
bz close_account  // If no assets, skip to account closing

// Loop through and opt out of any assets we're opted into
int 0  // Start with asset index 0
store 10  // Store current index

check_next_asset:
load 10  // Load current index
txn NumAssets  // Get number of foreign assets passed
<  // Check if index < number of assets
bz close_account  // If no more assets, close account

// Check if we're opted into this asset
global CurrentApplicationAddress
load 10
txnas Assets  // Get asset at current index
asset_holding_get AssetBalance
store 11  // Store has_balance flag
pop      // Remove balance from stack

// If we're opted into this asset (has_balance flag = 1), opt out
load 11
int 1
==
bz next_asset  // If not opted in, go to next asset

// Opt out of this asset
itxn_begin
int 4  // AssetTransfer
itxn_field TypeEnum
load 10
txnas Assets
itxn_field XferAsset
int 0
itxn_field AssetAmount
global CurrentApplicationAddress
itxn_field Sender
byte "creator"
app_global_get
itxn_field AssetCloseTo  // Opt out and send any remaining balance
int 0
itxn_field Fee
itxn_submit

next_asset:
load 10
int 1
+
store 10  // Increment index
b check_next_asset

close_account:
// STEP 2: Close the account and send ALL ALGO to creator
itxn_begin
int 1 // Payment
itxn_field TypeEnum
int 0 // Send 0 ALGO as amount
itxn_field Amount
global CurrentApplicationAddress
itxn_field Sender
byte "creator"
app_global_get
itxn_field Receiver
byte "creator"
app_global_get
itxn_field CloseRemainderTo 
int 0
itxn_field Fee
itxn_submit

// Now allow app deletion
int 1
return

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
// Check if this is the correct asset
txn XferAsset
int ${targetAssetId}
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

reject_not_completed:
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

module.exports = {
  createApprovalProgram,
  createClearProgram,
  USDC_ASSET_ID: getDefaultAssetId() // For backwards compatibility
};
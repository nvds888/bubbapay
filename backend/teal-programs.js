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
// Check if opting into an asset
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

// NEW: Check if cleaning up contract
txn ApplicationArgs 0
byte "cleanup"
==
bnz handle_cleanup

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

// NEW: Handle cleanup - only for creator when claimed=1
handle_cleanup:
// Only creator can cleanup
txn Sender
byte "creator"
app_global_get 
==
bz reject

// Only allow cleanup when claimed=1 (funds were claimed or reclaimed)
byte "claimed"
app_global_get
int 1
==
bz reject_not_completed

// Step 1: Opt out of asset (close asset holding to creator)
global CurrentApplicationAddress
txn Assets 0
asset_holding_get AssetBalance
store 1 // Store has_balance flag
store 0 // Store balance amount

// Only create asset opt-out transaction if we have asset balance or are opted in
load 1
int 1
==
bnz do_asset_optout

// Step 2: Send remaining ALGO to creator
b do_algo_transfer

do_asset_optout:
itxn_begin
int 4 // AssetTransfer
itxn_field TypeEnum
txn Assets 0
itxn_field XferAsset
load 0 // Send all asset balance
itxn_field AssetAmount
global CurrentApplicationAddress
itxn_field Sender
byte "creator"
app_global_get
itxn_field AssetReceiver
byte "creator" 
app_global_get
itxn_field AssetCloseTo // This opts out of the asset
int 0
itxn_field Fee
itxn_submit

do_algo_transfer:
// Step 2: Send all remaining ALGO to creator
// Calculate available balance (account balance - minimum balance - fees)
global CurrentApplicationAddress
acct_params_get AcctBalance
store 3 // Store success flag
store 2 // Store balance

global CurrentApplicationAddress
acct_params_get AcctMinBalance  
store 5 // Store success flag
store 4 // Store min balance

// Calculate sendable amount: balance - min_balance - fee_reserve
load 2 // total balance
load 4 // min balance
-
int 2000 // Reserve for this transaction fee
-
store 6 // Store sendable amount

// Only send if we have positive amount to send
load 6
int 0
>
bnz do_payment

// If no ALGO to send, we're done
int 1
return

do_payment:
itxn_begin
int 1 // Payment
itxn_field TypeEnum
load 6 // Amount to send
itxn_field Amount
global CurrentApplicationAddress
itxn_field Sender
byte "creator"
app_global_get
itxn_field Receiver
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
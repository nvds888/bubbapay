// teal-programs.js - UPDATED with Auto-Cleanup

const { getDefaultAssetId } = require('./assetConfig');

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

// UPDATED: Handle USDC claim WITH automatic cleanup
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

// Get current ALGO balance for cleanup
global CurrentApplicationAddress
balance
store 1 // Store ALGO balance in register 1

// Begin inner transaction GROUP for claim + cleanup
itxn_begin

// Transaction 1: Transfer USDC to recipient
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

// Transaction 2: Return ALL remaining ALGO to creator (NEW!)
itxn_next
int 1 // Payment
itxn_field TypeEnum
load 1 // Load ALGO balance from register 1
int 1000 // Subtract minimum fee for this transaction
-
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

// UPDATED: Handle reclaim WITH automatic cleanup AND asset close-out
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
store 2 // Store asset balance flag in register 2
store 0 // Store asset balance in register 0

// Get current ALGO balance for cleanup
global CurrentApplicationAddress
balance
store 1 // Store ALGO balance in register 1

// Check if we have any balance
load 2
load 0
int 0
>
&&
bz reject_no_balance

// Begin inner transaction GROUP for reclaim + cleanup + opt-out
itxn_begin

// Transaction 1: Transfer all USDC back to creator
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

// Transaction 2: Close out of asset (opt-out) - recovers min balance (NEW!)
itxn_next
int 4 // AssetTransfer
itxn_field TypeEnum
txn Assets 0
itxn_field XferAsset
int 0 // Zero amount for close-out
itxn_field AssetAmount
global CurrentApplicationAddress
itxn_field Sender
byte "creator"
app_global_get
itxn_field AssetReceiver
byte "creator"
app_global_get
itxn_field AssetCloseTo  // This opts out and returns min balance!
int 0
itxn_field Fee

// Transaction 3: Return ALL remaining ALGO to creator (NEW!)
itxn_next
int 1 // Payment
itxn_field TypeEnum
load 1 // Load ALGO balance from register 1
int 2000 // Subtract fees for the 2 transactions above
-
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
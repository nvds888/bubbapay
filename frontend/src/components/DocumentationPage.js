import React from 'react';

function DocumentationPage() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="card card-normal">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
               style={{background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)'}}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">Documentation</h1>
          <p className="text-gray-600">The architecture behind NomizoPay</p>
        </div>

        {/* Documentation Content */}
        <div className="prose prose-gray max-w-none">
          <div className="text-gray-700 leading-relaxed space-y-8">
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              <p>
                This application aims to solve an onboarding problem for projects & tokens on L1 chains: how to send tokens to someone who may not have a wallet or understand blockchain technology. Built on Algorand, our system creates secure escrow smart contracts that hold USDC until recipients can claim them through shareable links.
              </p>
              <p>
                The security model uses temporary accounts and hash-based database protection to ensure only legitimate recipients can access funds while preventing unauthorized claims even if backend systems are compromised.
              </p>
              
              {/* Security Disclaimer */}
              <div className="status-error mt-6 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-red-800 font-semibold text-lg mb-2">⚠️ CRITICAL SECURITY NOTICE</h4>
                    <p className="text-red-700 mb-3">
                      <strong>NomizoPay is experimental software provided "as is" without warranty.</strong> We take no responsibility for lost, stolen, or inaccessible funds. Users assume all risks when using this service.
                    </p>
                    <p className="text-red-700 text-sm">
                      Always verify claim links are secure, never share private keys, and only send amounts you can afford to lose. Smart contracts are immutable - transactions cannot be reversed.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Use Cases & Applications</h2>
              <p>
                NomizoPay enables seamless USDC transfers - and other ASAs soon - for various scenarios where traditional crypto onboarding creates friction:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="card card-compact bg-gray-50">
                  <h4 className="text-purple-700 font-semibold mb-2">🚀 Algorand Onboarding</h4>
                  <p className="text-sm text-gray-600">
                    Introduce new users to Algorand projects with fee-covered transfers. Recipients get USDC and ALGO for transactions without needing prior blockchain knowledge.
                  </p>
                </div>
                
                <div className="card card-compact bg-gray-50">
                  <h4 className="text-green-700 font-semibold mb-2">🌍 Cross-Border Payments</h4>
                  <p className="text-sm text-gray-600">
                    Send USDC instantly across the planet, 24/7, with minimal fees. Perfect for remittances, international business, or emergency funding, when you need to send USDC to someone who doesn't have a wallet.
                  </p>
                </div>
                
                <div className="card card-compact bg-gray-50">
                  <h4 className="text-yellow-700 font-semibold mb-2">🎯 Memecoin Onboarding</h4>
                  <p className="text-sm text-gray-600">
                    Send USDC to friends for trading memecoins on Vestige or other DEXs. They receive both the USDC and transaction fees covered.
                  </p>
                </div>
                
                <div className="card card-compact bg-gray-50">
                  <h4 className="text-blue-700 font-semibold mb-2">💳 Social Payments</h4>
                  <p className="text-sm text-gray-600">
                    Pay back friends with USDC they can spend immediately using Pera Wallet's debit card. Perfect for splitting bills or casual payments.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">The Escrow Architecture</h2>
              <p>
                At the heart of the system is a smart contract (Application) that acts as an autonomous escrow agent. When someone wants to send USDC, the system generates a unique temporary account and deploys a new smart contract instance specifically for that transfer.
              </p>
              
              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Sender      │    │  Smart Contract │    │   Recipient     │
│                 │    │     Escrow      │    │                 │
│  ┌───────────┐  │    │                 │    │  ┌───────────┐  │
│  │   USDC    │──┼───►│   Holds USDC    │◄───┼──│ Temp Acct │  │
│  └───────────┘  │    │                 │    │  └───────────┘  │
│                 │    │ • Creator addr  │    │                 │
│                 │    │ • Amount        │    │                 │
│                 │    │ • Auth claimer  │    │                 │
│                 │    │ • Claimed flag  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘`}
                </pre>
              </div>

              <p>
                The smart contract stores the creator's address, the transfer amount, whether funds have been claimed, and most importantly, the specific temporary account address authorized to claim the funds. This temporary account address is compiled directly into the smart contract's code upon creation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Temporary Account Security Model</h2>
              <p>
                NomizoPay uses unique temporary accounts that are generated for each transfer. These accounts serve as cryptographic authorization tokens that cannot be forged or transferred between escrows.
              </p>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Temporary Account Generation Flow</h3>
              
              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`Transfer Creation:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Generate Unique │───▶│ Embed Address   │───▶│ Fund Temp Acct  │
│ Temp Account    │    │ in TEAL Code    │    │ for One Claim   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Fresh Keypair            Immutable Auth           Single-Use Token`}
                </pre>
              </div>

              <p>
                Each temporary account is generated fresh with a new keypair that has never existed before. The account address gets embedded in the smart contract's approval program during compilation. This creates an immutable authorization mechanism where only that specific account can trigger fund release.
              </p>
              <p>
                The temporary account receives minimal funding - just enough ALGO to execute one claim transaction. After successful claiming, the account becomes effectively useless since it holds no funds and its authorization has been consumed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Fee Coverage System</h2>
              <p>
                When senders enable "Cover Recipient Fees," the system provides recipients with ALGO to enable immediate use of their USDC within the broader Algorand ecosystem. This funding covers USDC opt-in fees (if the recipient hasn't previously used USDC) and provides ALGO for future transactions, allowing recipients to directly spend their USDC or interact with other Algorand dApps without requiring prior blockchain knowledge or funding.
              </p>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Fee Coverage Flow</h3>
              
              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`Fee Coverage Process:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Sender Opts for │───▶│ 0.4 ALGO Sent   │───▶│ Recipient Gets  │
│ Fee Coverage    │    │ to Temp Account │    │ ALGO for Claim  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   +0.001 ALGO fee       Temp Account Holds        Auto-Transfer
   Added to Cost         Fee Coverage              When Wallet Connected`}
                </pre>
              </div>

              <p>
                The fee coverage is stored in the temporary account and automatically transferred to the recipient when they connect their wallet. This enables truly frictionless onboarding where recipients need zero prior blockchain experience or funding to claim their USDC.
              </p>
              
              <div className="status-warning my-4">
                <p className="text-amber-800 text-sm">
                  <strong>Important:</strong> Fee coverage uses the temporary account as an intermediary. If the temp account is compromised, both the USDC authorization and fee coverage could be at risk.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hash-Based Database Protection</h2>
              <p>
                The database layer implements a hash-based lookup system that protects claim credentials even if the database is completely compromised.
              </p>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Database Security Architecture</h3>
              
              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`Claim URL: /claim?key=ABC123...&app=12345
                    │
                    ▼
Database Lookup Process:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Hash(key+appId) │───▶│ Lookup by Hash  │───▶│ Return Escrow   │
│ SHA256(ABC...+  │    │ in Database     │    │ Metadata Only   │
│ 12345)          │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Secure Hash            claimHash Field           No Private Keys
   a1b2c3d4e5f6...       in Database Record        Ever Stored`}
                </pre>
              </div>

              <p>
                When an escrow is created, the system generates a SHA256 hash combining the temporary account's private key with the application ID. This hash becomes the database lookup key, while the actual private key never touches the database.
              </p>
              <p>
                During claims, the system recreates this hash from the URL parameters and uses it to find the escrow record. Only someone with both the original private key AND the correct app ID can generate the matching hash.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">The Two-Phase Transaction Process</h2>
              <p>
                Creating an escrow involves two distinct phases to ensure atomic execution and proper setup.
              </p>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Phase One: Contract Deployment</h3>
              
              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`Smart Contract Creation:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Compile TEAL    │───▶│ Deploy Contract │───▶│ Get App ID      │
│ with Temp Addr  │    │ to Blockchain   │    │ for Phase 2     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Authorization Baked    Immutable on Chain     Ready for Funding
   Into Contract Code     Cannot Be Modified     and Configuration`}
                </pre>
              </div>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Phase Two: Atomic Configuration</h3>
              
              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`Atomic Transaction Group (includes Platform Fee):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Fund Contract   │───▶│ Platform Fee    │───▶│ Configure &     │
│ & Temp Account  │    │ (0.1 ALGO)      │    │ Transfer USDC   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   ALGO for Operations    Service Fee Payment      Final Fund Transfer
   All or Nothing         All or Nothing           All or Nothing`}
                </pre>
              </div>

              <p>
                The second phase uses Algorand's atomic transfers to ensure all configuration steps succeed together or fail completely. This includes platform fee payment, contract funding, and optional recipient fee coverage. This prevents partial states where funds might be locked or lost due to incomplete setup.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Claim Verification Flow</h2>
              <p>
                The claiming process consists ofa hash validation check & opt-in check before an user can submit a claim to the App (if using our backend to access App).
              </p>

              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`Complete Claim Process:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User Clicks     │───▶│ Hash Validation │───▶│ Temp Account    │
│ Claim URL       │    │ Against Database│    │ Signs Claim     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   key=ABC...&app=123     Hash(ABC...+123)        Only Valid Signer
   Private Key + App ID   Must Match Stored       for This Escrow`}
                </pre>
              </div>

              <p>
                The verification happens at both the application layer through hash validation and the blockchain layer through smart contract logic. The system automatically tests whether the recipient is already opted into USDC. If not, the recipient must first sign a USDC opt-in transaction, which can be funded by the fee coverage they received upon wallet connection if the sender enabled this feature.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Fund Recovery and Reclaim Mechanisms</h2>
              <p>
                The original creator can always reclaim funds from unclaimed transfers. The smart contract includes a reclaim function that allows only the original sender to recover their USDC if the recipient never claims it or loses access to the claim URL.
              </p>

              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`Reclaim Process:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Creator Calls   │───▶│ Verify Sender   │───▶│ Transfer USDC   │
│ Reclaim Function│    │ = Original      │    │ Back to Creator │
│                 │    │ Creator Address │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Only Creator Can        Address Match +          All Funds Return
   Initiate Reclaim        Not Yet Claimed          to Original Sender`}
                </pre>
              </div>

              <p>
                The reclaim verification mirrors the claim process but checks the creator's address instead of the temporary account. The smart contract ensures that funds haven't already been claimed before allowing reclaim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security Assumptions and Trust Model</h2>
              <p>
                The security model relies on several key assumptions while minimizing required trust in centralized components.
              </p>
              
              <div className="status-error my-4">
                <p className="text-red-700 text-sm">
                  <strong>DISCLAIMER:</strong> Users are solely responsible for the security of their funds. NomizoPay cannot recover lost funds, reverse transactions, or guarantee smart contract behavior. Use at your own risk.
                </p>
              </div>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Trust Requirements</h3>
              
              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`High Trust Components:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User's Wallet   │    │ Algorand        │    │ Smart Contract  │
│ Software        │    │ Network         │    │ Logic           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Must Protect Keys      Must Validate Txns      Must Execute Correctly
   Must Sign Correctly    Must Remain Secure      Conservative Design

Limited Risk Components:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Database        │    │ Backend API     │    │ Frontend UI     │
│ (Hashes Only)   │    │ (Availability)  │    │ (UX Only)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Breach Cannot       Can Deny Service        Cannot Access
   Expose Keys         Cannot Steal Funds      User Funds, but can access claim URL`}
                </pre>
              </div>

              <p>
                The hash-based database protection means that even complete database compromise cannot expose claim credentials. The backend API can deny service but cannot steal funds since all verification logic lives in immutable smart contracts. Importantly, funds remain accessible directly through the Algorand blockchain using the claim URL even if Nomizo Pay's service becomes unavailable, as the smart contracts operate independently of our infrastructure.
              </p>
              <p>
                The frontend UI can be compromised and potentially expose the unique claim URL, but we've implemented multiple security measures to mitigate this risk such as immediate history sanitization, smart masking, auto-clear for clipboard, and more.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Remaining Security Considerations</h2>
              <p>
                The system cannot prevent legitimate scenarios where multiple people have access to the same claim URL, such as shared links forwarded to multiple recipients or send through insecure channels. Or if a user's browser is compromised.
              </p>
              <p>
                <strong>Critical:</strong> The unique claim URL grants complete access to the escrowed funds. Users must store and transfer these URLs securely using encrypted channels, or other secure methods. Anyone with access to the claim URL can immediately claim the funds without additional authentication.
              </p>
              <p>
                The combination of temporary account authorization, hash-based database protection, creator reclaim rights, and careful separation of concerns creates a system where users can send and receive low-value transfers with confidence, even when dealing with unfamiliar recipients or in situations where traditional payment methods would be impractical.
              </p>
              
              <div className="status-error my-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-red-800 font-semibold mb-1">Final Security Warning</h4>
                    <p className="text-red-700 text-sm">
                      Smart contracts are immutable and experimental! NomizoPay assumes no liability for lost funds, smart contract bugs, network failures, or user errors. Only send amounts you can afford to lose completely.
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Back to top button */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="btn-secondary px-4 py-2 font-medium"
          >
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              <span>Back to Top</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentationPage;
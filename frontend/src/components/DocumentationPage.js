import React from 'react';

function DocumentationPage() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="glass-dark border border-purple-500/20 rounded-2xl p-8 lg:p-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Technical Documentation</h1>
          <p className="text-gray-400 text-lg">Understanding the security architecture behind Nomizo Pay</p>
        </div>

        {/* Documentation Content */}
        <div className="prose prose-invert max-w-none">
          <div className="text-gray-300 leading-relaxed space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
              <p>
                This application solves a fundamental problem in cryptocurrency: how to send digital assets to someone who may not have a wallet or understand blockchain technology. Built on Algorand, our system creates secure escrow smart contracts that hold USDC until recipients can claim them, either through email notifications or shareable links.
              </p>
              <p>
                The security model uses temporary accounts and hash-based database protection to ensure only legitimate recipients can access funds while preventing unauthorized claims even if backend systems are compromised.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">The Smart Contract Architecture</h2>
              <p>
                At the heart of the system is a smart contract that acts as an autonomous escrow agent. When someone wants to send USDC, the system generates a unique temporary account and deploys a new smart contract instance specifically for that transfer.
              </p>
              
              <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 my-6">
                <pre className="text-sm text-gray-300 overflow-x-auto">
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
                The smart contract stores the creator's address, the transfer amount, whether funds have been claimed, and most importantly, the specific temporary account address authorized to claim the funds. This temporary account address is compiled directly into the smart contract's TEAL code, making it immutable and tamper-proof.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Temporary Account Security Model</h2>
              <p>
                The core security innovation centers on unique temporary accounts generated for each transfer. These accounts serve as cryptographic authorization tokens that cannot be forged or transferred between escrows.
              </p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">Temporary Account Generation Flow</h3>
              
              <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 my-6">
                <pre className="text-sm text-gray-300 overflow-x-auto">
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
                Each temporary account is generated fresh with a new keypair that has never existed before. The account address gets embedded as a constant in the smart contract's approval program during compilation. This creates an immutable authorization mechanism where only that specific account can trigger fund release.
              </p>
              <p>
                The temporary account receives minimal funding - just enough ALGO to execute one claim transaction. After successful claiming, the account becomes effectively useless since it holds no funds and its authorization has been consumed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Hash-Based Database Protection</h2>
              <p>
                The database layer implements a hash-based lookup system that protects claim credentials even if the database is completely compromised.
              </p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">Database Security Architecture</h3>
              
              <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 my-6">
                <pre className="text-sm text-gray-300 overflow-x-auto">
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
              <h2 className="text-2xl font-bold text-white mb-4">The Two-Phase Transaction Process</h2>
              <p>
                Creating an escrow requires careful orchestration across two distinct phases to ensure atomic execution and proper security setup.
              </p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">Phase One: Contract Deployment</h3>
              
              <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 my-6">
                <pre className="text-sm text-gray-300 overflow-x-auto">
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

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">Phase Two: Atomic Configuration</h3>
              
              <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 my-6">
                <pre className="text-sm text-gray-300 overflow-x-auto">
{`Atomic Transaction Group:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Fund Contract   │───▶│ Configure       │───▶│ Transfer USDC   │
│ & Temp Account  │    │ Parameters      │    │ to Contract     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   ALGO for Operations    Set Amount + Opt-in      Final Fund Transfer
   All or Nothing         Contract State           All or Nothing`}
                </pre>
              </div>

              <p>
                The second phase uses Algorand's atomic transfers to ensure all configuration steps succeed together or fail completely. This prevents partial states where funds might be locked or lost due to incomplete setup.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Claim Verification Flow</h2>
              <p>
                The claiming process combines temporary account authorization with hash-based validation to create a two-factor security system.
              </p>

              <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 my-6">
                <pre className="text-sm text-gray-300 overflow-x-auto">
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
                The verification happens at both the application layer through hash validation and the blockchain layer through smart contract logic. Both checks must pass for funds to be released.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Fund Recovery and Reclaim Mechanisms</h2>
              <p>
                The original creator can always reclaim funds from unclaimed transfers. The smart contract includes a reclaim function that allows only the original sender to recover their USDC if the recipient never claims it or loses access to the claim URL.
              </p>

              <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 my-6">
                <pre className="text-sm text-gray-300 overflow-x-auto">
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
                The reclaim verification mirrors the claim process but checks the creator's address instead of the temporary account. The smart contract ensures that funds haven't already been claimed before allowing reclaim, preventing double-spending scenarios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Security Assumptions and Trust Model</h2>
              <p>
                The security model relies on several key assumptions while minimizing required trust in centralized components.
              </p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">Trust Requirements</h3>
              
              <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 my-6">
                <pre className="text-sm text-gray-300 overflow-x-auto">
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
   Expose Keys         Cannot Steal Funds      User Funds`}
                </pre>
              </div>

              <p>
                The hash-based database protection means that even complete database compromise cannot expose claim credentials. The backend API can deny service but cannot steal funds since all verification logic lives in immutable smart contracts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Remaining Security Considerations</h2>
              <p>
                The system cannot prevent legitimate scenarios where multiple people have access to the same claim URL, such as shared links forwarded to multiple recipients. In such cases, whoever submits a valid claim first will succeed, and subsequent attempts will fail due to the smart contract's claimed flag.
              </p>
              <p>
                The temporary account funding mechanism creates a natural rate limit where each escrow can only be claimed once, since the temporary account becomes depleted after successful claim execution. This prevents replay attacks and ensures each authorization token is single-use.
              </p>
              <p>
                The combination of temporary account authorization, hash-based database protection, creator reclaim rights, and careful separation of concerns creates a system where users can send and receive USDC with confidence, even when dealing with unfamiliar recipients or in situations where traditional payment methods would be impractical.
              </p>
            </section>

          </div>
        </div>

        {/* Back to top button */}
        <div className="text-center mt-12 pt-8 border-t border-purple-500/20">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="btn-secondary px-6 py-3 rounded-xl font-semibold"
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
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
          <p className="text-gray-600">How BubbaPay works</p>
        </div>

        {/* Documentation Content */}
        <div className="prose prose-gray max-w-none">
          <div className="text-gray-700 leading-relaxed space-y-8">
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What is BubbaPay?</h2>
              <p>
                BubbaPay lets you send USDC and other ASAs to anyone with just a shareable link - even if they don't have a crypto wallet yet. It's perfect for onboarding new users to Algorand or sending payments to people unfamiliar with blockchain technology.
              </p>
              <p>
                The system uses smart contracts to hold your tokens safely until the recipient claims them. Think of it like a secure digital envelope that only the intended recipient can open.
              </p>
              
              {/* Security Disclaimer */}
              <div className="status-error mt-6 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-red-800 font-semibold text-lg mb-2">⚠️ IMPORTANT SECURITY NOTICE</h4>
                    <p className="text-red-700 mb-3">
                      <strong>BubbaPay is experimental software provided "as is" without warranty.</strong> We take no responsibility for lost, stolen, or inaccessible funds. Use at your own risk with amounts you can afford to lose.
                    </p>
                    <p className="text-red-700 text-sm">
                      Always keep claim links secure, never share them through unsecured channels, and remember that smart contracts are permanent - transactions cannot be reversed.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Perfect For</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="card card-compact bg-gray-50">
                  <h4 className="text-purple-700 font-semibold mb-2">🚀 Crypto Onboarding</h4>
                  <p className="text-sm text-gray-600">
                    Introduce friends and family to Algorand. They get tokens plus transaction/opt-in fees covered, no prior crypto knowledge needed.
                  </p>
                </div>
                
                <div className="card card-compact bg-gray-50">
                  <h4 className="text-green-700 font-semibold mb-2">🌍 Global Payments</h4>
                  <p className="text-sm text-gray-600">
                    Send USDC anywhere in the world instantly, 24/7, with minimal fees. Perfect for emergency funding or international payments.
                  </p>
                </div>
                
                <div className="card card-compact bg-gray-50">
                  <h4 className="text-yellow-700 font-semibold mb-2">🎯 Trading Kickstart</h4>
                  <p className="text-sm text-gray-600">
                    Send USDC for trading memecoins or DeFi. Recipients get both the USDC and gas fees to start trading immediately.
                  </p>
                </div>
                
                <div className="card card-compact bg-gray-50">
                  <h4 className="text-blue-700 font-semibold mb-2">💳 Social Payments</h4>
                  <p className="text-sm text-gray-600">
                    Pay back friends with USDC they can spend immediately. Perfect for splitting bills or casual payments.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
              <p>
                When you send tokens through BubbaPay, we create a custom smart contract that acts like a secure digital vault. Here's the simple flow:
              </p>
              
              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   You Send      │───▶│  Smart Contract │◀───│   Recipient     │
│   Tokens        │    │   Holds Safely  │    │   Claims Tokens │
│                 │    │                 │    │                 │
│  • Choose amt   │    │ • Stores tokens │    │ • Click link    │
│  • Get link     │    │ • Waits for     │    │ • Connect wallet│
│  • Share link   │    │   valid claim   │    │ • Get tokens    │
└─────────────────┘    └─────────────────┘    └─────────────────┘`}
                </pre>
              </div>

              <p>
                Each transfer gets its own unique smart contract and claim link. Only someone with the exact link can claim the tokens, and once claimed, the creator can clean up the contract.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Fee Coverage Feature</h2>
              <p>
                When you enable "Cover Recipient Fees," we make crypto completely frictionless for recipients. Here's what happens:
              </p>

              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`Fee Coverage Flow:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ You Enable Fee  │───▶│ System Provides │───▶│ Recipient Gets  │
│ Coverage (+0.21  │    │ ALGO for    │    │ Everything Free │
│ ALGO cost)      │    │ Fees & opt-in    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Small Extra Cost      Covers Wallet Setup        Zero Crypto Needed
   For You              & Future Transactions        For Recipient`}
                </pre>
              </div>

              <p>
                This covers their wallet setup, claiming transaction, and provides ALGO for future use. Recipients can immediately start using their tokens without needing to understand fees or get ALGO from elsewhere.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Automatic Cleanup System</h2>
              <p>
                After tokens are claimed or reclaimed, smart contract and temp funding wallets get cleaned up. This happens in two phases:
              </p>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Phase 1: Claim Transaction</h3>
              
              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`When Recipient Claims:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Contract Sends  │───▶│ Temporary Acct  │───▶│ Platform Gets   │
│ Tokens to       │    │ Closes & Sends  │    │ Remaining ALGO  │
│ Recipient       │    │ ALGO to Platform│    │ (Service Fee)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘`}
                </pre>
              </div>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Phase 2: Contract Cleanup</h3>
              
              <div className="card card-compact bg-gray-50 font-mono text-sm my-6 overflow-x-auto">
                <pre className="text-gray-700">
{`After Claim/Reclaim:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Contract Marked │───▶│ You Can Delete  │───▶│ Recover ~0.31   │
│ as "Completed"  │    │ Smart Contract  │    │ ALGO Back       │
└─────────────────┘    └─────────────────┘    └─────────────────┘`}
                </pre>
              </div>

              <p>
                The cleanup feature on the transactions page lets you delete completed contracts and recover most of the ALGO that was locked up during the transfer process.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security Model</h2>
              <p>
                BubbaPay uses multiple layers of security to protect your transfers:
              </p>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Unique Authorization</h3>
              <p>
                Every transfer creates a unique temporary account that's embedded directly into the smart contract code. This cannot be forged, transferred, or reused for other transfers.
              </p>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Database Protection</h3>
              <p>
                Our database doesn't store private keys - only hashes for reference. Even if our database was completely compromised, attackers couldn't access your funds because they don't have the actual keys.
              </p>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Blockchain Independence</h3>
              <p>
                Your funds are held by smart contracts on the Algorand blockchain, not by us. Even if BubbaPay disappeared tomorrow, you could still interact with the contracts directly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What You Need to Know</h2>
              
              <div className="status-warning my-4">
                <p className="text-amber-800 text-sm">
                  <strong>Claim Links Are Like Cash:</strong> Anyone with a claim link can access the funds. Share them securely - through encrypted messaging or other secure channels.
                </p>
              </div>

              <h3 className="text-xl font-medium text-purple-700 mb-3 mt-6">Recovery Options</h3>
              <p>
                You can always reclaim your tokens if the recipient never claims them. The smart contract ensures only you (the original sender) can recover unclaimed funds.
              </p>
              
              <div className="status-error my-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-red-800 font-semibold mb-1">Final Reminder</h4>
                    <p className="text-red-700 text-sm">
                      This is experimental software. Smart contracts are permanent and irreversible. Only send amounts you can afford to lose, and always verify claim links are secure before sharing.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Supported Assets</h2>
              <p>
                Currently supporting USDC, xUSD, MONKO, and ALPHA. Each asset transfer works the same way - secure, fast, and user-friendly.
              </p>
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
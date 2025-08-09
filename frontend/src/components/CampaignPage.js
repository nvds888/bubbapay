import React from 'react';
import { Link } from 'react-router-dom';

function CampaignPage() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="card card-normal relative overflow-hidden">
        {/* Purple gradient background within the card */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-pink-500/20"></div>
        
        {/* Subtle animated elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-pink-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>

        {/* Content */}
        <div className="relative z-10 text-white">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-gradient-to-br from-purple-400 to-pink-500 shadow-xl shadow-purple-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              BubbaPay Campaigns
            </h1>
            <p className="text-lg text-purple-200 mb-6 max-w-3xl mx-auto leading-relaxed">
              Launch affiliate campaigns in minutes. Reward users for onboarding new members to your Algorand project.
            </p>
            
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg shadow-xl shadow-purple-500/25 mb-8">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Coming Soon
            </div>
          </div>

          {/* What is BubbaPay Campaigns */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">What are BubbaPay Campaigns?</h2>
            <p className="text-purple-100 mb-6 leading-relaxed">
              A lightweight, flexible way for Algorand projects to run affiliate/referral campaigns without smart contract integration. 
              Projects can create campaigns within minutes with almost no costs, and reward users for onboarding new users to their protocol.
            </p>
            <p className="text-purple-100 leading-relaxed">
              Campaigns are specifically targeted at gaming projects, NFT creators, NFT marketplaces, tools, and DeFi platforms. 
              The unique selling point is rapid deployment with customizable validation rules.
            </p>
          </div>

          {/* How It Works */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Campaign Flow</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-300/20">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Project Launches Campaign</h3>
                <ul className="text-purple-200 text-sm space-y-2">
                  <li>• Define rules for successful referrals</li>
                  <li>• Choose reward type: tokens/NFT/vouchers</li>
                  <li>• Fund reward pool or delegate payouts</li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-300/20">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Referrer Sends Tokens</h3>
                <ul className="text-purple-200 text-sm space-y-2">
                  <li>• Uses standard BubbaPay link flow</li>
                  <li>• Sends campaign-specified assets</li>
                  <li>• Invests skin in the game</li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-300/20">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Recipient Claims Link</h3>
                <ul className="text-purple-200 text-sm space-y-2">
                  <li>• New wallet receives assets</li>
                  <li>• Only one recipient per link</li>
                  <li>• Behavior tracking begins</li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-300/20">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">4</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Rewards Distributed</h3>
                <ul className="text-purple-200 text-sm space-y-2">
                  <li>• BubbaPay validates criteria after set period</li>
                  <li>• Eligible referrers earn rewards</li>
                  <li>• Recipients get bonus rewards</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Example Campaign */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Example: Tinyman Referral Campaign</h2>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-300/20">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Tinyman Referral Campaign</h3>
                  <p className="text-purple-200">Goal: Onboard users who swap at least twice</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3">Requirements</h4>
                  <ul className="space-y-2 text-purple-200 text-sm">
                    <li>• Recipient must claim the link</li>
                    <li>• Complete 1 swap in week 1 and 1 in week 2</li>
                    <li>• Retain campaign token (not sell immediately)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-3">Rewards</h4>
                  <ul className="space-y-2 text-purple-200 text-sm">
                    <li>• Referrer earns: 1.5 USD in $TINY</li>
                    <li>• New user earns: 0.2 USD in $TINY</li>
                    <li>• Fee coverage included</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Rules */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Customizable Validation Rules</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-purple-300/20">
                <h4 className="text-purple-300 font-semibold mb-2">🎮 Gaming Projects</h4>
                <p className="text-purple-200 text-sm">
                  Track interactions with specific App IDs, achievement unlocks, or gameplay milestones.
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-purple-300/20">
                <h4 className="text-purple-300 font-semibold mb-2">🖼️ NFT Marketplaces</h4>
                <p className="text-purple-200 text-sm">
                  Validate NFT listings, purchases, or collection interactions within campaign period.
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-purple-300/20">
                <h4 className="text-purple-300 font-semibold mb-2">🔧 DeFi Platforms</h4>
                <p className="text-purple-200 text-sm">
                  Require X trades, liquidity provision, or specific protocol interactions.
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-purple-300/20">
                <h4 className="text-purple-300 font-semibold mb-2">⚡ Tools & Utilities</h4>
                <p className="text-purple-200 text-sm">
                  Track wallet creation, transaction volume, or feature utilization metrics.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Why Choose BubbaPay Campaigns?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-purple-300 mb-4">For Projects</h3>
                <ul className="space-y-2 text-purple-200 text-sm">
                  <li>🔧 No tech integration required</li>
                  <li>🪄 Set up campaigns in minutes</li>
                  <li>👁 Fully on-chain and transparent</li>
                  <li>📈 Track real user onboarding metrics</li>
                  <li>⚡ Easy distribution via BubbaPay tools</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-purple-300 mb-4">For Affiliates</h3>
                <ul className="space-y-2 text-purple-200 text-sm">
                  <li>🤑 Earn rewards for onboarding friends</li>
                  <li>🛠 No smart contract deployment needed</li>
                  <li>🧠 Choose campaigns matching interests</li>
                  <li>🪪 Skin in the game = aligned incentives</li>
                  <li>💰 Transparent, automatic payouts</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Launch Partners */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Launch Partners</h2>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-300/20">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Planeify</h3>
                  <p className="text-purple-200">Flight booking platform on Algorand</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500/20 to-orange-400/20 rounded-lg p-4 border border-orange-400/30">
                <p className="text-orange-200 text-sm font-medium">
                  <strong>Campaign Rewards:</strong> 20 free booking credits for new users who complete their first flight search + affiliate bonuses for successful referrals
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Launch Your Campaign?</h2>
            <p className="text-lg text-purple-200 mb-6 max-w-2xl mx-auto">
              Be among the first projects to leverage BubbaPay Campaigns. Join our waitlist for early access.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:scale-105">
                Join Waitlist
              </button>
              
              <Link 
                to="/docs"
                className="bg-white/10 backdrop-blur-lg border border-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
              >
                Learn More
              </Link>
            </div>
            
            <p className="text-purple-300 text-sm mt-4">
              No setup fees • Launch in minutes • Full Algorand integration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampaignPage;
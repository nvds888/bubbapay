import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function WhiteLabelPage() {
  const [activeTab, setActiveTab] = useState('startup');
  const [campaignType, setCampaignType] = useState('interaction');

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-transparent to-pink-500/20"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-gradient-to-br from-purple-400 to-pink-500 shadow-2xl shadow-purple-500/25">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
            BubbaPay Referrals
          </h1>
          <p className="text-2xl text-purple-200 mb-4 max-w-4xl mx-auto leading-relaxed font-medium">
            Performance marketing for crypto startups
          </p>
          <p className="text-xl text-purple-300 mb-8 max-w-3xl mx-auto">
            Create campaigns, onboard users, track conversions onchain. Zero integration required.
          </p>
          
          {/* Beta Badge */}
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-lg shadow-xl shadow-orange-500/25 mb-8">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Coming Soon - Beta
          </div>
        </div>

        {/* Demo Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-purple-300/20 mb-16">
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 p-1 rounded-xl border border-purple-300/20">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('startup')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'startup' 
                      ? 'bg-white text-purple-900 shadow-lg' 
                      : 'text-purple-200 hover:text-white'
                  }`}
                >
                  For Startups
                </button>
                <button
                  onClick={() => setActiveTab('affiliate')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'affiliate' 
                      ? 'bg-white text-purple-900 shadow-lg' 
                      : 'text-purple-200 hover:text-white'
                  }`}
                >
                  For Affiliates
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'startup' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Campaign Creation Demo */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Create Campaign</h3>
                  <p className="text-gray-600 text-sm">Launch your referral campaign in minutes</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Type</label>
                    <select 
                      value={campaignType}
                      onChange={(e) => setCampaignType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="interaction">App Interaction</option>
                      <option value="swap">Minimum Swap Amount</option>
                      <option value="deposit">Liquidity Deposit</option>
                      <option value="nft">NFT Purchase</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target App ID</label>
                    <input
                      type="text"
                      placeholder="123456789"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reward Per Conversion</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="50.00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        USDC
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Payment method</span>
                      <span className="text-gray-700 font-medium">Pay per conversion</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tracking</span>
                      <span className="text-gray-700 font-medium">Onchain verification</span>
                    </div>
                  </div>
                  
                  <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]">
                    Launch Campaign
                  </button>
                </div>
              </div>

              {/* Campaign Flow */}
              <div className="space-y-6">
                <div className="bg-white/20 rounded-xl p-4 border border-purple-300/30">
                  <h4 className="text-white font-semibold mb-3">How It Works</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Campaign Goes Live</div>
                        <div className="text-purple-200">Instantly available in affiliate marketplace</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Affiliates Share</div>
                        <div className="text-purple-200">Branded landing pages onboard new users</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Onchain Verification</div>
                        <div className="text-purple-200">Automatic tracking of app interactions</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">4</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Pay Per Result</div>
                        <div className="text-purple-200">Only pay for successful conversions</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 rounded-xl p-4 border border-purple-300/30">
                  <h4 className="text-white font-semibold mb-3">Zero Integration</h4>
                  <div className="text-purple-200 text-sm space-y-2">
                    <p>• No code changes to your app</p>
                    <p>• No API integration required</p>
                    <p>• Works with existing smart contracts</p>
                    <p>• BubbaPay handles all user onboarding</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'affiliate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Affiliate Dashboard Demo */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Available Campaigns</h3>
                  <p className="text-gray-600 text-sm">Browse and promote active campaigns</p>
                </div>
                
                <div className="space-y-4">
                  {/* Campaign Cards */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">DeFi Swap Protocol</h4>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">$75 USDC</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">Reward for users who swap $100+ on our DEX</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">30-day window</span>
                      <button className="text-purple-600 text-sm font-medium">Get Link</button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">NFT Marketplace</h4>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">$25 USDC</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">Earn when referred users buy any NFT</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">14-day window</span>
                      <button className="text-purple-600 text-sm font-medium">Get Link</button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">Lending Protocol</h4>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">$50 USDC</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">Users must deposit $500+ to qualify</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">45-day window</span>
                      <button className="text-purple-600 text-sm font-medium">Get Link</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Affiliate Benefits */}
              <div className="space-y-6">
                <div className="bg-white/20 rounded-xl p-4 border border-purple-300/30">
                  <h4 className="text-white font-semibold mb-3">Your Earning Potential</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-200">Active referrals:</span>
                      <span className="text-white font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-200">Pending rewards:</span>
                      <span className="text-white font-medium">$350 USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-200">Total earned:</span>
                      <span className="text-white font-medium">$1,250 USDC</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 rounded-xl p-4 border border-purple-300/30">
                  <h4 className="text-white font-semibold mb-3">Sharing Made Easy</h4>
                  <div className="text-purple-200 text-sm space-y-2">
                    <p>• Generated links include wallet onboarding</p>
                    <p>• Recipients can fund new wallets instantly</p>
                    <p>• Clear instructions for each campaign</p>
                    <p>• Automatic reward distribution</p>
                  </div>
                </div>

                <div className="bg-white/20 rounded-xl p-4 border border-purple-300/30">
                  <h4 className="text-white font-semibold mb-3">Sample Sharing Flow</h4>
                  <div className="text-purple-200 text-sm space-y-1">
                    <p className="font-mono text-xs bg-black/20 p-2 rounded">
                      "Check out this DeFi protocol! You can earn $75 for trying it out: 
                      bubbapay.com/ref/defiswap/alice123"
                    </p>
                    <p className="text-xs">Recipient clicks → connects wallet → completes task → you both earn</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-300/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Zero Integration</h3>
            <p className="text-purple-200 mb-4 leading-relaxed text-lg">
              Launch campaigns instantly. No code changes, no API keys, no developer time required.
            </p>
            <div className="text-purple-100 text-sm">
              • Works with existing smart contracts<br/>
              • Onchain verification only<br/>
              • Launch campaigns in 5 minutes
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-300/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Seamless Onboarding</h3>
            <p className="text-purple-200 mb-4 leading-relaxed text-lg">
              BubbaPay handles wallet creation and funding. Affiliates can even send starter funds directly.
            </p>
            <div className="text-purple-100 text-sm">
              • One-click wallet creation<br/>
              • Optional starter fund transfers<br/>
              • Clear step-by-step instructions
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-300/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Onchain Verification</h3>
            <p className="text-purple-200 mb-4 leading-relaxed text-lg">
              Automatic tracking of blockchain interactions. Fraud-proof attribution with tamper-resistant verification.
            </p>
            <div className="text-purple-100 text-sm">
              • Real-time blockchain monitoring<br/>
              • Automatic reward distribution<br/>
              • Transparent conversion tracking
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Perfect for Any Crypto Project</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: "🔄", title: "DEX Protocols", desc: "Reward swap activity" },
              { icon: "💰", title: "Lending Platforms", desc: "Track deposits/borrows" },
              { icon: "🎨", title: "NFT Markets", desc: "Incentivize purchases" },
              { icon: "🎮", title: "GameFi Projects", desc: "Onboard new players" },
              { icon: "🏛️", title: "DAO Platforms", desc: "Grow governance participation" },
              { icon: "⚡", title: "DeFi Protocols", desc: "Drive TVL growth" }
            ].map((item, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-purple-300/20 hover:bg-white/10 transition-all duration-300 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="text-white font-medium text-sm mb-1">{item.title}</h3>
                <p className="text-purple-300 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-3xl p-8 border border-purple-300/30 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-6">Coming Soon Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-3">Advanced Campaigns</h3>
              <ul className="space-y-2 text-purple-200 text-sm">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-purple-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Multi-step conversion funnels
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-purple-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Tiered reward structures
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-purple-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Cross-protocol collaborations
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-purple-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Seasonal campaign boosts
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-3">Platform Features</h3>
              <ul className="space-y-2 text-purple-200 text-sm">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-purple-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Real-time analytics dashboard
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-purple-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Affiliate leaderboards
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-purple-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Automated payout escrows
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-purple-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Multi-chain support
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Scale Your User Acquisition?</h2>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Join the waitlist to be among the first startups and affiliates on the platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-purple-500/25 transition-all duration-300 transform hover:scale-105">
              Join Beta Waitlist
            </button>
            
            <Link 
              to="/"
              className="text-purple-200 hover:text-white font-medium px-8 py-4 rounded-2xl border border-purple-300/30 hover:border-purple-300/50 transition-all duration-300"
            >
              Try BubbaPay Core
            </Link>
          </div>
          
          <div className="text-purple-300 text-sm space-y-1">
            <p>• Early access to beta • Free campaign testing • Performance marketing for crypto</p>
            <p className="text-xs">Zero upfront costs - pay only for successful conversions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhiteLabelPage;
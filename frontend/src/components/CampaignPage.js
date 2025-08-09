import React from 'react';
import { Link } from 'react-router-dom';

function CampaignPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Rich Purple Background with Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-transparent to-pink-500/20"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-gradient-to-br from-purple-400 to-pink-500 shadow-2xl shadow-purple-500/25">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
            BubbaPay Campaigns
          </h1>
          <p className="text-2xl text-purple-200 mb-4 max-w-4xl mx-auto leading-relaxed font-medium">
            Turn your users into growth engines.
          </p>
          <p className="text-xl text-purple-300 mb-8 max-w-3xl mx-auto">
            Launch referral campaigns where users earn rewards for onboarding real, engaged members to your project.
          </p>
          
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg shadow-xl shadow-purple-500/25 mb-8">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Coming Soon
          </div>
        </div>

        {/* Value Proposition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Setup Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-300/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">5-Minute Setup</h3>
            <p className="text-purple-200 mb-4 leading-relaxed text-lg">
              Create referral campaigns instantly. No smart contracts, no dev work.
            </p>
            <div className="text-purple-100 text-sm">
              ✓ Custom validation rules<br/>
              ✓ Automatic token creation<br/>
              ✓ Zero upfront costs
            </div>
          </div>

          {/* Growth Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-300/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Quality Growth</h3>
            <p className="text-purple-200 mb-4 leading-relaxed text-lg">
              Users invest their own tokens to refer others. Only quality referrals earn rewards.
            </p>
            <div className="text-purple-100 text-sm">
              ✓ Skin-in-the-game approach<br/>
              ✓ Behavior-based validation<br/>
              ✓ Anti-spam protection built-in
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-300/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Proven Results</h3>
            <p className="text-purple-200 mb-4 leading-relaxed text-lg">
              Track real engagement. Reward actual usage, not just signups.
            </p>
            <div className="text-purple-100 text-sm">
              ✓ On-chain verification<br/>
              ✓ Custom success metrics<br/>
              ✓ Transparent tracking
            </div>
          </div>
        </div>

        {/* Simple Flow */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 lg:p-12 border border-purple-300/20 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">The Simple Flow</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-purple-500/25">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Create Campaign</h3>
              <p className="text-purple-200 text-sm">
                Set your rules, rewards & validation criteria
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-pink-500/25">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Users Share</h3>
              <p className="text-purple-200 text-sm">
                Your community sends tokens via BubbaPay
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-indigo-500/25">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">New Users Join</h3>
              <p className="text-purple-200 text-sm">
                Recipients use your app & meet criteria
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-green-500/25">
                4
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Both Get Paid</h3>
              <p className="text-purple-200 text-sm">
                Automatic rewards for quality referrals
              </p>
            </div>
          </div>
        </div>

        {/* Perfect For Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Perfect For</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: "🎮", title: "Gaming" },
              { icon: "🖼️", title: "NFT Markets" },
              { icon: "🔧", title: "DeFi" },
              { icon: "🎨", title: "Creators" },
              { icon: "⚡", title: "Tools" },
              { icon: "💎", title: "Tokens" }
            ].map((item, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-purple-300/20 hover:bg-white/10 transition-all duration-300 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="text-white font-medium text-sm">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Example Campaign */}
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-3xl p-8 border border-purple-300/30 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Real Campaign Example</h2>
          
          <div className="bg-white/10 rounded-2xl p-6 border border-purple-300/20">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Planeify Plane Spotting Campaign</h3>
                <p className="text-purple-200">Grow the plane spotting community</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Campaign Rules</h4>
                <ul className="space-y-1 text-purple-200 text-sm">
                  <li>• Claim the referral link</li>
                  <li>• Create Planeify account</li>
                  <li>• Log 3 plane spots in first week</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Rewards</h4>
                <ul className="space-y-1 text-purple-200 text-sm">
                  <li>• <strong>Referrer:</strong> 20 free spots</li>
                  <li>• <strong>New user:</strong> 20 free spots</li>
                  <li>• Both get premium features</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Why It Works</h4>
                <ul className="space-y-1 text-purple-200 text-sm">
                  <li>• Users invest tokens upfront</li>
                  <li>• Validates actual engagement</li>
                  <li>• Both sides win with activity</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Launch Partners */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-purple-300/20 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-6">Launch Partners</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-2xl p-6 border border-purple-300/20 text-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Planeify</h3>
              <p className="text-purple-200 text-sm mb-3">Plane spotting community app</p>
              <div className="bg-gradient-to-r from-orange-500/20 to-orange-400/20 rounded-lg p-3 border border-orange-400/30">
                <p className="text-orange-200 text-xs font-medium">
                  20 free spots for affiliates + new users
                </p>
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-6 border border-purple-300/20 text-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">?</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Your Project</h3>
              <p className="text-purple-200 text-sm mb-3">Join the movement</p>
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-3 border border-purple-400/30">
                <p className="text-purple-200 text-xs font-medium">
                  Launch in 5 minutes
                </p>
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-6 border border-purple-300/20 text-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">?</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
              <p className="text-purple-200 text-sm mb-3">More projects daily</p>
              <div className="bg-gradient-to-r from-gray-500/20 to-gray-400/20 rounded-lg p-3 border border-gray-400/30">
                <p className="text-gray-200 text-xs font-medium">
                  Early access available
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Turn Users Into Growth Engines</h2>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Launch your first campaign in minutes. No upfront costs, no complex integrations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-purple-500/25 transition-all duration-300 transform hover:scale-105">
              Get Early Access
            </button>
            
            <Link 
              to="/docs"
              className="bg-white/10 backdrop-blur-lg border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all duration-300"
            >
              Learn More
            </Link>
          </div>
          
          <div className="text-purple-300 text-sm space-y-1">
            <p>✓ 5-minute setup • ✓ Zero upfront costs • ✓ Quality user growth</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampaignPage;
import React from 'react';
import { Link } from 'react-router-dom';

function CampaignPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-violet-900">
      {/* Intense Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-transparent to-fuchsia-500/20"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-purple-500/10 to-indigo-600/20"></div>
      
      {/* Large Animated Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-300/15 rounded-full blur-3xl animate-pulse delay-700"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-16">
        
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-8 bg-gradient-to-br from-white to-purple-100 shadow-2xl shadow-purple-500/50">
            <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
            Launch<br/>
            <span className="bg-gradient-to-r from-purple-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
              Campaigns
            </span>
          </h1>
          
          <p className="text-2xl text-purple-100 mb-8 max-w-4xl mx-auto font-medium">
            Turn your Algorand project into a growth machine.<br/>
            <span className="text-white font-semibold">Set up affiliate campaigns in under 5 minutes.</span>
          </p>
          
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center px-8 py-4 rounded-full bg-white text-purple-800 font-bold text-xl shadow-2xl shadow-white/20 mb-12 border-4 border-purple-200">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Coming Soon
          </div>
        </div>

        {/* Main Value Props */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
          
          {/* Setup Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-10 shadow-2xl shadow-purple-900/30 border border-white/20 group hover:bg-white transition-all duration-500 hover:shadow-purple-500/20 hover:scale-105">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-purple-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">5-Minute Setup</h3>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              No coding. No smart contracts. Just define your rules and rewards. Your campaign goes live instantly.
            </p>
            <div className="text-purple-600 font-bold text-lg">
              ✓ Zero technical knowledge needed
            </div>
          </div>

          {/* Growth Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-10 shadow-2xl shadow-purple-900/30 border border-white/20 group hover:bg-white transition-all duration-500 hover:shadow-purple-500/20 hover:scale-105">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-fuchsia-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Explosive Growth</h3>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Your users become your sales force. They invest their own crypto to bring quality users to your platform.
            </p>
            <div className="text-purple-600 font-bold text-lg">
              ✓ Skin-in-the-game referrals
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-10 shadow-2xl shadow-purple-900/30 border border-white/20 group hover:bg-white transition-all duration-500 hover:shadow-purple-500/20 hover:scale-105">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-violet-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Real Results</h3>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Track everything on-chain. See which affiliates bring the most engaged users. Pay only for results.
            </p>
            <div className="text-purple-600 font-bold text-lg">
              ✓ Performance-based rewards
            </div>
          </div>
        </div>

        {/* How It Works - Simplified */}
        <div className="mb-24">
          <h2 className="text-5xl font-bold text-white text-center mb-16">How It Works</h2>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto mb-6 text-3xl font-black text-purple-600 shadow-2xl shadow-white/20">
                  1
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Create Campaign</h3>
                <p className="text-purple-200 leading-relaxed">
                  Define your onboarding goals and rewards. Takes 5 minutes.
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto mb-6 text-3xl font-black text-purple-600 shadow-2xl shadow-white/20">
                  2
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Users Share</h3>
                <p className="text-purple-200 leading-relaxed">
                  Your community sends campaign tokens via BubbaPay links.
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto mb-6 text-3xl font-black text-purple-600 shadow-2xl shadow-white/20">
                  3
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Growth Happens</h3>
                <p className="text-purple-200 leading-relaxed">
                  New users claim links and engage with your platform.
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto mb-6 text-3xl font-black text-purple-600 shadow-2xl shadow-white/20">
                  4
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Pay for Results</h3>
                <p className="text-purple-200 leading-relaxed">
                  Reward successful referrals automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="mb-24">
          <h2 className="text-5xl font-bold text-white text-center mb-16">Perfect For</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
            {[
              { emoji: "🎮", title: "Gaming" },
              { emoji: "🖼️", title: "NFT Markets" },
              { emoji: "🔧", title: "DeFi" },
              { emoji: "🎨", title: "Creators" },
              { emoji: "⚡", title: "Tools" },
              { emoji: "💎", title: "Tokens" }
            ].map((item, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 text-center hover:bg-white transition-all duration-300 hover:scale-110 shadow-xl shadow-purple-900/20">
                <div className="text-5xl mb-4">{item.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Example */}
        <div className="mb-24">
          <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-lg rounded-3xl p-12 shadow-2xl shadow-purple-900/30 border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Campaign Example</h2>
              <p className="text-xl text-gray-600">Real campaign launching soon</p>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-8 border-2 border-orange-200">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mr-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Planeify Campaign</h3>
                  <p className="text-gray-600">Spot planes and earn XP</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Goal</h4>
                  <p className="text-gray-700">Onboard new users</p>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Reward</h4>
                  <p className="text-gray-700">20 free spot credits</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white mb-8">Ready to 10x Your Growth?</h2>
          <p className="text-2xl text-purple-100 mb-12 max-w-3xl mx-auto">
            Join the waitlist. Be among the first projects to launch campaigns.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <button className="bg-white text-purple-600 font-bold px-12 py-6 rounded-2xl text-xl shadow-2xl shadow-white/20 hover:bg-purple-50 transition-all duration-300 transform hover:scale-105 border-4 border-white/20">
              Join Waitlist →
            </button>
            
            <Link 
              to="/docs"
              className="bg-white/10 backdrop-blur-lg border-2 border-white/30 text-white font-bold px-12 py-6 rounded-2xl text-xl hover:bg-white/20 transition-all duration-300"
            >
              Learn More
            </Link>
          </div>
          
          <p className="text-purple-200 text-lg font-medium">
            No setup fees • Zero coding required • Launch in minutes
          </p>
        </div>
      </div>
    </div>
  );
}

export default CampaignPage;
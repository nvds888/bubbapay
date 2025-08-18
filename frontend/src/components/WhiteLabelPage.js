import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function WhiteLabelPage() {
  const [activeTab, setActiveTab] = useState('demo');
  const [selectedAsset, setSelectedAsset] = useState('USDC');

  const codeExample = `<!-- Add this to your website -->
<div id="bubbapay-widget"></div>
<script src="https://widget.bubbapay.com/v1/widget.js"></script>
<script>
  BubbaPayWidget.init({
    containerId: 'bubbapay-widget',
    assetId: 31566704, // Your ASA ID
    theme: {
      primaryColor: '#7C3AED',
      borderRadius: '12px'
    },
    maxAmount: 1000,
    apiKey: 'your-api-key'
  });
</script>`;

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
            BubbaPay Widget
          </h1>
          <p className="text-2xl text-purple-200 mb-4 max-w-4xl mx-auto leading-relaxed font-medium">
            Add instant utility to your token
          </p>
          <p className="text-xl text-purple-300 mb-8 max-w-3xl mx-auto">
            Let your community send your ASA to anyone with shareable links. 5-minute integration. Zero monthly costs.
          </p>
          
          {/* Free Badge */}
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-lg shadow-xl shadow-green-500/25 mb-8">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            100% Free Forever
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-300/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Instant Token Utility</h3>
            <p className="text-purple-200 mb-4 leading-relaxed text-lg">
              Transform your ASA into a payment tool. Users can send your token to anyone, anywhere with just a link.
            </p>
            <div className="text-purple-100 text-sm">
              ✓ Works with any Algorand ASA<br/>
              ✓ No technical knowledge required<br/>
              ✓ Instant shareable payment links
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-300/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Viral Growth Engine</h3>
            <p className="text-purple-200 mb-4 leading-relaxed text-lg">
              Every transfer creates a shareable link. Recipients get introduced to your token and community.
            </p>
            <div className="text-purple-100 text-sm">
              ✓ Organic user acquisition<br/>
              ✓ Token distribution made easy<br/>
              ✓ Built-in onboarding flow
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-300/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Zero Cost Integration</h3>
            <p className="text-purple-200 mb-4 leading-relaxed text-lg">
              No monthly fees, no setup costs. Just add the widget and start growing your token ecosystem.
            </p>
            <div className="text-purple-100 text-sm">
              ✓ 5-minute setup<br/>
              ✓ No monthly payments<br/>
              ✓ Users pay their own network fees
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-purple-300/20 mb-16">
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 p-1 rounded-xl border border-purple-300/20">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('demo')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'demo' 
                      ? 'bg-white text-purple-900 shadow-lg' 
                      : 'text-purple-200 hover:text-white'
                  }`}
                >
                  Live Demo
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'code' 
                      ? 'bg-white text-purple-900 shadow-lg' 
                      : 'text-purple-200 hover:text-white'
                  }`}
                >
                  Integration Code
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'demo' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Widget Demo */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Send {selectedAsset}</h3>
                  <p className="text-gray-600 text-sm">Share your token instantly with anyone</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        {selectedAsset}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Send to (optional)</label>
                    <input
                      type="email"
                      placeholder="friend@email.com or leave empty for shareable link"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-600">Network fees</span>
                    <span className="text-gray-700 font-medium">~0.003 ALGO</span>
                  </div>
                  
                  <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]">
                    Create Payment Link
                  </button>
                </div>
              </div>

              {/* Benefits Panel */}
              <div className="space-y-6">
                <div className="bg-white/20 rounded-xl p-4 border border-purple-300/30">
                  <h4 className="text-white font-semibold mb-3">What Happens Next</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Shareable Link Created</div>
                        <div className="text-purple-200">Secure claim link generated instantly</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Easy Sharing</div>
                        <div className="text-purple-200">Share via WhatsApp, Telegram, or any platform</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">New User Onboarded</div>
                        <div className="text-purple-200">Recipient claims and joins your ecosystem</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 rounded-xl p-4 border border-purple-300/30">
                  <h4 className="text-white font-semibold mb-3">Token Customization</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-purple-200 text-sm mb-1">Your ASA</label>
                      <select 
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white"
                      >
                        <option value="USDC">USDC (Example)</option>
                        <option value="xUSD">xUSD (Example)</option>
                        <option value="Your Token">Your Token Here</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-purple-200 text-sm mb-1">Brand Colors</label>
                      <input 
                        type="color" 
                        value="#7C3AED"
                        className="w-full h-10 rounded-lg border border-purple-300/30"
                      />
                    </div>
                    <div>
                      <label className="block text-purple-200 text-sm mb-1">Max Transfer Amount</label>
                      <input 
                        type="number" 
                        placeholder="1000"
                        className="w-full px-3 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white placeholder-purple-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">Integration Code</h4>
                  <button className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                    Copy Code
                  </button>
                </div>
                <pre className="text-green-400 text-sm overflow-x-auto">
                  <code>{codeExample}</code>
                </pre>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/20 rounded-xl p-4 border border-purple-300/30 text-center">
                  <div className="text-2xl font-bold text-white mb-1">5 min</div>
                  <div className="text-purple-200 text-sm">Setup time</div>
                </div>
                <div className="bg-white/20 rounded-xl p-4 border border-purple-300/30 text-center">
                  <div className="text-2xl font-bold text-white mb-1">3 KB</div>
                  <div className="text-purple-200 text-sm">Widget size</div>
                </div>
                <div className="bg-white/20 rounded-xl p-4 border border-purple-300/30 text-center">
                  <div className="text-2xl font-bold text-white mb-1">$0</div>
                  <div className="text-purple-200 text-sm">Monthly cost</div>
                </div>
                <div className="bg-white/20 rounded-xl p-4 border border-purple-300/30 text-center">
                  <div className="text-2xl font-bold text-white mb-1">∞</div>
                  <div className="text-purple-200 text-sm">Transfer limit</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Perfect For Any ASA Project</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: "🎮", title: "Gaming Tokens", desc: "In-game currency transfers" },
              { icon: "🎨", title: "Creator Coins", desc: "Support your favorite creators" },
              { icon: "🏛️", title: "DAO Tokens", desc: "Governance token distribution" },
              { icon: "💎", title: "Utility Tokens", desc: "Service payment tokens" },
              { icon: "🎁", title: "Reward Points", desc: "Loyalty and reward systems" },
              { icon: "🌱", title: "Community Tokens", desc: "Build engaged communities" }
            ].map((item, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-purple-300/20 hover:bg-white/10 transition-all duration-300 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="text-white font-medium text-sm mb-1">{item.title}</h3>
                <p className="text-purple-300 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 lg:p-12 border border-purple-300/20 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-purple-500/25">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Add Widget</h3>
              <p className="text-purple-200 text-sm">
                Copy-paste our simple code snippet into your website
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-pink-500/25">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Users Send</h3>
              <p className="text-purple-200 text-sm">
                Your community sends tokens to anyone with shareable links
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-indigo-500/25">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Links Shared</h3>
              <p className="text-purple-200 text-sm">
                Recipients get secure claim links via any platform
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-green-500/25">
                4
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Growth</h3>
              <p className="text-purple-200 text-sm">
                New users discover and join your token ecosystem
              </p>
            </div>
          </div>
        </div>

        {/* Why Free */}
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-3xl p-8 border border-purple-300/30 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-6">Why Is This Free?</h2>
          
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl text-purple-200 mb-6">
              We make money from small transaction fees (like Stripe for crypto). 
              The more your token grows, the more everyone benefits.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-xl p-4 border border-purple-300/20">
                <h4 className="text-white font-semibold mb-2">You Win</h4>
                <p className="text-purple-200 text-sm">More token utility and user growth at zero cost</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-purple-300/20">
                <h4 className="text-white font-semibold mb-2">Users Win</h4>
                <p className="text-purple-200 text-sm">Easy way to send and receive any ASA</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-purple-300/20">
                <h4 className="text-white font-semibold mb-2">We Win</h4>
                <p className="text-purple-200 text-sm">Small fees from successful token ecosystems</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Add Utility to Your Token Today</h2>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Join projects that are already growing their token ecosystems with viral shareable payments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-purple-500/25 transition-all duration-300 transform hover:scale-105">
              Get Integration Code
            </button>
            
            <Link 
              to="/"
              className="text-purple-200 hover:text-white font-medium px-8 py-4 rounded-2xl border border-purple-300/30 hover:border-purple-300/50 transition-all duration-300"
            >
              Try BubbaPay First
            </Link>
          </div>
          
          <div className="text-purple-300 text-sm space-y-1">
            <p>✓ Free forever • ✓ 5-minute setup • ✓ Works with any ASA</p>
            <p className="text-xs">Users pay their own network fees (~0.003 ALGO per transfer)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhiteLabelPage;
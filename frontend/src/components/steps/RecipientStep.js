import React from 'react';

function RecipientStep({ formData, handleInputChange, nextStep, prevStep }) {
  const [error, setError] = React.useState('');
  
  // Override to always use shareable link and make email unselectable
  const effectiveFormData = {
    ...formData,
    isShareableLink: true
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Since we're always using shareable link, no validation needed for email
    setError('');
    
    // Update the form data to reflect shareable link selection
    handleInputChange({
      target: {
        name: 'isShareableLink',
        value: true,
        type: 'checkbox',
        checked: true
      }
    });
    
    nextStep();
  };
  
  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 mb-4 float">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white">Choose Delivery Method</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Select how you want to send the USDC to your recipient
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery method selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Delivery Method</h3>
          
          {/* Email option - disabled */}
          <div className="relative">
            <div className="glass-dark border border-gray-600 rounded-xl p-4 opacity-50 cursor-not-allowed">
              <label className="flex items-start space-x-3 cursor-not-allowed">
                <div className="relative mt-1">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="email"
                    checked={false}
                    disabled={true}
                    className="w-5 h-5 text-blue-500 bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2 cursor-not-allowed"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-500 font-medium">Send via Email</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-400">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    Send an email with claim instructions to the recipient
                  </p>
                </div>
              </label>
            </div>
          </div>
          
          {/* Shareable link option - selected by default */}
          <div className="glass-dark border border-purple-500/50 bg-purple-500/5 rounded-xl p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <div className="relative mt-1">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="link"
                  checked={true}
                  readOnly
                  className="w-5 h-5 text-purple-500 bg-gray-900 border-gray-600 focus:ring-purple-500 focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-white font-medium">Generate Shareable Link</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                    Recommended
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-1">
                  Create a secure link that you can share via any messaging platform
                </p>
                
                {/* Security notice */}
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm">
                      <div className="text-amber-300 font-medium">Security Note</div>
                      <div className="text-amber-200 mt-1">
                        Share this link securely! Anyone with the link can claim the funds.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>
        
        {/* Benefits of shareable link */}
        <div className="glass-dark border border-purple-500/20 rounded-xl p-4">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Benefits of Shareable Links</span>
          </h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
              <span>Share via any messaging platform (WhatsApp, Telegram, SMS, etc.)</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
              <span>No email address required from recipient</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
              <span>Works across all countries and platforms</span>
            </li>
          </ul>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="glass border border-red-500/20 bg-red-500/10 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="button"
            onClick={prevStep}
            className="btn-secondary flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300"
          >
            <span className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </span>
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <span>Continue with Link</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecipientStep;
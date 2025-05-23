import React from 'react';

function RecipientStep({ formData, handleInputChange, nextStep, prevStep }) {
  const [error, setError] = React.useState('');
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate recipient email if not a shareable link
    if (!formData.isShareableLink && !formData.recipientEmail) {
      setError('Please enter a recipient email');
      return;
    }
    
    if (!formData.isShareableLink && !validateEmail(formData.recipientEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Clear error and proceed
    setError('');
    nextStep();
  };
  
  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  // Handle input change and clear errors
  const handleChange = (e) => {
    setError('');
    handleInputChange(e);
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
        <h2 className="text-3xl font-bold text-white">Recipient Details</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Choose how you want to send your USDC - via email or shareable link
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery method selection */}
        <div className="glass-dark border border-purple-500/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Delivery Method</h3>
          
          {/* Radio button style options */}
          <div className="space-y-4">
            {/* Email option */}
            <label className={`cursor-pointer block ${!formData.isShareableLink ? 'ring-2 ring-purple-500' : ''}`}>
              <div className="glass-dark border border-gray-700 hover:border-purple-400 rounded-xl p-4 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={!formData.isShareableLink}
                      onChange={() => handleChange({
                        target: { name: 'isShareableLink', value: false, type: 'checkbox', checked: false }
                      })}
                      className="w-4 h-4 text-purple-500 bg-gray-900 border-gray-600 focus:ring-purple-500 focus:ring-2"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-white font-medium">Send via Email</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Send directly to a recipient's email address with instructions
                    </p>
                  </div>
                </div>
              </div>
            </label>
            
            {/* Shareable link option */}
            <label className={`cursor-pointer block ${formData.isShareableLink ? 'ring-2 ring-purple-500' : ''}`}>
              <div className="glass-dark border border-gray-700 hover:border-purple-400 rounded-xl p-4 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={formData.isShareableLink}
                      onChange={() => handleChange({
                        target: { name: 'isShareableLink', value: true, type: 'checkbox', checked: true }
                      })}
                      className="w-4 h-4 text-purple-500 bg-gray-900 border-gray-600 focus:ring-purple-500 focus:ring-2"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-white font-medium">Create Shareable Link</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Generate a link you can share via WhatsApp, Telegram, or any messaging app
                    </p>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>
        
        {/* Email input section */}
        {!formData.isShareableLink && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-white">
              Recipient Email Address
            </label>
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl opacity-30 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="recipient@example.com"
                />
              </div>
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Shareable link preview */}
        {formData.isShareableLink && (
          <div className="glass-dark border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">Shareable Link Preview</h4>
                <p className="text-gray-300 text-sm mb-3">
                  You'll receive a secure link after confirming the transaction that you can share with anyone.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-purple-300 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Works with WhatsApp, Telegram, SMS</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-300 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>No email required from recipient</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-300 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Secure and anonymous</span>
                  </div>
                </div>
              </div>
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
              <span>Continue</span>
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
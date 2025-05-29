import React, { useState } from 'react';

function RecipientStep({ formData, handleInputChange, nextStep, prevStep }) {
  const [error, setError] = useState('');
  const [showEmailOption, setShowEmailOption] = useState(false);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Since we're always using shareable link by default, no validation needed for email
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
    <div className="max-w-md mx-auto">
      {/* Compact header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3" 
             style={{background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'}}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Delivery Method</h2>
        <p className="text-gray-600 text-sm">Choose how to send your USDC</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Primary option - Shareable Link */}
        <div className="card card-normal status-info">
          <label className="flex items-start space-x-3 cursor-pointer">
            <div className="relative mt-1">
              <input
                type="radio"
                name="deliveryMethod"
                value="link"
                checked={true}
                readOnly
                className="w-4 h-4 text-purple-600"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">Shareable Link</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Recommended
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-1">
                Generate a secure link to share via any messaging platform
              </p>
              
              {/* Benefits list - compact */}
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <div className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Works with WhatsApp, Telegram, SMS, etc.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>No email address required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Works globally</span>
                </div>
              </div>
            </div>
          </label>
          
          {/* Security notice - compact */}
          <div className="mt-3 pt-3 border-t border-purple-200 status-warning">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <span className="font-medium text-amber-800">Share securely:</span>
                <span className="text-amber-700"> Anyone with the link can claim the funds</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Secondary option - Email (disabled but shown) */}
        <button
          type="button"
          onClick={() => setShowEmailOption(!showEmailOption)}
          className="w-full card card-compact bg-gray-50 border-gray-300 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="relative mt-1">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="email"
                  checked={false}
                  disabled={true}
                  className="w-4 h-4 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-500">Send via Email</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                    Coming Soon
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Send claim instructions directly to recipient's email
                </p>
              </div>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showEmailOption ? 'rotate-180' : ''}`} 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {/* Email option details - collapsible */}
        {showEmailOption && (
          <div className="card card-compact bg-gray-50 border-gray-300 text-sm text-gray-600">
            <p className="mb-2">When available, this option will:</p>
            <ul className="space-y-1 text-xs">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Send automatic email with claim instructions</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Include recipient onboarding guide</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Send notifications for unclaimed funds</span>
              </li>
            </ul>
          </div>
        )}
        
        {/* Error display */}
        {error && (
          <div className="card card-compact status-error">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={prevStep}
            className="btn-secondary flex-1 py-3 px-4"
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
            className="btn-primary flex-1 py-3 px-4 font-medium"
          >
            <span className="flex items-center justify-center space-x-2">
              <span>Continue</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
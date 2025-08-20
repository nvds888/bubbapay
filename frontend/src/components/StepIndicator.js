import React from 'react';

function StepIndicator({ currentStep, totalSteps }) {
  const steps = [
    { number: 1, label: "Configure", shortLabel: "Amount" },
    { number: 2, label: "Deploy", shortLabel: "Sign" }
  ];

  return (
    <div className="w-full max-w-xs mx-auto">
  {/* Desktop version - horizontal and compact */}
  <div className="flex items-center justify-between relative">
    {/* Background line */}
    <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-100"></div>
    
    {/* Progress line */}
    <div 
      className="absolute top-3 left-3 h-0.5 bg-purple-300 transition-all duration-500 ease-out"
      style={{ 
        width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
        maxWidth: 'calc(100% - 1.5rem)'
      }}
    ></div>
        
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          
          return (
            <div key={step.number} className="flex flex-col items-center relative z-10">
              {/* Step circle - smaller */}
              <div className={`flex items-center justify-center w-6 h-6 rounded-full font-medium text-xs transition-all duration-300 ${
                isActive 
                  ? "bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-md" 
                  : isCompleted 
                    ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white" 
                    : "bg-white text-gray-400 border-2 border-gray-300"
              }`}>
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              
              {/* Step label - compact */}
              <div className="mt-1.5 text-center">
                <div className={`font-medium text-xs transition-colors duration-300 ${
                  isActive ? "text-gray-900" : isCompleted ? "text-gray-600" : "text-gray-400"
                }`}>
                  {/* Show short label on mobile, full label on desktop */}
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StepIndicator;
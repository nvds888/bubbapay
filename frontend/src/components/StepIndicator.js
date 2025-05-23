import React from 'react';

function StepIndicator({ currentStep, totalSteps }) {
  const steps = [
    { number: 1, label: "Enter Amount", icon: "💰" },
    { number: 2, label: "Recipient Details", icon: "👤" },
    { number: 3, label: "Confirm & Send", icon: "✅" }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      {/* Mobile version - vertical */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          
          return (
            <div key={step.number} className="flex items-center space-x-4">
              {/* Step circle */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300 ${
                isActive 
                  ? "bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-lg shadow-purple-500/30" 
                  : isCompleted 
                    ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white" 
                    : "bg-gray-800 text-gray-400 border border-gray-700"
              }`}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              
              {/* Step details */}
              <div className="flex-1">
                <div className={`font-medium transition-colors duration-300 ${
                  isActive ? "text-white" : isCompleted ? "text-gray-300" : "text-gray-500"
                }`}>
                  {step.label}
                </div>
                {isActive && (
                  <div className="text-sm text-purple-300">In progress</div>
                )}
                {isCompleted && (
                  <div className="text-sm text-gray-400">Completed</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop version - horizontal */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-700"></div>
        
        {/* Progress line */}
        <div 
          className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500 ease-out"
          style={{ 
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            maxWidth: 'calc(100% - 3rem)'
          }}
        ></div>
        
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          
          return (
            <div key={step.number} className="flex flex-col items-center relative z-10">
              {/* Step circle with glow effect */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold text-sm transition-all duration-300 ${
                isActive 
                  ? "bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-lg shadow-purple-500/50 pulse-purple" 
                  : isCompleted 
                    ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white" 
                    : "bg-gray-800 text-gray-400 border-2 border-gray-700"
              }`}>
                {isCompleted ? (
                  <svg className="w-6 h-6 checkmark" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              
              {/* Step label */}
              <div className="mt-3 text-center">
                <div className={`font-medium text-sm transition-colors duration-300 ${
                  isActive ? "text-white" : isCompleted ? "text-gray-300" : "text-gray-500"
                }`}>
                  {step.label}
                </div>
                <div className={`text-xs mt-1 transition-colors duration-300 ${
                  isActive ? "text-purple-300" : isCompleted ? "text-gray-400" : "text-gray-600"
                }`}>
                  {isActive ? "In progress" : isCompleted ? "Completed" : "Pending"}
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
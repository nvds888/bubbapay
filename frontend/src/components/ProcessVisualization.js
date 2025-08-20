import React, { useState, useEffect, useRef } from 'react';

const ProcessVisualization = () => {
  const [activePhase, setActivePhase] = useState(0);
  const [activeTxn, setActiveTxn] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          
          let phaseTimeouts = [];
          let currentPhaseIndex = 0;
          let currentTxnIndex = 0;
          
          const startAnimation = () => {
            // Clear any existing timeouts
            phaseTimeouts.forEach(timeout => clearTimeout(timeout));
            phaseTimeouts = [];
            
            // Reset to start
            currentPhaseIndex = 0;
            currentTxnIndex = 0;
            setActivePhase(0);
            setActiveTxn(0);
            
            const scheduleNextStep = () => {
              const currentPhase = phases[currentPhaseIndex];
              
              // Schedule next transaction
              const timeout = setTimeout(() => {
                currentTxnIndex++;
                
                if (currentTxnIndex >= currentPhase.transactions.length) {
                  // Move to next phase
                  currentPhaseIndex++;
                  currentTxnIndex = 0;
                  
                  if (currentPhaseIndex >= phases.length) {
                    // Restart the cycle
                    startAnimation();
                    return;
                  }
                  
                  setActivePhase(currentPhaseIndex);
                  setActiveTxn(0);
                } else {
                  setActiveTxn(currentTxnIndex);
                }
                
                scheduleNextStep();
              }, 1500);
              
              phaseTimeouts.push(timeout);
            };
            
            scheduleNextStep();
          };
          
          startAnimation();
          
          return () => {
            phaseTimeouts.forEach(timeout => clearTimeout(timeout));
          };
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const phases = [
    {
      id: 'amount',
      title: 'Amount Entry',
      x: 15,
      y: 30,
      transactions: [
        { type: 'input', label: 'Asset Selection', detail: 'USDC/ALGO/etc' },
        { type: 'input', label: 'Amount Validation', detail: 'Balance Check' },
        { type: 'check', label: 'ALGO Availability', detail: '~0.007 ALGO fees needed' }
      ]
    },
    {
      id: 'create',
      title: 'App Deployment',
      x: 35,
      y: 20,
      transactions: [
        { type: 'appl', label: 'Create App', detail: '0.001 ALGO fee' },
        { type: 'wait', label: 'Confirm Block', detail: 'Get App ID' },
        { type: 'store', label: 'Save Escrow', detail: 'Database Record' }
      ]
    },
    {
      id: 'fund',
      title: 'Fund Contract',
      x: 65,
      y: 35,
      transactions: [
        { type: 'pay', label: 'Fund App', detail: '0.21 ALGO (recoverable)' },
        { type: 'pay', label: 'Fund Temp Account', detail: '0.102 ALGO (platform fee)' },
        { type: 'pay', label: 'Recipient Fees', detail: '0.21 ALGO (optional)' },
        { type: 'appl', label: 'Asset Opt-in', detail: 'Inner Transaction' },
        { type: 'appl', label: 'Set Amount', detail: 'Store microUnits' },
        { type: 'axfer', label: 'Send Asset', detail: 'Lock in Contract' }
      ]
    },
    {
      id: 'claim',
      title: 'Claim Process',
      x: 85,
      y: 50,
      transactions: [
        { type: 'axfer', label: 'Recipient Opt-in', detail: 'If needed' },
        { type: 'appl', label: 'Claim Call', detail: 'Transfer Asset' },
        { type: 'pay', label: 'Fee Return', detail: 'Unused fees back' },
        { type: 'pay', label: 'Protocol Fee', detail: '0.102 ALGO' },
        { type: 'pay', label: 'Close Temp', detail: 'Clean up' }
      ]
    }
  ];

  const getCurrentPhaseTransactionCount = () => {
    return phases[activePhase]?.transactions.length || 3;
  };

  const connections = [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 3 }
  ];

  const getTxnColor = (type) => {
    switch (type) {
      case 'pay': return '#10b981';
      case 'appl': return '#8b5cf6';
      case 'axfer': return '#f59e0b';
      case 'input': return '#6b7280';
      case 'check': return '#06b6d4';
      case 'wait': return '#ef4444';
      case 'store': return '#84cc16';
      default: return '#000';
    }
  };

  return (
    <div ref={containerRef} className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isInView ? 'opacity-100' : 'opacity-0'
        }`}>
          <h2 className="text-2xl font-light text-gray-900 tracking-wide mb-2">
            Technical Flow
          </h2>
          <p className="text-sm text-gray-500 font-mono">
            Real-time transaction visualization
          </p>
        </div>

        {/* Main visualization area */}
        <div className="relative h-96 w-full mb-8">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 70" preserveAspectRatio="xMidYMid meet">
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="2" height="2" patternUnits="userSpaceOnUse">
                <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#f8f9fa" strokeWidth="0.1"/>
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect width="100" height="70" fill="url(#grid)" opacity="0.3" />

            {/* Connection lines */}
            {connections.map((conn, index) => {
              const fromPhase = phases[conn.from];
              const toPhase = phases[conn.to];
              const isActive = activePhase >= conn.to;
              
              return (
                <line
                  key={`conn-${index}`}
                  x1={fromPhase.x}
                  y1={fromPhase.y}
                  x2={toPhase.x}
                  y2={toPhase.y}
                  stroke={isActive ? "#000" : "#e5e7eb"}
                  strokeWidth={isActive ? "0.3" : "0.1"}
                  strokeDasharray={isActive ? "1,1" : "none"}
                  className={isActive ? "animate-dash" : ""}
                />
              );
            })}

            {/* Phase nodes */}
            {phases.map((phase, phaseIndex) => {
              const isCurrentPhase = activePhase === phaseIndex;
              const isCompletedPhase = activePhase > phaseIndex;
              const isActivePhase = isCurrentPhase || isCompletedPhase;
              
              return (
                <g key={phase.id}>
                  {/* Main phase circle */}
                  <circle
                    cx={phase.x}
                    cy={phase.y}
                    r="2"
                    fill={isActivePhase ? "#000" : "#e5e7eb"}
                    stroke={isCurrentPhase ? "#000" : "none"}
                    strokeWidth="0.2"
                    filter={isCurrentPhase ? "url(#glow)" : "none"}
                    className="transition-all duration-500"
                  />
                  
                  {/* Pulse for current phase */}
                  {isCurrentPhase && (
                    <circle
                      cx={phase.x}
                      cy={phase.y}
                      r="2"
                      fill="none"
                      stroke="#000"
                      strokeWidth="0.1"
                      opacity="0.5"
                      className="animate-ping"
                    />
                  )}
                  
                  {/* Phase label */}
                  <text
                    x={phase.x}
                    y={phase.y - 4}
                    textAnchor="middle"
                    className={`font-mono text-xs transition-all duration-300 ${
                      isActivePhase ? 'opacity-100 fill-black' : 'opacity-40 fill-gray-400'
                    }`}
                    style={{ fontSize: '2px', fontWeight: isCurrentPhase ? 'bold' : 'normal' }}
                  >
                    {phase.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Current phase details - only show active phase */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-black rounded-lg p-6 shadow-lg">
            <h3 className="font-mono text-lg mb-4 text-black font-bold">
              {phases[activePhase].title}
            </h3>
            
            <div className="space-y-3">
              {phases[activePhase].transactions.map((txn, txnIndex) => {
                const isTxnActive = activeTxn >= txnIndex;
                const isTxnCurrent = activeTxn === txnIndex;
                
                return (
                  <div
                    key={txnIndex}
                    className={`flex items-center space-x-3 p-3 rounded transition-all duration-300 ${
                      isTxnCurrent 
                        ? 'bg-black text-white' 
                        : isTxnActive 
                        ? 'bg-gray-100 text-black'
                        : 'text-gray-400'
                    }`}
                  >
                    <div 
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isTxnActive ? 'bg-current' : 'bg-gray-300'
                      }`}
                      style={{ 
                        backgroundColor: isTxnActive ? getTxnColor(txn.type) : undefined 
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-mono font-medium">{txn.label}</div>
                      <div className="text-sm opacity-70">{txn.detail}</div>
                    </div>
                    
                    {/* Activity indicator */}
                    {isTxnCurrent && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Phase progress bar */}
            <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black transition-all duration-1000 animate-pulse"
                style={{ 
                  width: `${(activeTxn / phases[activePhase].transactions.length) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Updated fee breakdown - more accurate */}
        <div className={`mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-1000 delay-1000 ${
          isInView ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-lg font-mono font-bold text-gray-900">0.007 ALGO</div>
            <div className="text-xs text-gray-600">Network Fees</div>
            <div className="text-xs text-gray-500 mt-1">Transaction costs</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-lg font-mono font-bold text-gray-900">0.46 ALGO</div>
            <div className="text-xs text-gray-600">Recoverable</div>
            <div className="text-xs text-gray-500 mt-1">App reserve + funding</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-lg font-mono font-bold text-gray-900">0.102 ALGO</div>
            <div className="text-xs text-gray-600">Protocol Revenue</div>
            <div className="text-xs text-gray-500 mt-1">Platform fee</div>
          </div>
        </div>

        {/* Phase navigation dots */}
        <div className="flex justify-center mt-6 space-x-2">
          {phases.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activePhase === index 
                  ? 'bg-black' 
                  : activePhase > index 
                  ? 'bg-gray-400' 
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes dash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -2; }
        }
        
        .animate-dash {
          animation: dash 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ProcessVisualization;
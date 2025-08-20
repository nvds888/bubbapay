import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import axios from 'axios';
import algosdk from 'algosdk';
import StepIndicator from './StepIndicator';
import AmountStep from './steps/AmountStep';
import ConfirmStep from './steps/ConfirmStep';
import { fetchAssetBalance, checkAlgoAvailability, getDefaultAssetId, getAssetInfo } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SendFlow() {
  const navigate = useNavigate();
  const { activeAddress, signTransactions } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Internal account address state for MCP users who connect wallet on confirm step
  const [internalAccountAddress, setInternalAccountAddress] = useState(activeAddress);
  
  // USDC balance state
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState(null);
  
  // ALGO availability state
  const [algoAvailability, setAlgoAvailability] = useState(null);
  const [algoLoading, setAlgoLoading] = useState(false);
  const [algoError, setAlgoError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    amount: '',
    recipientEmail: '',
    isShareableLink: true,
    payRecipientFees: true,
  });
  
  // Transaction data
  const [txnData, setTxnData] = useState(null);
  
  // MCP session data
  const [mcpSessionData, setMcpSessionData] = useState(null);
  
  // NEW: Database state management
  const [currentEscrow, setCurrentEscrow] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  
  // Asset state
  const [selectedAssetId, setSelectedAssetId] = useState(getDefaultAssetId());
  const [selectedAssetInfo, setSelectedAssetInfo] = useState(() => getAssetInfo(getDefaultAssetId()));
  
  // Update internal account address when prop changes
  useEffect(() => {
    setInternalAccountAddress(activeAddress);
  }, [activeAddress]);
  
  // Use internal account address for balance and ALGO checks
  const effectiveAccountAddress = internalAccountAddress || activeAddress;
  
  // NEW: Check for incomplete escrows on wallet connection
  useEffect(() => {
    const checkForIncompleteEscrows = async () => {
      if (!effectiveAccountAddress || mcpSessionData) return;
      
      try {
        const response = await axios.get(`${API_URL}/incomplete-escrows/${effectiveAccountAddress}`);
        const incompleteEscrows = response.data;
        
        if (incompleteEscrows.length > 0) {
          // For simplicity, auto-recover the most recent incomplete escrow
          const mostRecent = incompleteEscrows[0];
          await recoverFromEscrow(mostRecent);
        }
      } catch (error) {
        console.error('Error checking for incomplete escrows:', error);
        // Don't show error to user, just continue with normal flow
      }
    };
    
    checkForIncompleteEscrows();
  }, [effectiveAccountAddress, mcpSessionData]);
  
  // NEW: Recovery function
  const recoverFromEscrow = async (escrow) => {
    try {
      setRecoveryMode(true);
      setCurrentEscrow(escrow);
      
      // Pre-fill form data from escrow
      setFormData({
        amount: escrow.amount.toString(),
        recipientEmail: escrow.recipientEmail || '',
        isShareableLink: escrow.isShareable,
        payRecipientFees: escrow.payRecipientFees
      });
      
      // Set asset info
      setSelectedAssetId(escrow.assetId);
      setSelectedAssetInfo(getAssetInfo(escrow.assetId));
      
      // Set transaction data from escrow
      setTxnData({
        appId: escrow.appId,
        appAddress: escrow.appAddress,
        groupTransactions: escrow.groupTransactions,
        tempAccount: escrow.tempAccount,
        amount: escrow.amount,
        microAmount: escrow.amount * 1e6
      });
      
      // Jump to confirm step since app is already created
      setCurrentStep(2);
      
      console.log('Recovered incomplete escrow:', escrow._id);
    } catch (error) {
      console.error('Error recovering from escrow:', error);
      setError('Failed to recover incomplete transaction');
    }
  };
  
  
  // Fetch USDC balance and ALGO availability when account changes
  useEffect(() => {
    const getBalances = async () => {
      if (!effectiveAccountAddress) {
        setUsdcBalance(null);
        setAlgoAvailability(null);
        return;
      }
      
      setBalanceLoading(true);
      setAlgoLoading(true);
      setBalanceError(null);
      setAlgoError(null);
      
      try {
        // Fetch USDC balance
        const balance = await fetchAssetBalance(effectiveAccountAddress, selectedAssetId);
        setUsdcBalance(balance);
      } catch (error) {
        console.error('Error fetching USDC balance:', error);
        setBalanceError('Failed to fetch your USDC balance');
      } finally {
        setBalanceLoading(false);
      }
      
      try {
        // Check ALGO availability
        const algoCheck = await checkAlgoAvailability(effectiveAccountAddress, formData.payRecipientFees);
        setAlgoAvailability(algoCheck);
      } catch (error) {
        console.error('Error checking ALGO availability:', error);
        setAlgoError('Failed to check your ALGO availability');
      } finally {
        setAlgoLoading(false);
      }
    };
    
    getBalances();
  }, [effectiveAccountAddress, formData.payRecipientFees, selectedAssetId]);
  
  const loadMCPSession = async (sessionToken) => {
    try {
      const response = await axios.get(`${API_URL}/mcp/signing-session/${sessionToken}`);
      const session = response.data.session;
      
      // Pre-fill form data
      setFormData({
        amount: session.amount.toString(),
        recipientEmail: session.recipientEmail || '',
        isShareableLink: session.shareable,
        payRecipientFees: session.coverRecipientFees
      });
      
      // Skip to confirm step
      setCurrentStep(3);
      
      // Store session for later use
      setMcpSessionData(session);
    } catch (error) {
      setError('Failed to load MCP session');
    }
  };
  
  const loadMCPEscrow = async (escrowId) => {
    try {
      const response = await axios.get(`${API_URL}/mcp/escrow/${escrowId}`);
      const escrow = response.data.escrow;
      
      // Pre-fill form data
      setFormData({
        amount: escrow.amount.toString(),
        recipientEmail: escrow.recipientEmail || '',
        isShareableLink: escrow.shareable,
        payRecipientFees: escrow.coverRecipientFees
      });
      
      // Skip to confirm step
      setCurrentStep(3);
      
      // Store escrow data for later use
      setMcpSessionData(escrow);
    } catch (error) {
      setError('Failed to load MCP escrow');
    }
  };
  
  // Handle wallet connection for MCP users
  const handleMCPWalletConnect = async (walletAddress) => {
    try {
      setInternalAccountAddress(walletAddress);
      
      // Update the MCP session with the wallet address if we have session data
      if (mcpSessionData) {
        await axios.post(`${API_URL}/mcp/update-session/${new URLSearchParams(window.location.search).get('mcp_session')}`, {
          userAddress: walletAddress
        });
      }
      
      console.log('MCP wallet connected:', walletAddress);
    } catch (error) {
      console.error('Error updating MCP session with wallet address:', error);
      // Continue anyway, the wallet connection itself worked
    }
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Move to next step
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  // Move to previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  // Generate the initial transaction to create the app
  const generateTransaction = async () => {
    if (!effectiveAccountAddress) {
      setError('Please connect your wallet first');
      return null;
    }
    
    // If we have MCP session data, use its transaction data
    if (mcpSessionData && mcpSessionData.deployTransaction) {
      const mcpTxnData = {
        transaction: mcpSessionData.deployTransaction,
        tempAccount: mcpSessionData.tempAccount,
        amount: mcpSessionData.amount,
        microAmount: mcpSessionData.amount * 1e6
      };
      setTxnData(mcpTxnData);
      return mcpTxnData;
    }
    
    // NEW: If we're in recovery mode and have current escrow, skip generation
    if (recoveryMode && currentEscrow && txnData) {
      return txnData;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Request transaction data from backend
      const response = await axios.post(`${API_URL}/generate-transactions`, {
        amount: formData.amount,
        recipientEmail: formData.isShareableLink ? null : formData.recipientEmail,
        senderAddress: effectiveAccountAddress,
        payRecipientFees: formData.payRecipientFees,
        assetId: selectedAssetId
      });
      
      setTxnData(response.data);
      return response.data;
    } catch (error) {
      console.error('Error generating transaction:', error);
      setError(error.response?.data?.error || 'Failed to generate transaction');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle first transaction signing (app creation)
  const handleSignFirstTransaction = async () => {
    try {
      // NEW: Skip if we're in recovery mode (app already created)
      if (recoveryMode && currentEscrow) {
        return;
      }
      
      // Generate transaction if it doesn't exist yet
      let currentTxnData = txnData;
      if (!currentTxnData) {
        currentTxnData = await generateTransaction();
        if (!currentTxnData) {
          return; // Error already set in generateTransaction
        }
      }
      
      if (!effectiveAccountAddress) {
        setError('Wallet not connected');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // Convert base64 transaction to Uint8Array
      const txnUint8 = new Uint8Array(Buffer.from(currentTxnData.transaction, 'base64'));
      
      // Decode the transaction for proper signing
      const txn = algosdk.decodeUnsignedTransaction(txnUint8);
      
      // Sign with use-wallet (supports multiple wallets)
      const signedTxns = await signTransactions([txn]);
      
      // Convert the signed transaction to base64
      const signedTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
      
      // Submit the signed transaction
      const response = await axios.post(`${API_URL}/submit-app-creation`, {
        signedTxn: signedTxnBase64,
        tempAccount: currentTxnData.tempAccount,
        amount: currentTxnData.amount,
        microAmount: currentTxnData.microAmount,
        recipientEmail: formData.isShareableLink ? null : formData.recipientEmail,
        senderAddress: effectiveAccountAddress,
        payRecipientFees: formData.payRecipientFees,
        assetId: selectedAssetId
      });
      
      // NEW: Save escrow data and set current escrow
      setCurrentEscrow({
        _id: response.data.escrowId,
        appId: response.data.appId,
        appAddress: response.data.appAddress,
        amount: currentTxnData.amount,
        isShareable: formData.isShareableLink,
        recipientEmail: formData.isShareableLink ? null : formData.recipientEmail,
        payRecipientFees: formData.payRecipientFees,
        assetId: selectedAssetId
      });
      
      // Save the app ID for the next step
      setTxnData({
        ...currentTxnData,
        appId: response.data.appId,
        escrowId: response.data.escrowId, // NEW: Store escrow ID
        appAddress: response.data.appAddress,
        groupTransactions: response.data.groupTransactions,
        tempAccount: response.data.tempAccount
      });
    } catch (error) {
      console.error('Error signing transaction:', error);
      setError(error.response?.data?.error || error.message || 'Failed to sign or submit transaction');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle group transaction signing (funding, opt-in, etc.)
  const handleSignGroupTransactions = async () => {
    if (!txnData || !txnData.groupTransactions || !effectiveAccountAddress) {
      setError('Group transaction data or wallet not available');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert base64 transactions to transaction objects
      const txnGroup = [];
      for (const base64Txn of txnData.groupTransactions) {
        const txnBytes = new Uint8Array(Buffer.from(base64Txn, 'base64'));
        const txn = algosdk.decodeUnsignedTransaction(txnBytes);
        txnGroup.push(txn);
      }
      
      // Sign with use-wallet (supports multiple wallets)
      const signedTxns = await signTransactions(txnGroup);
      
      // Convert signed transactions to base64 array
      const signedTxnsBase64 = signedTxns.map(
        txn => Buffer.from(txn).toString('base64')
      );
      
      // Submit the signed transactions
      const response = await axios.post(`${API_URL}/submit-group-transactions`, {
        signedTxns: signedTxnsBase64,
        appId: txnData.appId,
        tempAccount: txnData.tempAccount,
        amount: txnData.amount,
        recipientEmail: formData.isShareableLink ? null : formData.recipientEmail,
        senderAddress: effectiveAccountAddress,
        payRecipientFees: formData.payRecipientFees,
        assetId: selectedAssetId,
        escrowId: txnData.escrowId || (currentEscrow?._id) // NEW: Pass escrow ID
      });
      
      // Generate claim URL ourselves to match the backend version
      const generatedClaimUrl = `${window.location.origin}/claim?app=${txnData.appId}#key=${txnData.tempAccount.privateKey}`;
      
      // Navigate to success page with both the escrow ID and claim URL
      navigate(`/success/${response.data.escrowId}`, { 
        state: { 
          claimUrl: response.data.claimUrl || generatedClaimUrl,
          isShareable: response.data.isShareable 
        } 
      });
    } catch (error) {
      console.error('Error signing group transactions:', error);
      setError(error.response?.data?.error || error.message || 'Failed to sign or submit group transactions');
      
      // NEW: Don't clear transaction data in recovery mode
      if (!recoveryMode) {
        setTxnData(null);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle asset selection
  const handleAssetSelect = (assetId, assetInfo, forceRefresh = false) => {
    const isAssetChanging = assetId !== selectedAssetId;
    
    setSelectedAssetId(assetId);
    setSelectedAssetInfo(assetInfo);
  
    if (isAssetChanging || forceRefresh) {
      setUsdcBalance(null);
      setBalanceError(null);
      setAlgoAvailability(null);
      setAlgoError(null);
    }
    
    if (isAssetChanging && !recoveryMode) { 
      setFormData(prev => ({
        ...prev,
        amount: '' // Clear the amount field when switching assets
      }));
    }
  };

  // Render current step
  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <AmountStep 
            formData={formData}
            handleInputChange={handleInputChange}
            nextStep={nextStep}
            isConnected={!!effectiveAccountAddress}
            onConnectWallet={() => {}}
            assetBalance={usdcBalance}
            selectedAssetInfo={selectedAssetInfo}
            balanceLoading={balanceLoading}
            balanceError={balanceError}
            algoAvailability={algoAvailability}
            algoLoading={algoLoading}
            algoError={algoError}
            selectedAssetId={selectedAssetId}
            onAssetSelect={handleAssetSelect}
          />
        );
      case 2:
        return (
          <ConfirmStep 
            formData={formData}
            accountAddress={effectiveAccountAddress}
            prevStep={prevStep}
            isLoading={isLoading}
            error={error}
            txnData={txnData}
            generateTransaction={generateTransaction}
            handleSignFirstTransaction={handleSignFirstTransaction}
            handleSignGroupTransactions={handleSignGroupTransactions}
            mcpSessionData={mcpSessionData}
            onWalletConnect={handleMCPWalletConnect}
            selectedAssetInfo={selectedAssetInfo}
            recoveryMode={recoveryMode} 
            currentEscrow={currentEscrow} 
          />
        );
      default:
        return <AmountStep />;
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Recovery indicator */}
      {recoveryMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            📋 Resuming incomplete transaction from {new Date(currentEscrow?.createdAt).toLocaleString()}
          </p>
        </div>
      )}
      
      {/* Compact step indicator - hide for MCP users */}
      {!mcpSessionData && (
        <div className="mb-6">
          <StepIndicator currentStep={currentStep} totalSteps={2} />
        </div>
      )}
      
      {/* Main content */}
      <div className="mb-6">
        {renderStep()}
      </div>
    </div>
  );
}

export default SendFlow;
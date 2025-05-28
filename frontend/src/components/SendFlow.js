import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import algosdk from 'algosdk';
import StepIndicator from './StepIndicator';
import AmountStep from './steps/AmountStep';
import RecipientStep from './steps/RecipientStep';
import ConfirmStep from './steps/ConfirmStep';
import { fetchUSDCBalance, checkAlgoAvailability } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SendFlow({ accountAddress, peraWallet }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Internal account address state for MCP users who connect wallet on confirm step
  const [internalAccountAddress, setInternalAccountAddress] = useState(accountAddress);
  
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
    isShareableLink: false,
    payRecipientFees: true,
  });
  
  // Transaction data
  const [txnData, setTxnData] = useState(null);
  
  // MCP session data
  const [mcpSessionData, setMcpSessionData] = useState(null);
  
  // Update internal account address when prop changes
  useEffect(() => {
    setInternalAccountAddress(accountAddress);
  }, [accountAddress]);
  
  // Use internal account address for balance and ALGO checks
  const effectiveAccountAddress = internalAccountAddress || accountAddress;
  
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
        const balance = await fetchUSDCBalance(effectiveAccountAddress);
        setUsdcBalance(balance);
      } catch (error) {
        console.error('Error fetching USDC balance:', error);
        setBalanceError('Failed to fetch your USDC balance');
      } finally {
        setBalanceLoading(false);
      }
      
      try {
        // Check ALGO availability (we'll update this when payRecipientFees changes)
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
  }, [effectiveAccountAddress, formData.payRecipientFees]); // Also re-check when payRecipientFees changes
  
  // Load MCP session if present in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mcpSession = urlParams.get('mcp_session');
    const escrowId = urlParams.get('escrow_id');
    
    if (mcpSession) {
      loadMCPSession(mcpSession);
    } else if (escrowId) {
      loadMCPEscrow(escrowId);
    }
  }, []);
  
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
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Request transaction data from backend
      const response = await axios.post(`${API_URL}/generate-transactions`, {
        amount: formData.amount,
        recipientEmail: formData.isShareableLink ? null : formData.recipientEmail,
        senderAddress: effectiveAccountAddress,
        payRecipientFees: formData.payRecipientFees
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
      
      // Sign with Pera Wallet
      const signedTxns = await peraWallet.signTransaction([[{ txn, signers: [effectiveAccountAddress] }]]);
      
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
        payRecipientFees: formData.payRecipientFees
      });
      
      // Save the app ID for the next step
      setTxnData({
        ...currentTxnData,
        appId: response.data.appId,
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
        txnGroup.push({ txn, signers: [effectiveAccountAddress] });
      }
      
      // Sign with Pera Wallet
      const signedTxns = await peraWallet.signTransaction([txnGroup]);
      
      // Convert signed transactions to base64 array
      const signedTxnsBase64 = Array.from(signedTxns).map(
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
        payRecipientFees: formData.payRecipientFees
      });
      
      // Generate claim URL ourselves to match the backend version
      // This ensures we have the URL even if it's not stored in the database
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
      
      // CRITICAL FIX: Clear transaction data so user can start fresh if they try again
      // This prevents the flow from trying to continue with a partially completed app
      setTxnData(null);
    } finally {
      setIsLoading(false);
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
            onConnectWallet={() => {}} // This would be passed from parent
            usdcBalance={usdcBalance}
            balanceLoading={balanceLoading}
            balanceError={balanceError}
            algoAvailability={algoAvailability}
            algoLoading={algoLoading}
            algoError={algoError}
          />
        );
      case 2:
        return (
          <RecipientStep 
            formData={formData}
            handleInputChange={handleInputChange}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
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
            peraWallet={peraWallet}
            onWalletConnect={handleMCPWalletConnect}
          />
        );
      default:
        return <AmountStep />;
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Hide step indicator for MCP users */}
      {!mcpSessionData && <StepIndicator currentStep={currentStep} totalSteps={3} />}
      
      {/* Main card with glassmorphism effect */}
      <div className="glass-dark border border-purple-500/20 rounded-2xl p-6 lg:p-8 card-animate">
        {renderStep()}
      </div>
      
      {/* Trust indicators */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Fast Transactions</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Instant Settlement</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Low Fees</span>
        </div>
      </div>
    </div>
  );
}

export default SendFlow;
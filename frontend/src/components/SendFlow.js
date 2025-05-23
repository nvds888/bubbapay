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
  
  // Fetch USDC balance and ALGO availability when account changes
  useEffect(() => {
    const getBalances = async () => {
      if (!accountAddress) {
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
        const balance = await fetchUSDCBalance(accountAddress);
        setUsdcBalance(balance);
      } catch (error) {
        console.error('Error fetching USDC balance:', error);
        setBalanceError('Failed to fetch your USDC balance');
      } finally {
        setBalanceLoading(false);
      }
      
      try {
        // Check ALGO availability (we'll update this when payRecipientFees changes)
        const algoCheck = await checkAlgoAvailability(accountAddress, formData.payRecipientFees);
        setAlgoAvailability(algoCheck);
      } catch (error) {
        console.error('Error checking ALGO availability:', error);
        setAlgoError('Failed to check your ALGO availability');
      } finally {
        setAlgoLoading(false);
      }
    };
    
    getBalances();
  }, [accountAddress, formData.payRecipientFees]); // Also re-check when payRecipientFees changes
  
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
    if (!accountAddress) {
      setError('Please connect your wallet first');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Request transaction data from backend
      const response = await axios.post(`${API_URL}/generate-transactions`, {
        amount: formData.amount,
        recipientEmail: formData.isShareableLink ? null : formData.recipientEmail,
        senderAddress: accountAddress,
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
      
      if (!accountAddress) {
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
      const signedTxns = await peraWallet.signTransaction([[{ txn, signers: [accountAddress] }]]);
      
      // Convert the signed transaction to base64
      const signedTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
      
      // Submit the signed transaction
      const response = await axios.post(`${API_URL}/submit-app-creation`, {
        signedTxn: signedTxnBase64,
        tempAccount: currentTxnData.tempAccount,
        amount: currentTxnData.amount,
        microAmount: currentTxnData.microAmount,
        recipientEmail: formData.isShareableLink ? null : formData.recipientEmail,
        senderAddress: accountAddress,
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
    if (!txnData || !txnData.groupTransactions || !accountAddress) {
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
        txnGroup.push({ txn, signers: [accountAddress] });
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
        senderAddress: accountAddress,
        payRecipientFees: formData.payRecipientFees
      });
      
      // Generate claim URL ourselves to match the backend version
      // This ensures we have the URL even if it's not stored in the database
      const generatedClaimUrl = `${window.location.origin}/claim?key=${txnData.tempAccount.privateKey}&app=${txnData.appId}`;
      
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
            isConnected={!!accountAddress}
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
            accountAddress={accountAddress}
            prevStep={prevStep}
            isLoading={isLoading}
            error={error}
            txnData={txnData}
            generateTransaction={generateTransaction}
            handleSignFirstTransaction={handleSignFirstTransaction}
            handleSignGroupTransactions={handleSignGroupTransactions}
          />
        );
      default:
        return <AmountStep />;
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <StepIndicator currentStep={currentStep} totalSteps={3} />
      
      {/* Main card with glassmorphism effect */}
      <div className="glass-dark border border-purple-500/20 rounded-2xl p-6 lg:p-8 card-animate">
        {renderStep()}
      </div>
      
      {/* Trust indicators */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Algorand Network</span>
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
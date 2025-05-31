import React, { useState, useEffect } from 'react';
import { X, Shield, Copy, Check, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';

const TwoFactorModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('setup'); // setup, verify, backup, complete
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (isOpen && step === 'setup') {
      setup2FA();
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const setup2FA = async () => {
    setLoading(true);
    try {
      const response = await authAPI.setup2FA();
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStep('verify');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to setup 2FA');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    if (!token || token.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verify2FA(token);
      setBackupCodes(response.data.backupCodes);
      setStep('backup');
      toast.success('2FA enabled successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyAllBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    copyToClipboard(codesText);
  };

  const handleComplete = () => {
    setStep('complete');
    if (onSuccess) onSuccess();
    setTimeout(() => {
      onClose();
      resetModal();
    }, 2000);
  };

  const resetModal = () => {
    setStep('setup');
    setQrCode('');
    setSecret('');
    setToken('');
    setBackupCodes([]);
    setCopied(false);
    setShowSecret(false);
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  const renderSetupStep = () => (
    <div className="text-center">
      <div className="mb-6">
        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Setting up Two-Factor Authentication
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we generate your 2FA setup...
        </p>
      </div>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
  );

  const renderVerifyStep = () => (
    <div>
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Scan QR Code
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
        </div>
      </div>

      {/* Manual Entry */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Or enter this code manually:
        </label>
        <div className="flex items-center space-x-2">
          <input
            type={showSecret ? 'text' : 'password'}
            value={secret}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(secret)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Verification */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Enter the 6-digit code from your authenticator app:
        </label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-lg font-mono tracking-widest"
          maxLength={6}
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={verify2FA}
          disabled={loading || token.length !== 6}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify & Enable'}
        </button>
      </div>
    </div>
  );

  const renderBackupStep = () => (
    <div>
      <div className="text-center mb-6">
        <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Save Your Backup Codes
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Store these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
        </p>
      </div>

      <div className="mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 px-3 py-2 rounded border font-mono text-sm text-center"
              >
                {code}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={copyAllBackupCodes}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Copy All Codes</span>
          </button>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Each backup code can only be used once</li>
              <li>Store them securely (password manager, safe place)</li>
              <li>Don't share them with anyone</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleComplete}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        I've Saved My Backup Codes
      </button>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          2FA Enabled Successfully!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your account is now protected with two-factor authentication.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Two-Factor Authentication
          </h2>
          {step !== 'complete' && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'setup' && renderSetupStep()}
          {step === 'verify' && renderVerifyStep()}
          {step === 'backup' && renderBackupStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorModal;

import React, { useState } from 'react';
import { X, Mail, ArrowLeft, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('email'); // email, success
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.forgotPassword(email);

      console.log('Forgot password response:', response.data);

      // For demo purposes, we get the reset URL
      if (response.data.resetUrl) {
        console.log('Reset URL received:', response.data.resetUrl);
        setResetUrl(response.data.resetUrl);
      } else {
        console.log('No reset URL in response');
      }

      setStep('success');
      toast.success('Password reset instructions sent!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setError('');
    setResetUrl('');
    onClose();
  };

  const copyResetUrl = async () => {
    try {
      await navigator.clipboard.writeText(resetUrl);
      toast.success('Reset link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const renderEmailStep = () => (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Forgot your password?
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className={`w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                error
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your email address"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderSuccessStep = () => (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Check your email
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We've sent password reset instructions to <strong>{email}</strong>
        </p>
      </div>

      {/* Demo Reset Link */}
      {resetUrl && (
        <div className="mb-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-2">Demo Mode - Reset Link:</p>
                <div className="bg-white dark:bg-gray-800 border rounded p-2 break-all text-xs font-mono">
                  {resetUrl}
                </div>
                <button
                  onClick={copyResetUrl}
                  className="mt-2 flex items-center space-x-1 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100"
                >
                  <Copy className="w-3 h-3" />
                  <span className="text-xs">Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">Didn't receive the email? Check your spam folder or:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes for the email to arrive</li>
            <li>Try requesting a new reset link</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setStep('email')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Try Different Email</span>
          </button>
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Reset Password
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'email' && renderEmailStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;

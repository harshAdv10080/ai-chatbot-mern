import React, { useState } from 'react';
import { X, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';

const DisableTwoFactorModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    password: '',
    token: '',
    backupCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (!useBackupCode) {
      if (!formData.token) {
        newErrors.token = '2FA code is required';
      } else if (formData.token.length !== 6) {
        newErrors.token = '2FA code must be 6 digits';
      }
    } else {
      if (!formData.backupCode) {
        newErrors.backupCode = 'Backup code is required';
      } else if (formData.backupCode.length !== 8) {
        newErrors.backupCode = 'Backup code must be 8 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        password: formData.password
      };

      if (useBackupCode) {
        payload.backupCode = formData.backupCode;
      } else {
        payload.token = formData.token;
      }

      await authAPI.disable2FA(payload);

      toast.success('2FA disabled successfully!');
      setFormData({
        password: '',
        token: '',
        backupCode: ''
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to disable 2FA';
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.path] = err.msg;
        });
        setErrors(backendErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      password: '',
      token: '',
      backupCode: ''
    });
    setErrors({});
    setShowPassword(false);
    setUseBackupCode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Disable Two-Factor Authentication
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium mb-1">Warning:</p>
                <p>Disabling 2FA will make your account less secure. You will only need your password to log in.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.password
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* 2FA Method Toggle */}
          <div>
            <div className="flex items-center space-x-4 mb-3">
              <button
                type="button"
                onClick={() => setUseBackupCode(false)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  !useBackupCode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Authenticator Code
              </button>
              <button
                type="button"
                onClick={() => setUseBackupCode(true)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  useBackupCode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Backup Code
              </button>
            </div>

            {!useBackupCode ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  2FA Code from Authenticator App
                </label>
                <input
                  type="text"
                  name="token"
                  value={formData.token}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setFormData(prev => ({ ...prev, token: value }));
                    if (errors.token) {
                      setErrors(prev => ({ ...prev, token: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-lg font-mono tracking-widest ${
                    errors.token
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="123456"
                  maxLength={6}
                />
                {errors.token && (
                  <p className="text-red-500 text-sm mt-1">{errors.token}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Backup Code
                </label>
                <input
                  type="text"
                  name="backupCode"
                  value={formData.backupCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 8);
                    setFormData(prev => ({ ...prev, backupCode: value }));
                    if (errors.backupCode) {
                      setErrors(prev => ({ ...prev, backupCode: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-lg font-mono tracking-widest ${
                    errors.backupCode
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="ABCD1234"
                  maxLength={8}
                />
                {errors.backupCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.backupCode}</p>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
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
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisableTwoFactorModal;

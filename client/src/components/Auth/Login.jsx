import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Bot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import AuthLoadingSpinner from '../common/AuthLoadingSpinner';
import ForgotPasswordModal from './ForgotPasswordModal';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorToken: '',
    backupCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleChange = (e) => {
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
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await login(
      formData.email,
      formData.password,
      formData.twoFactorToken || null,
      formData.backupCode || null
    );

    if (result.success) {
      navigate('/chat');
    } else if (result.requires2FA) {
      setRequires2FA(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]"></div>

      <div className="max-w-6xl w-full flex items-start justify-center gap-8 relative z-10">
        {/* Main Login Form */}
        <div className="max-w-md w-full space-y-8">
        {/* Glass Card Container */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 border border-white/20 dark:border-gray-700/50 p-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/25">
                <Bot className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Welcome back
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 font-medium">
              Sign in to your AI assistant account
            </p>
          </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`input pl-10 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* 2FA Fields - Show only when 2FA is required */}
            {requires2FA && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Two-Factor Authentication Required
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mb-4">
                    Enter your 6-digit code from your authenticator app or use a backup code.
                  </p>
                </div>

                {/* 2FA Method Toggle */}
                <div className="flex items-center justify-center space-x-4 mb-3">
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
                    <label htmlFor="twoFactorToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      2FA Code from Authenticator App
                    </label>
                    <input
                      id="twoFactorToken"
                      name="twoFactorToken"
                      type="text"
                      value={formData.twoFactorToken}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setFormData(prev => ({ ...prev, twoFactorToken: value }));
                      }}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-lg font-mono tracking-widest"
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="backupCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Backup Code
                    </label>
                    <input
                      id="backupCode"
                      name="backupCode"
                      type="text"
                      value={formData.backupCode}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 8);
                        setFormData(prev => ({ ...prev, backupCode: value }));
                      }}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-lg font-mono tracking-widest"
                      placeholder="ABCD1234"
                      maxLength={8}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Remember me and forgot password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-medium text-primary-600 hover:text-primary-500 underline"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] hover:shadow-xl shadow-lg"
            >
              {loading ? (
                <AuthLoadingSpinner size="sm" />
              ) : (
                <>
                  <span>Sign in</span>
                  <div className="ml-2 group-hover:translate-x-1 transition-transform duration-200">
                    →
                  </div>
                </>
              )}
            </button>
          </div>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            🎯 Demo Credentials
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 font-mono">
            Email: demo@gmail.com<br />
            Password: Demo123
          </p>
        </div>

        {/* Free Tier Notice - Mobile Version */}
        <div className="lg:hidden mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center">
            ⚡ Free Tier Notice
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            Backend may take <strong>30-60 seconds</strong> to wake up. Please wait or refresh if slow.
            <span className="block mt-1 font-medium">Thank you! 🙏</span>
          </p>
        </div>

        </div>
        </div>

        {/* Free Tier Notice - Side Panel */}
        <div className="hidden lg:block max-w-sm w-full">
          <div className="sticky top-8">
            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/50 shadow-lg backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
                ⚡ Free Tier Notice
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                  Backend is hosted on <strong>free tier</strong> and may take <strong>30-60 seconds</strong> to wake up if inactive.
                </p>
                <div className="p-3 bg-amber-100/50 dark:bg-amber-800/20 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    💡 If login seems slow:
                  </p>
                  <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                    <li>• Please wait patiently</li>
                    <li>• Or refresh and try again</li>
                    <li>• Server will wake up soon!</li>
                  </ul>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium text-center">
                  Thank you for your patience! 🙏
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default Login;

import React, { useState, useEffect } from 'react';
import { X, User, Bell, Shield, Palette, Database, Zap, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ChangePasswordModal from './ChangePasswordModal';
import TwoFactorModal from './TwoFactorModal';
import DisableTwoFactorModal from './DisableTwoFactorModal';
import { authAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    enabled: false,
    enabledAt: null,
    backupCodesCount: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetch2FAStatus();
    }
  }, [isOpen]);

  const fetch2FAStatus = async () => {
    try {
      const response = await authAPI.get2FAStatus();
      setTwoFactorStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    }
  };

  const handle2FASuccess = () => {
    fetch2FAStatus();
    toast.success('2FA settings updated successfully!');
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'usage', label: 'Usage', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Member Since
                  </label>
                  <input
                    type="text"
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Subscription Plan
                  </label>
                  <input
                    type="text"
                    value={user?.subscription?.plan || 'Free'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Chat Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Enable RAG (Document Analysis)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Use uploaded documents to enhance AI responses
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 focus:ring-2 focus:ring-offset-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Streaming Responses
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Show AI responses as they are generated
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 focus:ring-2 focus:ring-offset-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Dark Mode
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Use dark theme for the interface
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={toggleDarkMode}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}>
                      {isDarkMode && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      New Message Notifications
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Get notified when you receive new messages
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 focus:ring-2 focus:ring-offset-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Document Processing Complete
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Get notified when document analysis is finished
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-600 focus:ring-2 focus:ring-offset-2"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Settings</h3>
              <div className="space-y-4">
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="w-full text-left p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-200">Change Password</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Update your account password</div>
                </button>
                <button
                  onClick={() => twoFactorStatus.enabled ? setShow2FADisable(true) : setShow2FASetup(true)}
                  className="w-full text-left p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-200">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {twoFactorStatus.enabled
                          ? `Enabled ${twoFactorStatus.enabledAt ? new Date(twoFactorStatus.enabledAt).toLocaleDateString() : ''}`
                          : 'Add an extra layer of security'
                        }
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      twoFactorStatus.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {twoFactorStatus.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 opacity-50 cursor-not-allowed">
                  <div className="font-medium text-gray-900 dark:text-gray-200">Active Sessions</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Manage your active login sessions (Coming Soon)</div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'usage':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Usage Statistics</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">API Tokens Used</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {user?.subscription?.tokensUsed || 0} / {user?.subscription?.tokensLimit || 'Unlimited'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, ((user?.subscription?.tokensUsed || 0) / (user?.subscription?.tokensLimit || 1)) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Documents Uploaded</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Conversations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">About AI Chatbot</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">🤖 AI Chatbot v1.0</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    A production-grade AI chatbot built with the MERN stack, featuring real-time chat,
                    document analysis, and intelligent responses powered by Google Gemini.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Frontend:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">React 18 + Tailwind CSS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Backend:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Node.js + Express.js</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Database:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">MongoDB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Real-time:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Socket.IO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI Model:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Google Gemini</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Zap className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {renderTabContent()}
          </div>
        </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      {/* Two-Factor Authentication Setup Modal */}
      <TwoFactorModal
        isOpen={show2FASetup}
        onClose={() => setShow2FASetup(false)}
        onSuccess={handle2FASuccess}
      />

      {/* Two-Factor Authentication Disable Modal */}
      <DisableTwoFactorModal
        isOpen={show2FADisable}
        onClose={() => setShow2FADisable(false)}
        onSuccess={handle2FASuccess}
      />
    </>
  );
};

export default SettingsModal;

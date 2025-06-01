import React from 'react';
import { Menu, Wifi, WifiOff, Settings, Upload } from 'lucide-react';

const Header = ({ conversation, onSidebarToggle, socketStatus, onUploadDocument, onOpenSettings }) => {
  const { isConnected, connectionError } = socketStatus;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 px-6 py-4 shadow-lg shadow-blue-500/5">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onSidebarToggle}
            className="p-2.5 rounded-xl hover:bg-white/60 dark:hover:bg-gray-700/60 lg:hidden transition-all duration-200 hover:scale-105 hover:shadow-md"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          <div className="flex items-center space-x-3">
            {/* AI Avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {conversation?.title || 'AI Assistant'}
              </h1>
              {conversation ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {conversation.stats?.totalMessages || 0} messages • Active now
                </p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Built with ❤️ by{' '}
                  <a
                    href="https://github.com/harshAdv10080"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
                  >
                    Harsh Bhanushali
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                <Wifi className="w-4 h-4" />
                <span className="text-xs ml-2 font-medium hidden sm:inline">Connected</span>
              </div>
            ) : (
              <div className="flex items-center px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs ml-2 font-medium hidden sm:inline">
                  {connectionError ? 'Error' : 'Disconnected'}
                </span>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={onUploadDocument}
            className="p-3 rounded-xl bg-white/60 dark:bg-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-md border border-white/20 dark:border-gray-600/20"
            title="Upload Document"
          >
            <Upload className="w-5 h-5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-3 rounded-xl bg-white/60 dark:bg-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-md border border-white/20 dark:border-gray-600/20"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;

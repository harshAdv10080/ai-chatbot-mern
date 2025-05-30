import React from 'react';
import { Menu, Wifi, WifiOff, Settings, Upload } from 'lucide-react';

const Header = ({ conversation, onSidebarToggle, socketStatus, onUploadDocument, onOpenSettings }) => {
  const { isConnected, connectionError } = socketStatus;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onSidebarToggle}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {conversation?.title || 'AI Assistant'}
            </h1>
            {conversation && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {conversation.stats?.totalMessages || 0} messages
              </p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <Wifi className="w-4 h-4" />
                <span className="text-xs ml-1 hidden sm:inline">Connected</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs ml-1 hidden sm:inline">
                  {connectionError ? 'Error' : 'Disconnected'}
                </span>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={onUploadDocument}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
            title="Upload Document"
          >
            <Upload className="w-5 h-5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
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

import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Menu, X, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DocumentList from './DocumentList';

const Sidebar = ({
  conversations,
  currentConversationId,
  isOpen,
  onToggle,
  onNewConversation,
  onDeleteConversation,
  onSelectConversation
}) => {
  const { user, logout } = useAuth();
  const [showDocuments, setShowDocuments] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${!isOpen ? 'lg:w-0 lg:overflow-hidden' : ''}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              AI Assistant
            </h1>
            <button
              onClick={onToggle}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Conversation Button */}
          <div className="p-4">
            <button
              onClick={onNewConversation}
              className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="px-4 pb-4">
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No conversations yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Start a new conversation to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`
                        group relative p-3 rounded-lg cursor-pointer transition-colors
                        ${conversation.id === currentConversationId
                          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                      onClick={() => onSelectConversation(conversation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {conversation.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(conversation.lastActivity)}
                          </p>
                          {conversation.stats && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {conversation.stats.totalMessages} messages
                            </p>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowDocuments(!showDocuments)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Documents
                </span>
              </div>
              {showDocuments ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showDocuments && (
              <div className="border-t border-gray-100 dark:border-gray-600">
                <DocumentList onDocumentSelect={(doc) => console.log('Selected document:', doc)} />
              </div>
            )}
          </div>

          {/* User Info & Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Logout
              </button>
            </div>

            {/* Token Usage */}
            {user?.subscription && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Tokens Used</span>
                  <span>
                    {user.subscription.tokensUsed} / {user.subscription.tokensLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (user.subscription.tokensUsed / user.subscription.tokensLimit) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

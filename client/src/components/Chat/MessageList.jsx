import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, ChevronDown } from 'lucide-react';
import { useState as useStateAlias } from 'react';

const MessageList = ({
  messages,
  streamingMessage,
  isStreaming,
  typingUsers,
  currentUser
}) => {
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Check if user is at the bottom of the scroll
  const isAtBottom = useCallback(() => {
    if (!scrollContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const atBottom = isAtBottom();
    setIsUserScrolling(!atBottom);
    setShowScrollToBottom(!atBottom);

    // Debug logging
    console.log('Scroll event:', {
      scrollTop: scrollContainerRef.current.scrollTop,
      scrollHeight: scrollContainerRef.current.scrollHeight,
      clientHeight: scrollContainerRef.current.clientHeight,
      atBottom
    });
  }, [isAtBottom]);

  // Smart auto-scroll: only scroll if user is at bottom or it's a new conversation
  useEffect(() => {
    if (!isUserScrolling || messages.length <= 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessage, isUserScrolling]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsUserScrolling(false);
    setShowScrollToBottom(false);
  }, []);

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const messageId = `${index}-${message.timestamp}`;

    return (
      <div
        key={messageId}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {isUser ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className={`group relative ${isUser ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-4 py-2 rounded-lg ${
              isUser
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
            }`}>
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-md"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Message Actions */}
            {!isUser && (
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyToClipboard(message.content, messageId)}
                  className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Copy message"
                >
                  {copiedMessageId === messageId ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </div>
            )}

            {/* Timestamp */}
            <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
              isUser ? 'text-right' : 'text-left'
            }`}>
              {formatTimestamp(message.timestamp)}
              {message.metadata?.tokensUsed && (
                <span className="ml-2">
                  • {message.metadata.tokensUsed} tokens
                </span>
              )}
            </div>

            {/* Sources */}
            {message.metadata?.sources && message.metadata.sources.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Sources: {message.metadata.sources.length} document(s)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStreamingMessage = () => {
    if (!isStreaming && !streamingMessage) return null;

    return (
      <div className="flex justify-start mb-4">
        <div className="flex max-w-[80%]">
          {/* Avatar */}
          <div className="flex-shrink-0 mr-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <Bot className="w-4 h-4" />
            </div>
          </div>

          {/* Message Content */}
          <div className="group relative">
            <div className="inline-block px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
              {streamingMessage ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                  <span className="inline-block w-2 h-4 bg-primary-600 animate-pulse ml-1" />
                </div>
              ) : (
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot animation-delay-150"></div>
                  <div className="typing-dot animation-delay-300"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <div className="flex justify-start mb-4">
        <div className="flex max-w-[80%]">
          <div className="flex-shrink-0 mr-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="inline-block px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot animation-delay-150"></div>
              <div className="typing-dot animation-delay-300"></div>
            </div>
            <div className="text-xs mt-1">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto p-4 space-y-4 scrollbar-thin"
        style={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {messages.length === 0 && !isStreaming ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Welcome to AI Assistant
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Start a conversation by typing a message below. You can ask questions,
                upload documents for analysis, or request summaries and flashcards.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            {renderStreamingMessage()}
            {renderTypingIndicator()}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-10 animate-bounce"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default MessageList;

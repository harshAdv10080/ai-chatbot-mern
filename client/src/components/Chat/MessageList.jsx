import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Animation variants
const messageVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      mass: 1
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const avatarVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 20,
      delay: 0.1
    }
  }
};

const typingVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2
    }
  }
};

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
      <motion.div
        key={messageId}
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <motion.div
            variants={avatarVariants}
            className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}
          >
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isUser
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isUser ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </motion.div>
          </motion.div>

          {/* Message Content */}
          <div className={`group relative ${isUser ? 'text-right' : 'text-left'}`}>
            <motion.div
              className={`inline-block px-4 py-2 rounded-lg ${
                isUser
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
              }`}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
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
            </motion.div>

            {/* Message Actions */}
            {!isUser && (
              <motion.div
                className="absolute top-0 right-0"
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  onClick={() => copyToClipboard(message.content, messageId)}
                  className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Copy message"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <AnimatePresence mode="wait">
                    {copiedMessageId === messageId ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="w-3 h-3 text-green-600" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Copy className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
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
      </motion.div>
    );
  };

  const renderStreamingMessage = () => {
    if (!isStreaming && !streamingMessage) return null;

    return (
      <motion.div
        className="flex justify-start mb-4"
        variants={typingVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex max-w-[80%]">
          {/* Avatar */}
          <motion.div
            className="flex-shrink-0 mr-3"
            variants={avatarVariants}
          >
            <motion.div
              className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Bot className="w-4 h-4" />
            </motion.div>
          </motion.div>

          {/* Message Content */}
          <div className="group relative">
            <motion.div
              className="inline-block px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              animate={{
                boxShadow: [
                  "0 0 0 rgba(59, 130, 246, 0)",
                  "0 0 20px rgba(59, 130, 246, 0.3)",
                  "0 0 0 rgba(59, 130, 246, 0)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {streamingMessage ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                  <motion.span
                    className="inline-block w-2 h-4 bg-primary-600 ml-1"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              ) : (
                <div className="typing-indicator">
                  <motion.div
                    className="typing-dot"
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div
                    className="typing-dot"
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2
                    }}
                  />
                  <motion.div
                    className="typing-dot"
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4
                    }}
                  />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
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
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => renderMessage(message, index))}
            {renderStreamingMessage()}
            {renderTypingIndicator()}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg z-10"
            title="Scroll to bottom"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              rotate: [0, 5, -5, 0]
            }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            whileHover={{
              scale: 1.1,
              boxShadow: "0 8px 25px rgba(59, 130, 246, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              rotate: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            <motion.div
              animate={{ y: [0, 3, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;

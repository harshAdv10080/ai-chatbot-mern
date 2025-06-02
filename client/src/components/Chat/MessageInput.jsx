import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './FileUpload';

// Animation variants
const containerVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  tap: { scale: 0.95 }
};

const sendButtonVariants = {
  idle: {
    scale: 1,
    rotate: 0,
    backgroundColor: "rgb(37, 99, 235)"
  },
  hover: {
    scale: 1.1,
    rotate: 15,
    backgroundColor: "rgb(29, 78, 216)",
    boxShadow: "0 8px 25px rgba(37, 99, 235, 0.4)"
  },
  tap: { scale: 0.9, rotate: 0 },
  disabled: {
    scale: 1,
    opacity: 0.5,
    backgroundColor: "rgb(156, 163, 175)"
  }
};

const MessageInput = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = "Type your message..."
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value.trim() && !typingTimeoutRef.current) {
      onTypingStart?.();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop?.();
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim() || disabled) return;

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    onTypingStop?.();

    // Send message
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = () => {
    setShowFileUpload(true);
  };

  const handleUploadSuccess = (document) => {
    console.log('Document uploaded successfully:', document);
    // You can add a message to the chat about the successful upload
    if (onSendMessage) {
      onSendMessage(`📄 Document "${document.filename}" uploaded successfully! You can now ask questions about it.`, 'system');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // TODO: Implement voice recording stop
    } else {
      // Start recording
      setIsRecording(true);
      // TODO: Implement voice recording start
    }
  };

  return (
    <>
      <motion.div
        className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* File Upload Button */}
        <motion.button
          type="button"
          onClick={handleFileUpload}
          className="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Upload file"
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Paperclip className="w-5 h-5" />
          </motion.div>
        </motion.button>

        {/* Message Input */}
        <motion.div
          className="flex-1 relative"
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <motion.textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', maxHeight: '120px' }}
            whileFocus={{
              boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1)"
            }}
          />

          {/* Character count (optional) */}
          <AnimatePresence>
            {message.length > 3000 && (
              <motion.div
                className="absolute bottom-1 right-12 text-xs text-gray-400"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {message.length}/4000
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Voice Recording Button */}
        <motion.button
          type="button"
          onClick={toggleRecording}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            isRecording
              ? 'text-red-600 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
          }`}
          title={isRecording ? 'Stop recording' : 'Start voice recording'}
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
          transition={isRecording ? { duration: 1, repeat: Infinity } : {}}
        >
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="stop"
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -180 }}
                transition={{ duration: 0.2 }}
              >
                <Square className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Mic className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={!message.trim() || disabled}
          className="flex-shrink-0 p-2 rounded-lg text-white disabled:cursor-not-allowed"
          title="Send message"
          variants={sendButtonVariants}
          initial="idle"
          animate={!message.trim() || disabled ? "disabled" : "idle"}
          whileHover={!message.trim() || disabled ? {} : "hover"}
          whileTap={!message.trim() || disabled ? {} : "tap"}
        >
          <motion.div
            animate={message.trim() && !disabled ? {
              x: [0, 2, 0],
              rotate: [0, 15, 0]
            } : {}}
            transition={{
              duration: 0.5,
              repeat: message.trim() && !disabled ? Infinity : 0,
              repeatDelay: 2
            }}
          >
            <Send className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </form>

      {/* Quick Actions (optional) */}
      <AnimatePresence>
        {!message.trim() && (
          <motion.div
            className="mt-3 flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <motion.button
              type="button"
              onClick={() => setMessage('Summarize this document for me')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              📄 Summarize document
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setMessage('Create flashcards from this content')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              🃏 Create flashcards
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setMessage('Help me understand this topic')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              🤔 Explain topic
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status indicators */}
      <AnimatePresence>
        {disabled && (
          <motion.div
            className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-2 h-2 bg-yellow-500 rounded-full mr-2"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            AI is thinking...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </>
  );
};

export default MessageInput;

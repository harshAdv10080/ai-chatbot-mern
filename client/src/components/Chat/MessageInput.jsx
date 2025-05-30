import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Square } from 'lucide-react';
import FileUpload from './FileUpload';

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
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* File Upload Button */}
        <button
          type="button"
          onClick={handleFileUpload}
          className="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Upload file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />

          {/* Character count (optional) */}
          {message.length > 3000 && (
            <div className="absolute bottom-1 right-12 text-xs text-gray-400">
              {message.length}/4000
            </div>
          )}
        </div>

        {/* Voice Recording Button */}
        <button
          type="button"
          onClick={toggleRecording}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            isRecording
              ? 'text-red-600 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
          }`}
          title={isRecording ? 'Stop recording' : 'Start voice recording'}
        >
          {isRecording ? (
            <Square className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="flex-shrink-0 p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Quick Actions (optional) */}
      {!message.trim() && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMessage('Summarize this document for me')}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            📄 Summarize document
          </button>
          <button
            type="button"
            onClick={() => setMessage('Create flashcards from this content')}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            🃏 Create flashcards
          </button>
          <button
            type="button"
            onClick={() => setMessage('Help me understand this topic')}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            🤔 Explain topic
          </button>
        </div>
      )}

      {/* Status indicators */}
      {disabled && (
        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
          AI is thinking...
        </div>
      )}
    </div>

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

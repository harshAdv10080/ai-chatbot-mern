import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AuthLoadingSpinner = ({ size = 'md', className = '' }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showWakeUpMessage, setShowWakeUpMessage] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const messages = [
    'Connecting to server...',
    'Authenticating credentials...',
    'Setting up your session...'
  ];

  const wakeUpMessages = [
    'Server is waking up from sleep...',
    'This may take 30-60 seconds...',
    'Thank you for your patience! 🙏'
  ];

  useEffect(() => {
    // Show wake-up message after 3 seconds
    const wakeUpTimer = setTimeout(() => {
      setShowWakeUpMessage(true);
    }, 3000);

    // Cycle through regular messages every 2 seconds
    const messageTimer = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => {
      clearTimeout(wakeUpTimer);
      clearInterval(messageTimer);
    };
  }, []);

  useEffect(() => {
    if (showWakeUpMessage) {
      // Cycle through wake-up messages every 3 seconds
      const wakeUpMessageTimer = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % wakeUpMessages.length);
      }, 3000);

      return () => clearInterval(wakeUpMessageTimer);
    }
  }, [showWakeUpMessage]);

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {/* Animated Spinner */}
      <motion.div 
        className={`rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />

      {/* Progressive Messages */}
      <AnimatePresence mode="wait">
        <motion.div
          key={showWakeUpMessage ? `wake-${currentMessage}` : `normal-${currentMessage}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-4 text-center"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {showWakeUpMessage ? wakeUpMessages[currentMessage] : messages[currentMessage]}
          </p>
          
          {showWakeUpMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50"
            >
              <p className="text-xs text-amber-700 dark:text-amber-300">
                ⚡ Free tier server is starting up
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Progress Dots */}
      <motion.div 
        className="flex space-x-1 mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-primary-600 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default AuthLoadingSpinner;

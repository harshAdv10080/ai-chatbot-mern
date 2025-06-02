import React from 'react';
import { motion } from 'framer-motion';

const AnimatedLoader = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [-8, 0, -8],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Animated Spinner */}
      <motion.div
        className={`${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 border-t-primary-600 rounded-full`}
        variants={spinnerVariants}
        animate="animate"
      />

      {/* Bouncing Dots */}
      <motion.div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-primary-600 rounded-full"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </motion.div>

      {/* Loading Text */}
      {text && (
        <motion.p 
          className="text-sm text-gray-600 dark:text-gray-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
};

// Pulse Loader Component
export const PulseLoader = ({ className = '' }) => {
  return (
    <motion.div 
      className={`flex space-x-2 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-3 h-3 bg-primary-600 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </motion.div>
  );
};

// Wave Loader Component
export const WaveLoader = ({ className = '' }) => {
  return (
    <motion.div 
      className={`flex items-end space-x-1 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.div
          key={index}
          className="w-1 bg-primary-600 rounded-full"
          animate={{
            height: [4, 16, 4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  );
};

// Typing Indicator Component
export const TypingIndicator = ({ className = '' }) => {
  return (
    <motion.div 
      className={`flex items-center space-x-1 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <span className="text-sm text-gray-500 dark:text-gray-400">AI is typing</span>
      <motion.div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-1 h-1 bg-gray-400 rounded-full"
            animate={{
              y: [0, -4, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default AnimatedLoader;

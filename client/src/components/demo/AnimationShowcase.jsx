import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Heart, 
  Star, 
  Zap, 
  Sparkles,
  MessageCircle,
  Bot,
  User
} from 'lucide-react';
import AnimatedLoader, { PulseLoader, WaveLoader, TypingIndicator } from '../common/AnimatedLoader';
import PageTransition, { StaggerContainer, StaggerItem } from '../common/PageTransition';

const AnimationShowcase = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [likedItems, setLikedItems] = useState(new Set());
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! Welcome to the animation showcase!", sender: 'bot' },
    { id: 2, text: "These animations make the UI feel alive!", sender: 'user' }
  ]);

  const toggleLike = (id) => {
    const newLiked = new Set(likedItems);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLikedItems(newLiked);
  };

  const addMessage = () => {
    const newMessage = {
      id: messages.length + 1,
      text: `New animated message #${messages.length + 1}`,
      sender: Math.random() > 0.5 ? 'bot' : 'user'
    };
    setMessages([...messages, newMessage]);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    hover: {
      y: -5,
      scale: 1.02,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const iconVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { 
      scale: 1.2, 
      rotate: 15,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    },
    tap: { scale: 0.9, rotate: -15 }
  };

  const heartVariants = {
    liked: {
      scale: [1, 1.3, 1],
      rotate: [0, 15, -15, 0],
      transition: { duration: 0.6 }
    },
    unliked: {
      scale: 1,
      rotate: 0
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            style={{
              background: "linear-gradient(45deg, #3B82F6, #8B5CF6, #EC4899, #3B82F6)",
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ✨ Advanced Animations Showcase
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Beautiful, smooth animations powered by Framer Motion
          </motion.p>
        </motion.div>

        {/* Animation Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Loaders Section */}
          <StaggerItem>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Loading Animations
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Default Loader</span>
                  <AnimatedLoader size="sm" text="" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pulse Loader</span>
                  <PulseLoader />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Wave Loader</span>
                  <WaveLoader />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Typing</span>
                  <TypingIndicator />
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Interactive Buttons */}
          <StaggerItem>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Interactive Elements
              </h3>
              <div className="space-y-4">
                <motion.button
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg"
                  whileHover={{ scale: 1.05, backgroundColor: "#2563EB" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  Hover & Click Me
                </motion.button>
                
                <div className="flex justify-center space-x-4">
                  {[Heart, Star, Zap, Sparkles].map((Icon, index) => (
                    <motion.button
                      key={index}
                      variants={iconVariants}
                      initial="idle"
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => toggleLike(index)}
                      className={`p-2 rounded-full ${
                        likedItems.has(index) 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/20' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      <motion.div
                        variants={heartVariants}
                        animate={likedItems.has(index) ? "liked" : "unliked"}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Message Animation */}
          <StaggerItem>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Message Animations
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: message.sender === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-center space-x-2 max-w-xs ${
                        message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          message.sender === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {message.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-sm ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          {message.text}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <motion.button
                onClick={addMessage}
                className="mt-3 w-full bg-green-600 text-white py-1 px-3 rounded-lg text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add Message
              </motion.button>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>

        {/* Demo Toggle */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.button
            onClick={() => setShowDemo(!showDemo)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(147, 51, 234, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            {showDemo ? 'Hide' : 'Show'} Page Transition Demo
          </motion.button>
        </motion.div>

        {/* Page Transition Demo */}
        <AnimatePresence>
          {showDemo && (
            <PageTransition type="scale" className="mt-8">
              <motion.div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                  🎉 Page Transition Demo
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-300">
                  This content appears with a beautiful scale animation!
                </p>
              </motion.div>
            </PageTransition>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnimationShowcase;

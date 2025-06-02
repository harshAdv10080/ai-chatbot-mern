import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

// Slide transition variants
const slideVariants = {
  initial: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  in: {
    x: 0,
    opacity: 1
  },
  out: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

const slideTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

// Fade transition variants
const fadeVariants = {
  initial: {
    opacity: 0
  },
  in: {
    opacity: 1
  },
  out: {
    opacity: 0
  }
};

const fadeTransition = {
  duration: 0.3
};

// Scale transition variants
const scaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.8
  },
  in: {
    opacity: 1,
    scale: 1
  },
  out: {
    opacity: 0,
    scale: 1.2
  }
};

const scaleTransition = {
  type: "spring",
  stiffness: 400,
  damping: 25
};

const PageTransition = ({ 
  children, 
  type = 'default', 
  direction = 1,
  className = '',
  ...props 
}) => {
  const getVariants = () => {
    switch (type) {
      case 'slide':
        return slideVariants;
      case 'fade':
        return fadeVariants;
      case 'scale':
        return scaleVariants;
      default:
        return pageVariants;
    }
  };

  const getTransition = () => {
    switch (type) {
      case 'slide':
        return slideTransition;
      case 'fade':
        return fadeTransition;
      case 'scale':
        return scaleTransition;
      default:
        return pageTransition;
    }
  };

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="in"
      exit="out"
      variants={getVariants()}
      transition={getTransition()}
      custom={direction}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Stagger container for animating children
export const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1,
  className = '',
  ...props 
}) => {
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Individual stagger item
export const StaggerItem = ({ 
  children, 
  className = '',
  delay = 0,
  ...props 
}) => {
  const itemVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={itemVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Route transition wrapper
export const RouteTransition = ({ children, location }) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;

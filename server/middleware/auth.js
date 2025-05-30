const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Token is not valid, user not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error in authentication' 
    });
  }
};

// Middleware to check if user has enough tokens
const checkTokens = (tokensNeeded = 1) => {
  return (req, res, next) => {
    if (!req.user.hasTokensAvailable(tokensNeeded)) {
      return res.status(429).json({
        message: 'Token limit exceeded',
        tokensUsed: req.user.subscription.tokensUsed,
        tokensLimit: req.user.subscription.tokensLimit,
        resetDate: req.user.subscription.resetDate
      });
    }
    next();
  };
};

// Middleware to check subscription plan
const checkPlan = (requiredPlan) => {
  const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
  
  return (req, res, next) => {
    const userPlanLevel = planHierarchy[req.user.subscription.plan];
    const requiredPlanLevel = planHierarchy[requiredPlan];
    
    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({
        message: `This feature requires ${requiredPlan} plan`,
        currentPlan: req.user.subscription.plan,
        requiredPlan
      });
    }
    next();
  };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

module.exports = {
  auth,
  checkTokens,
  checkPlan,
  optionalAuth
};

const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if MongoDB is connected
    if (!process.env.MONGODB_URI || !require('mongoose').connection.readyState) {
      // Demo mode - return success without saving to database
      const token = generateToken('demo-user-id');

      return res.status(201).json({
        message: 'User registered successfully (Demo Mode)',
        token,
        user: {
          id: 'demo-user-id',
          name: name,
          email: email,
          preferences: { theme: 'light', language: 'en' },
          subscription: { plan: 'free', tokensUsed: 0, tokensLimit: 1000 }
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (step 1: email + password)
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .exists()
    .withMessage('Password is required'),
  body('twoFactorToken')
    .optional()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('2FA token must be a 6-digit number'),
  body('backupCode')
    .optional()
    .isLength({ min: 8, max: 8 })
    .withMessage('Backup code must be 8 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, twoFactorToken, backupCode } = req.body;

    // Find user and include password and 2FA secret for comparison
    const user = await User.findOne({ email }).select('+password +twoFactorAuth.secret');
    if (!user) {
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    // Check if 2FA is enabled for this user
    if (user.twoFactorAuth.enabled) {
      // 2FA is enabled, check if 2FA token or backup code is provided
      if (!twoFactorToken && !backupCode) {
        return res.status(200).json({
          message: '2FA required',
          requires2FA: true,
          userId: user._id // Temporary identifier for 2FA step
        });
      }

      // Verify 2FA token or backup code
      let verified = false;

      if (twoFactorToken) {
        verified = speakeasy.totp.verify({
          secret: user.twoFactorAuth.secret,
          encoding: 'base32',
          token: twoFactorToken,
          window: 2
        });

        if (!verified) {
          return res.status(400).json({
            message: 'Invalid 2FA token'
          });
        }
      } else if (backupCode) {
        const backupCodeObj = user.twoFactorAuth.backupCodes.find(
          bc => bc.code === backupCode.toUpperCase() && !bc.used
        );
        if (backupCodeObj) {
          verified = true;
          backupCodeObj.used = true;
          await user.save(); // Save the used backup code
        } else {
          return res.status(400).json({
            message: 'Invalid or already used backup code'
          });
        }
      }

      if (!verified) {
        return res.status(400).json({
          message: 'Invalid 2FA verification'
        });
      }
    }

    // Generate token (either no 2FA or 2FA verified)
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        subscription: user.subscription,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        preferences: req.user.preferences,
        subscription: req.user.subscription,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Theme must be light, dark, or system'),
  body('preferences.language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be 2-5 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, preferences } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Server error during profile update'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    const token = generateToken(req.user._id);

    res.json({
      message: 'Token refreshed successfully',
      token
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      message: 'Server error during token refresh'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  auth,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        message: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Server error during password change'
    });
  }
});

// @route   POST /api/auth/2fa/setup
// @desc    Setup 2FA for user
// @access  Private
router.post('/2fa/setup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorAuth.secret');

    if (user.twoFactorAuth.enabled) {
      return res.status(400).json({
        message: '2FA is already enabled for this account'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `AI Chatbot (${user.email})`,
      issuer: 'AI Chatbot',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret temporarily (not enabled yet)
    user.twoFactorAuth.secret = secret.base32;
    await user.save();

    res.json({
      message: '2FA setup initiated',
      qrCode: qrCodeUrl,
      secret: secret.base32,
      manualEntryKey: secret.base32
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      message: 'Server error during 2FA setup'
    });
  }
});

// @route   POST /api/auth/2fa/verify
// @desc    Verify and enable 2FA
// @access  Private
router.post('/2fa/verify', [
  auth,
  body('token')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Token must be a 6-digit number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorAuth.secret');

    if (!user.twoFactorAuth.secret) {
      return res.status(400).json({
        message: '2FA setup not initiated. Please setup 2FA first.'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        message: 'Invalid 2FA token'
      });
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push({
        code: crypto.randomBytes(4).toString('hex').toUpperCase(),
        used: false
      });
    }

    // Enable 2FA
    user.twoFactorAuth.enabled = true;
    user.twoFactorAuth.enabledAt = new Date();
    user.twoFactorAuth.backupCodes = backupCodes;
    await user.save();

    res.json({
      message: '2FA enabled successfully',
      backupCodes: backupCodes.map(bc => bc.code)
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      message: 'Server error during 2FA verification'
    });
  }
});

// @route   POST /api/auth/2fa/disable
// @desc    Disable 2FA
// @access  Private
router.post('/2fa/disable', [
  auth,
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('token')
    .optional()
    .custom((value, { req }) => {
      // If token is provided, validate it
      if (value && (!/^\d{6}$/.test(value))) {
        throw new Error('Token must be a 6-digit number');
      }
      return true;
    }),
  body('backupCode')
    .optional()
    .custom((value, { req }) => {
      // If backupCode is provided, validate it
      if (value && (!/^[A-F0-9]{8}$/i.test(value))) {
        throw new Error('Backup code must be 8 characters (A-F, 0-9)');
      }
      return true;
    })
    .custom((value, { req }) => {
      // Ensure either token or backupCode is provided
      if (!req.body.token && !value) {
        throw new Error('Either 2FA token or backup code is required');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { password, token, backupCode } = req.body;
    const user = await User.findById(req.user._id).select('+password +twoFactorAuth.secret');

    if (!user.twoFactorAuth.enabled) {
      return res.status(400).json({
        message: '2FA is not enabled for this account'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: 'Invalid password'
      });
    }

    // Verify 2FA token or backup code
    let verified = false;

    if (token) {
      verified = speakeasy.totp.verify({
        secret: user.twoFactorAuth.secret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({
          message: 'Invalid 2FA token. Please check your authenticator app.'
        });
      }
    } else if (backupCode) {
      const backupCodeObj = user.twoFactorAuth.backupCodes.find(
        bc => bc.code === backupCode.toUpperCase() && !bc.used
      );
      if (backupCodeObj) {
        verified = true;
        backupCodeObj.used = true;
      } else {
        return res.status(400).json({
          message: 'Invalid or already used backup code.'
        });
      }
    } else {
      return res.status(400).json({
        message: 'Either 2FA token or backup code is required'
      });
    }

    // Disable 2FA
    user.twoFactorAuth.enabled = false;
    user.twoFactorAuth.secret = null;
    user.twoFactorAuth.backupCodes = [];
    user.twoFactorAuth.enabledAt = null;
    await user.save();

    res.json({
      message: '2FA disabled successfully'
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      message: 'Server error during 2FA disable'
    });
  }
});

// @route   GET /api/auth/2fa/status
// @desc    Get 2FA status
// @access  Private
router.get('/2fa/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      enabled: user.twoFactorAuth.enabled,
      enabledAt: user.twoFactorAuth.enabledAt,
      backupCodesCount: user.twoFactorAuth.backupCodes.filter(bc => !bc.used).length
    });

  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({
      message: 'Server error getting 2FA status'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    console.log('Forgot password request for email:', email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      // Don't reveal if email exists or not for security
      return res.json({
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    console.log('User found:', user.email);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // In a real app, you would send an email here
    // For demo purposes, we'll return the reset token
    const clientUrl = process.env.CLIENT_URL || 'https://ai-chatbot-frontend-hzof.onrender.com';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    // TODO: Send email with reset link
    console.log('Password reset link:', resetUrl);

    res.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
      // Remove this in production - only for demo
      resetUrl: resetUrl
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'Server error during password reset request'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Server error during password reset'
    });
  }
});

// @route   GET /api/auth/test-forgot-password
// @desc    Test forgot password functionality
// @access  Public
router.get('/test-forgot-password', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'https://ai-chatbot-frontend-hzof.onrender.com';
  const testToken = 'test123456789';
  const resetUrl = `${clientUrl}/reset-password?token=${testToken}`;

  res.json({
    message: 'Test endpoint working',
    clientUrl: clientUrl,
    resetUrl: resetUrl,
    env: {
      CLIENT_URL: process.env.CLIENT_URL,
      NODE_ENV: process.env.NODE_ENV
    }
  });
});

module.exports = router;

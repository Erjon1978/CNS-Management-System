const express = require('express');
const { body } = require('express-validator');
const { 
  registerUser, 
  loginUser, 
  changePassword, 
  getMe,
  logoutUser 
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], loginUser);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], changePassword);

// Admin only routes
router.post('/register', protect, admin, [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required')
], registerUser);

module.exports = router;
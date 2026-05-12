const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');  // Add restrictTo here

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);

// Admin only routes
router.get('/users', protect, restrictTo('admin'), authController.getAllUsers);
router.put('/users/:id/role', protect, restrictTo('admin'), authController.updateUserRole);

module.exports = router;
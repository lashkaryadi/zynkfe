const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, registerRules, loginRules } = require('../middleware/validator');
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login', authLimiter, loginRules, validate, authController.login);

// OAuth callbacks (no auth needed — user returns from platform)
router.get('/:platform/callback', authController.platformCallback);

// Protected routes
router.use(authenticate);
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.get('/connect/:platform', authController.connectPlatform);
router.post('/disconnect/:platform', authController.disconnectPlatform);

module.exports = router;

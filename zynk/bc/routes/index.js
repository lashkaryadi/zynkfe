const express = require('express');
const router = express.Router();
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiter to all API routes
router.use(apiLimiter);

// Mount route modules
router.use('/auth', require('./auth'));
router.use('/platforms', require('./platforms'));
router.use('/analytics', require('./analytics'));
router.use('/content', require('./content'));
router.use('/audience', require('./audience'));
router.use('/revenue', require('./revenue'));
router.use('/competitors', require('./competitors'));
router.use('/insights', require('./insights'));
router.use('/webhooks', require('./webhooks'));

module.exports = router;

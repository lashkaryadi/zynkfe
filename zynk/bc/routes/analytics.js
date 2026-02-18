const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, dateRangeRules, platformRules } = require('../middleware/validator');
const analyticsController = require('../controllers/analyticsController');

router.use(authenticate);

router.get('/overview', dateRangeRules, validate, analyticsController.getOverview);
router.get('/platform/:platform', [...platformRules, ...dateRangeRules], validate, analyticsController.getPlatformDeepDive);
router.get('/growth', dateRangeRules, validate, analyticsController.getGrowthTrends);
router.get('/content-performance', dateRangeRules, validate, analyticsController.getContentPerformance);

module.exports = router;

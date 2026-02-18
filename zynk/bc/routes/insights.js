const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const insightsController = require('../controllers/insightsController');

router.use(authenticate);

router.get('/predictions/followers', insightsController.getFollowerPredictions);
router.get('/predictions/content', insightsController.getContentPredictions);
router.get('/posting-times', insightsController.getOptimalPostingTimes);
router.get('/suggestions', insightsController.getContentSuggestions);
router.get('/trending', insightsController.getTrendingTopics);
router.get('/hashtags', insightsController.getHashtagAnalysis);
router.get('/burnout', insightsController.getBurnoutRisk);
router.get('/collaborations', insightsController.getCollaborationOpportunities);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, dateRangeRules } = require('../middleware/validator');
const revenueController = require('../controllers/revenueController');

router.use(authenticate);

router.get('/', dateRangeRules, validate, revenueController.getRevenueOverview);
router.post('/', revenueController.addManualRevenue);

module.exports = router;

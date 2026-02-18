const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const audienceController = require('../controllers/audienceController');

router.use(authenticate);

router.get('/', audienceController.getAudienceOverview);
router.get('/geographic', audienceController.getGeographicData);
router.get('/active-hours', audienceController.getActiveHours);

module.exports = router;

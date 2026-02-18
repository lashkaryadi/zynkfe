const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, platformRules } = require('../middleware/validator');
const platformController = require('../controllers/platformController');

router.use(authenticate);

router.get('/', platformController.listPlatforms);
router.get('/:platform', platformRules, validate, platformController.getPlatformDetails);
router.post('/:platform/sync', platformController.syncPlatform);

module.exports = router;

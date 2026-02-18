const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, competitorRules, objectIdRule } = require('../middleware/validator');
const competitorController = require('../controllers/competitorController');

router.use(authenticate);

router.get('/', competitorController.listCompetitors);
router.post('/', competitorRules, validate, competitorController.addCompetitor);
router.delete('/:id', objectIdRule, validate, competitorController.removeCompetitor);
router.get('/compare', competitorController.compareWithCompetitors);

module.exports = router;

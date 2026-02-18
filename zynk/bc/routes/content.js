const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, paginationRules, objectIdRule } = require('../middleware/validator');
const contentController = require('../controllers/contentController');

router.use(authenticate);

router.get('/', paginationRules, validate, contentController.listContent);
router.get('/top', contentController.getTopContent);
router.get('/:id', objectIdRule, validate, contentController.getContentById);

module.exports = router;

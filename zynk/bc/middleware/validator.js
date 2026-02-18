const { validationResult, query, body, param } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

const dateRangeRules = [
  query('range').optional().isIn(['7d', '30d', '90d', '1y', 'custom']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
];

const platformRules = [
  query('platform').optional().isIn(['youtube', 'instagram', 'tiktok', 'twitter']),
];

const paginationRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const registerRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty(),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const competitorRules = [
  body('platform').isIn(['youtube', 'instagram', 'tiktok', 'twitter']),
  body('username').trim().notEmpty(),
];

const alertRules = [
  body('metric').notEmpty(),
  body('platform').isIn(['youtube', 'instagram', 'tiktok', 'twitter']),
  body('condition').isIn(['above', 'below', 'change_percent']),
  body('threshold').isNumeric(),
];

const objectIdRule = [
  param('id').isMongoId(),
];

module.exports = {
  validate,
  dateRangeRules,
  platformRules,
  paginationRules,
  registerRules,
  loginRules,
  competitorRules,
  alertRules,
  objectIdRule,
};

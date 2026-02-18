const User = require('../models/User');
const { calculateContentScores } = require('../services/analyticsEngine');
const logger = require('../utils/logger');

async function processAllUsersMetrics() {
  const users = await User.find({
    'connectedPlatforms.0': { $exists: true },
  });

  logger.info(`Processing metrics for ${users.length} users`);

  for (const user of users) {
    try {
      await calculateContentScores(user._id);
      logger.info(`Processed metrics for user ${user._id}`);
    } catch (err) {
      logger.error(`Failed processing metrics for user ${user._id}:`, err);
    }
  }
}

module.exports = { processAllUsersMetrics };

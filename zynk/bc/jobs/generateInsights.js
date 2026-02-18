const User = require('../models/User');
const insightsEngine = require('../services/insightsEngine');
const predictionEngine = require('../services/predictionEngine');
const logger = require('../utils/logger');

async function generateAllInsights() {
  const users = await User.find({
    'connectedPlatforms.0': { $exists: true },
  });

  logger.info(`Generating insights for ${users.length} users`);

  for (const user of users) {
    try {
      // Run all insights in parallel
      await Promise.all([
        insightsEngine.getContentSuggestions(user._id),
        insightsEngine.detectTrendingTopics(user._id),
        insightsEngine.detectBurnoutRisk(user._id),
        predictionEngine.predictFollowerGrowth(user._id),
        predictionEngine.predictContentPerformance(user._id),
        predictionEngine.predictOptimalPostingTimes(user._id),
      ]);
      logger.info(`Generated insights for user ${user._id}`);
    } catch (err) {
      logger.error(`Failed generating insights for user ${user._id}:`, err);
    }
  }
}

module.exports = { generateAllInsights };

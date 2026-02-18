const cron = require('node-cron');
const logger = require('../utils/logger');
const { fetchAllUsersAnalytics } = require('../jobs/fetchAnalytics');
const { processAllUsersMetrics } = require('../jobs/processMetrics');
const { generateAllInsights } = require('../jobs/generateInsights');

function startScheduler() {
  const fetchCron = process.env.FETCH_ANALYTICS_CRON || '0 */6 * * *';
  const processCron = process.env.PROCESS_METRICS_CRON || '0 */12 * * *';
  const insightsCron = process.env.GENERATE_INSIGHTS_CRON || '0 0 * * *';

  // Fetch analytics from all platforms every 6 hours
  cron.schedule(fetchCron, async () => {
    logger.info('Cron: Starting analytics fetch');
    try {
      await fetchAllUsersAnalytics();
      logger.info('Cron: Analytics fetch complete');
    } catch (err) {
      logger.error('Cron: Analytics fetch failed:', err);
    }
  });

  // Process and aggregate metrics every 12 hours
  cron.schedule(processCron, async () => {
    logger.info('Cron: Starting metrics processing');
    try {
      await processAllUsersMetrics();
      logger.info('Cron: Metrics processing complete');
    } catch (err) {
      logger.error('Cron: Metrics processing failed:', err);
    }
  });

  // Generate insights daily at midnight
  cron.schedule(insightsCron, async () => {
    logger.info('Cron: Starting insights generation');
    try {
      await generateAllInsights();
      logger.info('Cron: Insights generation complete');
    } catch (err) {
      logger.error('Cron: Insights generation failed:', err);
    }
  });

  logger.info('Scheduler started with cron schedules');
}

module.exports = { startScheduler };

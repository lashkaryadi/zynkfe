const analyticsEngine = require('../services/analyticsEngine');
const cacheService = require('../services/cacheService');
const { generateCacheKey } = require('../utils/helpers');
const { CACHE_TTL } = require('../config/constants');

async function getOverview(req, res, next) {
  try {
    const { range = '30d', startDate, endDate } = req.query;
    const cacheKey = generateCacheKey('overview', req.user._id, { range, startDate, endDate });

    const data = await cacheService.getOrSet(
      cacheKey,
      () => analyticsEngine.getOverview(req.user._id, range, startDate, endDate),
      CACHE_TTL.ANALYTICS_OVERVIEW,
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getPlatformDeepDive(req, res, next) {
  try {
    const { platform } = req.params;
    const { range = '30d', startDate, endDate } = req.query;
    const cacheKey = generateCacheKey('deepdive', req.user._id, { platform, range, startDate, endDate });

    const data = await cacheService.getOrSet(
      cacheKey,
      () => analyticsEngine.getPlatformDeepDive(req.user._id, platform, range, startDate, endDate),
      CACHE_TTL.PLATFORM_METRICS,
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getGrowthTrends(req, res, next) {
  try {
    const { range = '30d', startDate, endDate } = req.query;
    const data = await analyticsEngine.getGrowthTrends(req.user._id, range, startDate, endDate);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getContentPerformance(req, res, next) {
  try {
    const { range = '30d', startDate, endDate, limit } = req.query;
    const data = await analyticsEngine.getContentPerformanceGrid(
      req.user._id, range, startDate, endDate, parseInt(limit, 10) || 20,
    );
    res.json({ content: data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOverview, getPlatformDeepDive, getGrowthTrends, getContentPerformance };

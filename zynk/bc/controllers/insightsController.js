const predictionEngine = require('../services/predictionEngine');
const insightsEngine = require('../services/insightsEngine');
const cacheService = require('../services/cacheService');
const { generateCacheKey } = require('../utils/helpers');
const { CACHE_TTL } = require('../config/constants');

async function getFollowerPredictions(req, res, next) {
  try {
    const { platform, days = 30 } = req.query;
    const cacheKey = generateCacheKey('predictions:followers', req.user._id, { platform, days });

    const data = await cacheService.getOrSet(
      cacheKey,
      () => predictionEngine.predictFollowerGrowth(req.user._id, platform, parseInt(days, 10)),
      CACHE_TTL.PREDICTIONS,
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getContentPredictions(req, res, next) {
  try {
    const { platform } = req.query;
    const data = await predictionEngine.predictContentPerformance(req.user._id, platform);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getOptimalPostingTimes(req, res, next) {
  try {
    const { platform } = req.query;
    const data = await predictionEngine.predictOptimalPostingTimes(req.user._id, platform);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getContentSuggestions(req, res, next) {
  try {
    const data = await insightsEngine.getContentSuggestions(req.user._id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getTrendingTopics(req, res, next) {
  try {
    const data = await insightsEngine.detectTrendingTopics(req.user._id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getHashtagAnalysis(req, res, next) {
  try {
    const { platform } = req.query;
    const data = await insightsEngine.analyzeHashtagPerformance(req.user._id, platform);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getBurnoutRisk(req, res, next) {
  try {
    const data = await insightsEngine.detectBurnoutRisk(req.user._id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getCollaborationOpportunities(req, res, next) {
  try {
    const data = await insightsEngine.findCollaborationOpportunities(req.user._id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFollowerPredictions,
  getContentPredictions,
  getOptimalPostingTimes,
  getContentSuggestions,
  getTrendingTopics,
  getHashtagAnalysis,
  getBurnoutRisk,
  getCollaborationOpportunities,
};

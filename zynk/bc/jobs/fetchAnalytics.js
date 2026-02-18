const User = require('../models/User');
const PlatformAccount = require('../models/PlatformAccount');
const Analytics = require('../models/Analytics');
const Content = require('../models/Content');
const AudienceDemographic = require('../models/AudienceDemographic');
const Revenue = require('../models/Revenue');
const { getPlatformService } = require('../services/platforms/platformFactory');
const normalization = require('../services/normalization');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

async function fetchAllUsersAnalytics() {
  const users = await User.find({
    'connectedPlatforms.0': { $exists: true },
  });

  logger.info(`Fetching analytics for ${users.length} users`);

  for (const user of users) {
    try {
      await fetchUserAnalytics(user);
    } catch (err) {
      logger.error(`Failed fetching for user ${user._id}:`, err);
    }
  }
}

async function fetchUserAnalytics(user) {
  const activePlatforms = user.connectedPlatforms.filter((p) => p.isActive);
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  for (const platformConn of activePlatforms) {
    try {
      const service = getPlatformService(platformConn.platform);

      // Refresh token if needed
      let accessToken = platformConn.accessToken;
      if (platformConn.tokenExpiry && new Date(platformConn.tokenExpiry) < new Date()) {
        const newTokens = await service.refreshAccessToken(platformConn.refreshToken);
        accessToken = newTokens.access_token;
        platformConn.accessToken = newTokens.access_token;
        if (newTokens.refresh_token) platformConn.refreshToken = newTokens.refresh_token;
        platformConn.tokenExpiry = new Date(Date.now() + (newTokens.expires_in || 3600) * 1000);
        await user.save();
      }

      // Fetch and store account info
      await _fetchAccountInfo(user._id, platformConn, service, accessToken);

      // Fetch and store analytics
      await _fetchAnalyticsData(user._id, platformConn, service, accessToken, startDate, endDate);

      // Fetch and store content
      await _fetchContent(user._id, platformConn, service, accessToken);

      // Fetch demographics
      await _fetchDemographics(user._id, platformConn, service, accessToken);

      // Fetch revenue (if available)
      await _fetchRevenue(user._id, platformConn, service, accessToken, startDate, endDate);

      // Invalidate cache for this user
      await cacheService.invalidatePattern(`*:${user._id}:*`);

      logger.info(`Fetched ${platformConn.platform} data for user ${user._id}`);
    } catch (err) {
      logger.error(`Error fetching ${platformConn.platform} for user ${user._id}:`, err.message);
    }
  }
}

async function _fetchAccountInfo(userId, platformConn, service, accessToken) {
  let rawInfo;
  switch (platformConn.platform) {
    case 'youtube':
      rawInfo = await service.getChannelInfo(accessToken, platformConn.refreshToken);
      break;
    case 'instagram':
      rawInfo = await service.getAccountInfo(accessToken);
      break;
    case 'tiktok':
      rawInfo = await service.getUserInfo(accessToken);
      break;
    case 'twitter':
      rawInfo = await service.getUserInfo(accessToken);
      break;
    default:
      return;
  }

  const normalized = normalization.normalizeAccountInfo(platformConn.platform, rawInfo);

  await PlatformAccount.findOneAndUpdate(
    { userId, platform: platformConn.platform },
    { ...normalized, userId, lastFetchedAt: new Date() },
    { upsert: true, new: true },
  );
}

async function _fetchAnalyticsData(userId, platformConn, service, accessToken, startDate, endDate) {
  let rawAnalytics;
  switch (platformConn.platform) {
    case 'youtube':
      rawAnalytics = await service.getAnalytics(accessToken, platformConn.refreshToken, startDate, endDate);
      break;
    case 'instagram':
      rawAnalytics = await service.getAnalytics(accessToken, platformConn.accountId, startDate, endDate);
      break;
    case 'tiktok': {
      const result = await service.getAnalytics(accessToken, startDate, endDate);
      rawAnalytics = [{ date: new Date(), followers: { total: result.summary.followers }, reach: { views: result.summary.totalViews }, engagement: {} }];
      break;
    }
    case 'twitter': {
      const result = await service.getAnalytics(accessToken, platformConn.accountId, startDate, endDate);
      rawAnalytics = [{ date: new Date(), reach: { impressions: result.totalImpressions }, engagement: { likes: result.totalLikes, comments: result.totalReplies, shares: result.totalRetweets } }];
      break;
    }
    default:
      return;
  }

  const normalized = normalization.normalizeAnalytics(platformConn.platform, rawAnalytics);

  for (const entry of normalized) {
    await Analytics.findOneAndUpdate(
      { userId, platform: entry.platform, date: entry.date, granularity: entry.granularity },
      { ...entry, userId },
      { upsert: true, new: true },
    );
  }
}

async function _fetchContent(userId, platformConn, service, accessToken) {
  let rawContent;
  switch (platformConn.platform) {
    case 'youtube':
      rawContent = await service.getVideos(accessToken, platformConn.refreshToken);
      break;
    case 'instagram':
      rawContent = await service.getMedia(accessToken, platformConn.accountId);
      break;
    case 'tiktok':
      rawContent = await service.getVideos(accessToken);
      break;
    case 'twitter':
      rawContent = await service.getTweets(accessToken, platformConn.accountId);
      break;
    default:
      return;
  }

  const normalized = normalization.normalizeContent(platformConn.platform, rawContent);

  for (const item of normalized) {
    await Content.findOneAndUpdate(
      { platform: item.platform, platformContentId: item.platformContentId },
      { ...item, userId, lastFetchedAt: new Date() },
      { upsert: true, new: true },
    );
  }
}

async function _fetchDemographics(userId, platformConn, service, accessToken) {
  try {
    let rawDemographics;
    switch (platformConn.platform) {
      case 'youtube':
        rawDemographics = await service.getDemographics(accessToken, platformConn.refreshToken);
        break;
      case 'instagram':
        rawDemographics = await service.getDemographics(accessToken, platformConn.accountId);
        break;
      default:
        return; // TikTok and Twitter don't provide demographics via basic API
    }

    const normalized = normalization.normalizeDemographics(platformConn.platform, rawDemographics);

    await AudienceDemographic.findOneAndUpdate(
      { userId, platform: platformConn.platform, date: normalized.date },
      { ...normalized, userId },
      { upsert: true, new: true },
    );
  } catch (err) {
    logger.warn(`Demographics not available for ${platformConn.platform}:`, err.message);
  }
}

async function _fetchRevenue(userId, platformConn, service, accessToken, startDate, endDate) {
  try {
    if (platformConn.platform !== 'youtube' || !service.getRevenueData) return;

    const rawRevenue = await service.getRevenueData(accessToken, platformConn.refreshToken, startDate, endDate);
    const normalized = normalization.normalizeRevenue(platformConn.platform, rawRevenue);

    for (const entry of normalized) {
      await Revenue.findOneAndUpdate(
        { userId, platform: entry.platform, date: entry.date },
        { ...entry, userId },
        { upsert: true, new: true },
      );
    }
  } catch (err) {
    logger.warn(`Revenue data not available for ${platformConn.platform}`);
  }
}

module.exports = { fetchAllUsersAnalytics, fetchUserAnalytics };

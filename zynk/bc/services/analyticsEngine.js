const Analytics = require('../models/Analytics');
const Content = require('../models/Content');
const PlatformAccount = require('../models/PlatformAccount');
const Revenue = require('../models/Revenue');
const { calculateGrowthRate, calculateEngagementRate } = require('../utils/helpers');
const { parseDateRange, getGranularity } = require('../utils/dateUtils');
const logger = require('../utils/logger');

/**
 * Analytics processing engine — aggregates, computes trends, and generates cross-platform insights.
 */

async function getOverview(userId, range, customStart, customEnd) {
  const { start, end } = parseDateRange(range, customStart, customEnd);

  const [accounts, analyticsData, revenueData] = await Promise.all([
    PlatformAccount.find({ userId, isActive: true }),
    Analytics.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: 1 }),
    Revenue.find({ userId, date: { $gte: start, $lte: end } }),
  ]);

  // Aggregate totals across all platforms
  const totalFollowers = accounts.reduce((sum, a) => sum + a.metrics.followers, 0);

  const platformBreakdown = accounts.map((account) => {
    const platformAnalytics = analyticsData.filter((a) => a.platform === account.platform);
    return {
      platform: account.platform,
      username: account.username,
      profileImageUrl: account.profileImageUrl,
      followers: account.metrics.followers,
      totalViews: platformAnalytics.reduce((s, a) => s + a.reach.views, 0),
      totalEngagement: platformAnalytics.reduce((s, a) =>
        s + a.engagement.likes + a.engagement.comments + a.engagement.shares, 0),
      followerGrowth: platformAnalytics.reduce((s, a) => s + a.followers.net, 0),
    };
  });

  // Daily aggregated data for charts
  const dailyData = _aggregateDailyData(analyticsData);

  // Revenue totals
  const totalRevenue = revenueData.reduce((sum, r) => sum + r.totalRevenue, 0);

  return {
    totalFollowers,
    totalRevenue,
    platformBreakdown,
    dailyData,
    dateRange: { start, end },
    summary: {
      totalViews: analyticsData.reduce((s, a) => s + a.reach.views, 0),
      totalLikes: analyticsData.reduce((s, a) => s + a.engagement.likes, 0),
      totalComments: analyticsData.reduce((s, a) => s + a.engagement.comments, 0),
      totalShares: analyticsData.reduce((s, a) => s + a.engagement.shares, 0),
      followerGrowth: analyticsData.reduce((s, a) => s + a.followers.net, 0),
      avgEngagementRate: _calculateAvgEngagement(analyticsData),
    },
  };
}

async function getPlatformDeepDive(userId, platform, range, customStart, customEnd) {
  const { start, end } = parseDateRange(range, customStart, customEnd);
  const granularity = getGranularity(start, end);

  const [account, analytics, content, revenue] = await Promise.all([
    PlatformAccount.findOne({ userId, platform }),
    Analytics.find({ userId, platform, date: { $gte: start, $lte: end } }).sort({ date: 1 }),
    Content.find({ userId, platform, publishedAt: { $gte: start, $lte: end } })
      .sort({ 'metrics.views': -1 }).limit(20),
    Revenue.find({ userId, platform, date: { $gte: start, $lte: end } }).sort({ date: 1 }),
  ]);

  if (!account) throw new Error(`No ${platform} account connected`);

  // Compute previous period for comparison
  const periodLength = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - periodLength);
  const prevEnd = new Date(start.getTime() - 1);
  const prevAnalytics = await Analytics.find({
    userId, platform, date: { $gte: prevStart, $lte: prevEnd },
  });

  const currentTotals = _sumAnalytics(analytics);
  const prevTotals = _sumAnalytics(prevAnalytics);

  return {
    account: {
      platform: account.platform,
      username: account.username,
      displayName: account.displayName,
      profileImageUrl: account.profileImageUrl,
      currentMetrics: account.metrics,
    },
    trends: analytics,
    topContent: content,
    revenue: revenue,
    comparison: {
      views: { current: currentTotals.views, previous: prevTotals.views, change: calculateGrowthRate(currentTotals.views, prevTotals.views) },
      likes: { current: currentTotals.likes, previous: prevTotals.likes, change: calculateGrowthRate(currentTotals.likes, prevTotals.likes) },
      followers: { current: currentTotals.followerNet, previous: prevTotals.followerNet, change: calculateGrowthRate(currentTotals.followerNet, prevTotals.followerNet) },
      engagement: { current: currentTotals.engagementRate, previous: prevTotals.engagementRate, change: calculateGrowthRate(currentTotals.engagementRate, prevTotals.engagementRate) },
    },
    granularity,
    dateRange: { start, end },
  };
}

async function getGrowthTrends(userId, range, customStart, customEnd) {
  const { start, end } = parseDateRange(range, customStart, customEnd);

  const analytics = await Analytics.find({
    userId, date: { $gte: start, $lte: end },
  }).sort({ date: 1 });

  const platforms = [...new Set(analytics.map((a) => a.platform))];
  const trends = {};

  for (const platform of platforms) {
    const platformData = analytics.filter((a) => a.platform === platform);
    trends[platform] = platformData.map((d) => ({
      date: d.date,
      followers: d.followers.total,
      followerNet: d.followers.net,
      views: d.reach.views,
      engagement: d.engagement.likes + d.engagement.comments + d.engagement.shares,
    }));
  }

  return { trends, platforms, dateRange: { start, end } };
}

async function getContentPerformanceGrid(userId, range, customStart, customEnd, limit = 20) {
  const { start, end } = parseDateRange(range, customStart, customEnd);

  const content = await Content.find({
    userId,
    publishedAt: { $gte: start, $lte: end },
  }).sort({ performanceScore: -1 }).limit(limit);

  return content.map((c) => ({
    id: c._id,
    platform: c.platform,
    type: c.type,
    title: c.title,
    thumbnailUrl: c.thumbnailUrl,
    contentUrl: c.contentUrl,
    publishedAt: c.publishedAt,
    metrics: c.metrics,
    performanceScore: c.performanceScore,
    viralityScore: c.viralityScore,
  }));
}

async function calculateContentScores(userId) {
  const content = await Content.find({ userId });
  if (content.length === 0) return;

  const maxViews = Math.max(...content.map((c) => c.metrics.views), 1);
  const maxEngagement = Math.max(
    ...content.map((c) => c.metrics.likes + c.metrics.comments + c.metrics.shares), 1,
  );

  for (const item of content) {
    const viewScore = (item.metrics.views / maxViews) * 40;
    const engagementTotal = item.metrics.likes + item.metrics.comments + item.metrics.shares;
    const engagementScore = (engagementTotal / maxEngagement) * 40;
    const recencyDays = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 20 - recencyDays * 0.5);

    item.performanceScore = Math.round(viewScore + engagementScore + recencyScore);
    item.viralityScore = item.metrics.shares > 0
      ? Math.round((item.metrics.shares / Math.max(item.metrics.views, 1)) * 1000)
      : 0;

    await item.save();
  }
}

// Internal helpers
function _aggregateDailyData(analyticsData) {
  const dayMap = {};
  for (const entry of analyticsData) {
    const key = entry.date.toISOString().split('T')[0];
    if (!dayMap[key]) {
      dayMap[key] = { date: key, views: 0, likes: 0, comments: 0, shares: 0, followerNet: 0, impressions: 0 };
    }
    dayMap[key].views += entry.reach.views;
    dayMap[key].likes += entry.engagement.likes;
    dayMap[key].comments += entry.engagement.comments;
    dayMap[key].shares += entry.engagement.shares;
    dayMap[key].followerNet += entry.followers.net;
    dayMap[key].impressions += entry.reach.impressions;
  }
  return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
}

function _sumAnalytics(entries) {
  return entries.reduce((acc, e) => ({
    views: acc.views + e.reach.views,
    likes: acc.likes + e.engagement.likes,
    comments: acc.comments + e.engagement.comments,
    shares: acc.shares + e.engagement.shares,
    followerNet: acc.followerNet + e.followers.net,
    engagementRate: acc.engagementRate + e.engagement.rate,
  }), { views: 0, likes: 0, comments: 0, shares: 0, followerNet: 0, engagementRate: 0 });
}

function _calculateAvgEngagement(entries) {
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, e) => sum + e.engagement.rate, 0);
  return total / entries.length;
}

module.exports = {
  getOverview,
  getPlatformDeepDive,
  getGrowthTrends,
  getContentPerformanceGrid,
  calculateContentScores,
};

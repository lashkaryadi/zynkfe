const Content = require('../models/Content');
const Analytics = require('../models/Analytics');
const PlatformAccount = require('../models/PlatformAccount');
const logger = require('../utils/logger');

/**
 * Insights engine — AI content suggestions, trending topics, burnout detection, and more.
 */

async function getContentSuggestions(userId) {
  const content = await Content.find({ userId }).sort({ performanceScore: -1 }).limit(100);
  if (content.length < 5) {
    return { suggestions: ['Post more content to get personalized suggestions.'] };
  }

  const topContent = content.slice(0, 10);
  const bottomContent = content.slice(-10);

  // Analyze what works
  const topHashtags = _getTopItems(topContent.flatMap((c) => c.hashtags), 10);
  const topTypes = _getTopItems(topContent.map((c) => c.type), 5);
  const topHours = _getTopItems(topContent.map((c) => new Date(c.publishedAt).getHours().toString()), 5);

  const suggestions = [];

  if (topTypes.length > 0) {
    suggestions.push({
      type: 'content_type',
      message: `Your ${topTypes[0].item}s perform best. Consider creating more of this type.`,
      data: topTypes,
    });
  }

  if (topHashtags.length > 0) {
    suggestions.push({
      type: 'hashtags',
      message: `These hashtags drive the most engagement: ${topHashtags.slice(0, 5).map((h) => '#' + h.item).join(', ')}`,
      data: topHashtags,
    });
  }

  if (topHours.length > 0) {
    suggestions.push({
      type: 'timing',
      message: `Your best performing posts were published around ${topHours[0].item}:00. Try posting at this time.`,
      data: topHours,
    });
  }

  // Analyze what doesn't work
  const bottomHashtags = _getTopItems(bottomContent.flatMap((c) => c.hashtags), 5);
  if (bottomHashtags.length > 0) {
    suggestions.push({
      type: 'avoid',
      message: `Consider avoiding these underperforming hashtags: ${bottomHashtags.slice(0, 3).map((h) => '#' + h.item).join(', ')}`,
      data: bottomHashtags,
    });
  }

  return { suggestions, analyzedPosts: content.length };
}

async function detectTrendingTopics(userId) {
  const recentContent = await Content.find({ userId })
    .sort({ publishedAt: -1 })
    .limit(50);

  const allHashtags = recentContent.flatMap((c) => c.hashtags);
  const hashtagPerformance = {};

  for (const content of recentContent) {
    for (const tag of content.hashtags) {
      if (!hashtagPerformance[tag]) {
        hashtagPerformance[tag] = { totalViews: 0, totalEngagement: 0, count: 0 };
      }
      hashtagPerformance[tag].totalViews += content.metrics.views;
      hashtagPerformance[tag].totalEngagement +=
        content.metrics.likes + content.metrics.comments + content.metrics.shares;
      hashtagPerformance[tag].count += 1;
    }
  }

  const trending = Object.entries(hashtagPerformance)
    .map(([tag, data]) => ({
      hashtag: tag,
      avgViews: Math.round(data.totalViews / data.count),
      avgEngagement: Math.round(data.totalEngagement / data.count),
      usageCount: data.count,
      score: Math.round((data.totalViews + data.totalEngagement * 5) / data.count),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return { trending };
}

async function analyzeHashtagPerformance(userId, platform) {
  const content = await Content.find({
    userId,
    ...(platform ? { platform } : {}),
    hashtags: { $exists: true, $ne: [] },
  }).sort({ publishedAt: -1 }).limit(200);

  const hashtagStats = {};
  for (const post of content) {
    for (const tag of post.hashtags) {
      if (!hashtagStats[tag]) {
        hashtagStats[tag] = { views: [], likes: [], comments: [], shares: [], posts: 0 };
      }
      hashtagStats[tag].views.push(post.metrics.views);
      hashtagStats[tag].likes.push(post.metrics.likes);
      hashtagStats[tag].comments.push(post.metrics.comments);
      hashtagStats[tag].shares.push(post.metrics.shares);
      hashtagStats[tag].posts += 1;
    }
  }

  const analysis = Object.entries(hashtagStats)
    .filter(([, stats]) => stats.posts >= 2)
    .map(([tag, stats]) => ({
      hashtag: tag,
      posts: stats.posts,
      avgViews: Math.round(stats.views.reduce((a, b) => a + b, 0) / stats.posts),
      avgLikes: Math.round(stats.likes.reduce((a, b) => a + b, 0) / stats.posts),
      avgComments: Math.round(stats.comments.reduce((a, b) => a + b, 0) / stats.posts),
      avgShares: Math.round(stats.shares.reduce((a, b) => a + b, 0) / stats.posts),
    }))
    .sort((a, b) => b.avgViews - a.avgViews);

  return { analysis, totalHashtags: analysis.length, totalPostsAnalyzed: content.length };
}

async function detectBurnoutRisk(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [recentContent, previousContent, recentAnalytics] = await Promise.all([
    Content.find({ userId, publishedAt: { $gte: thirtyDaysAgo } }),
    Content.find({ userId, publishedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
    Analytics.find({ userId, date: { $gte: thirtyDaysAgo } }),
  ]);

  const recentPostFreq = recentContent.length;
  const previousPostFreq = previousContent.length;
  const postFreqChange = previousPostFreq > 0
    ? ((recentPostFreq - previousPostFreq) / previousPostFreq) * 100
    : 0;

  // Detect posting gaps
  const postDates = recentContent
    .map((c) => new Date(c.publishedAt).getTime())
    .sort((a, b) => a - b);

  let maxGap = 0;
  for (let i = 1; i < postDates.length; i++) {
    const gap = (postDates[i] - postDates[i - 1]) / (1000 * 60 * 60 * 24);
    if (gap > maxGap) maxGap = gap;
  }

  // Burnout indicators
  const indicators = [];
  let riskLevel = 'low';

  if (postFreqChange < -30) {
    indicators.push('Posting frequency dropped significantly');
    riskLevel = 'medium';
  }
  if (maxGap > 7) {
    indicators.push(`Longest gap between posts: ${Math.round(maxGap)} days`);
    riskLevel = 'medium';
  }
  if (recentPostFreq === 0) {
    indicators.push('No posts in the last 30 days');
    riskLevel = 'high';
  }
  if (postFreqChange < -50 && maxGap > 14) {
    riskLevel = 'high';
  }

  const recommendations = [];
  if (riskLevel !== 'low') {
    recommendations.push('Consider batch-creating content during high-energy periods');
    recommendations.push('Schedule posts in advance to maintain consistency');
    recommendations.push('It\'s okay to take breaks — quality over quantity');
    if (riskLevel === 'high') {
      recommendations.push('Try repurposing top-performing content across platforms');
    }
  }

  return {
    riskLevel,
    indicators,
    recommendations,
    stats: {
      recentPosts: recentPostFreq,
      previousPosts: previousPostFreq,
      postFreqChange: Math.round(postFreqChange),
      longestGapDays: Math.round(maxGap),
    },
  };
}

async function findCollaborationOpportunities(userId) {
  const accounts = await PlatformAccount.find({ userId, isActive: true });
  const content = await Content.find({ userId }).sort({ publishedAt: -1 }).limit(200);

  // Find frequently mentioned accounts
  const mentionCounts = {};
  for (const post of content) {
    for (const mention of post.mentions || []) {
      mentionCounts[mention] = (mentionCounts[mention] || 0) + 1;
    }
  }

  const frequentMentions = Object.entries(mentionCounts)
    .map(([username, count]) => ({ username, mentionCount: count }))
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 10);

  // Find common hashtag communities
  const hashtagCreators = {};
  for (const post of content) {
    for (const tag of post.hashtags || []) {
      if (!hashtagCreators[tag]) hashtagCreators[tag] = 0;
      hashtagCreators[tag] += 1;
    }
  }

  const communityHashtags = Object.entries(hashtagCreators)
    .filter(([, count]) => count >= 3)
    .map(([tag, count]) => ({ hashtag: tag, usageCount: count }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10);

  return {
    frequentMentions,
    communityHashtags,
    suggestions: [
      'Reach out to creators who frequently engage with similar hashtags',
      'Consider cross-platform collaborations to reach new audiences',
      'Look for creators with complementary content styles',
    ],
  };
}

// Helpers
function _getTopItems(items, limit) {
  const counts = {};
  for (const item of items) {
    counts[item] = (counts[item] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([item, count]) => ({ item, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

module.exports = {
  getContentSuggestions,
  detectTrendingTopics,
  analyzeHashtagPerformance,
  detectBurnoutRisk,
  findCollaborationOpportunities,
};

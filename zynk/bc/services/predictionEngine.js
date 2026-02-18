const ss = require('simple-statistics');
const Analytics = require('../models/Analytics');
const Content = require('../models/Content');
const logger = require('../utils/logger');

/**
 * Prediction engine — AI-powered forecasting using statistical models.
 */

async function predictFollowerGrowth(userId, platform, daysAhead = 30) {
  const analytics = await Analytics.find({
    userId,
    ...(platform ? { platform } : {}),
  }).sort({ date: 1 }).limit(90);

  if (analytics.length < 7) {
    return { error: 'Need at least 7 days of data for predictions' };
  }

  const dataPoints = analytics.map((a, i) => [i, a.followers.total]);

  // Linear regression for trend
  const regression = ss.linearRegression(dataPoints);
  const regressionLine = ss.linearRegressionLine(regression);
  const rSquared = ss.rSquared(dataPoints, regressionLine);

  // Generate predictions
  const lastIndex = dataPoints.length - 1;
  const predictions = [];
  for (let i = 1; i <= daysAhead; i++) {
    const predicted = Math.round(regressionLine(lastIndex + i));
    const date = new Date();
    date.setDate(date.getDate() + i);
    predictions.push({
      date,
      predictedFollowers: Math.max(0, predicted),
      confidence: Math.max(0, rSquared - (i * 0.005)), // confidence decays
    });
  }

  // Growth rate analysis
  const recentGrowth = analytics.slice(-7);
  const avgDailyGrowth = recentGrowth.reduce((s, a) => s + a.followers.net, 0) / recentGrowth.length;

  return {
    predictions,
    model: {
      slope: regression.m,
      intercept: regression.b,
      rSquared,
      avgDailyGrowth: Math.round(avgDailyGrowth),
    },
    milestones: _predictMilestones(analytics[analytics.length - 1].followers.total, avgDailyGrowth),
  };
}

async function predictContentPerformance(userId, platform) {
  const content = await Content.find({
    userId,
    ...(platform ? { platform } : {}),
  }).sort({ publishedAt: -1 }).limit(100);

  if (content.length < 10) {
    return { error: 'Need at least 10 posts for predictions' };
  }

  // Analyze patterns
  const byType = {};
  const byHour = {};
  const byDay = {};

  for (const post of content) {
    // By content type
    if (!byType[post.type]) byType[post.type] = [];
    byType[post.type].push(post.metrics);

    // By hour of day
    const hour = new Date(post.publishedAt).getHours();
    if (!byHour[hour]) byHour[hour] = [];
    byHour[hour].push(post.metrics);

    // By day of week
    const day = new Date(post.publishedAt).getDay();
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(post.metrics);
  }

  // Expected performance by type
  const typePerformance = {};
  for (const [type, metricsList] of Object.entries(byType)) {
    typePerformance[type] = {
      avgViews: Math.round(ss.mean(metricsList.map((m) => m.views))),
      avgLikes: Math.round(ss.mean(metricsList.map((m) => m.likes))),
      avgComments: Math.round(ss.mean(metricsList.map((m) => m.comments))),
      avgEngagement: ss.mean(metricsList.map((m) => m.engagementRate)),
      count: metricsList.length,
    };
  }

  return {
    typePerformance,
    bestContentType: _findBestType(typePerformance),
    postingTimeAnalysis: _analyzePostingTimes(byHour, byDay),
  };
}

async function predictOptimalPostingTimes(userId, platform) {
  const content = await Content.find({
    userId,
    ...(platform ? { platform } : {}),
  }).sort({ publishedAt: -1 }).limit(200);

  if (content.length < 10) {
    return { error: 'Need at least 10 posts for analysis' };
  }

  // Build a heatmap of engagement by hour and day
  const heatmap = Array(7).fill(null).map(() => Array(24).fill(null).map(() => ({ totalEng: 0, count: 0 })));

  for (const post of content) {
    const d = new Date(post.publishedAt);
    const day = d.getDay();
    const hour = d.getHours();
    const engagement = post.metrics.likes + post.metrics.comments + post.metrics.shares;
    heatmap[day][hour].totalEng += engagement;
    heatmap[day][hour].count += 1;
  }

  const scored = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const cell = heatmap[day][hour];
      if (cell.count > 0) {
        scored.push({
          dayOfWeek: day,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
          hour,
          avgEngagement: Math.round(cell.totalEng / cell.count),
          sampleSize: cell.count,
        });
      }
    }
  }

  scored.sort((a, b) => b.avgEngagement - a.avgEngagement);

  return {
    bestTimes: scored.slice(0, 5),
    heatmap: heatmap.map((day) => day.map((cell) =>
      cell.count > 0 ? Math.round(cell.totalEng / cell.count) : 0,
    )),
    totalPostsAnalyzed: content.length,
  };
}

// Helpers
function _predictMilestones(currentFollowers, avgDailyGrowth) {
  if (avgDailyGrowth <= 0) return [];
  const milestones = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  return milestones
    .filter((m) => m > currentFollowers)
    .slice(0, 3)
    .map((milestone) => ({
      milestone,
      daysToReach: Math.ceil((milestone - currentFollowers) / avgDailyGrowth),
      estimatedDate: new Date(Date.now() + ((milestone - currentFollowers) / avgDailyGrowth) * 86400000),
    }));
}

function _findBestType(typePerformance) {
  let best = null;
  let bestScore = -1;
  for (const [type, perf] of Object.entries(typePerformance)) {
    const score = perf.avgViews + perf.avgLikes * 10 + perf.avgComments * 20;
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }
  return best;
}

function _analyzePostingTimes(byHour, byDay) {
  const hourScores = {};
  for (const [hour, metricsList] of Object.entries(byHour)) {
    const totalEng = metricsList.reduce((s, m) => s + m.likes + m.comments + m.shares, 0);
    hourScores[hour] = { avgEngagement: totalEng / metricsList.length, posts: metricsList.length };
  }

  const dayScores = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (const [day, metricsList] of Object.entries(byDay)) {
    const totalEng = metricsList.reduce((s, m) => s + m.likes + m.comments + m.shares, 0);
    dayScores[dayNames[day]] = { avgEngagement: totalEng / metricsList.length, posts: metricsList.length };
  }

  return { byHour: hourScores, byDay: dayScores };
}

module.exports = {
  predictFollowerGrowth,
  predictContentPerformance,
  predictOptimalPostingTimes,
};

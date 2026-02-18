const { calculateEngagementRate } = require('../utils/helpers');
const { PLATFORMS } = require('../config/constants');

/**
 * Data normalization layer — transforms platform-specific data into a unified schema.
 */

function normalizeAccountInfo(platform, rawData) {
  const base = {
    platform,
    platformUserId: rawData.platformUserId,
    username: rawData.username,
    displayName: rawData.displayName,
    profileImageUrl: rawData.profileImageUrl,
    profileUrl: rawData.profileUrl,
    bio: rawData.bio || '',
    metrics: {
      followers: rawData.metrics?.followers || 0,
      following: rawData.metrics?.following || 0,
      totalPosts: rawData.metrics?.totalPosts || 0,
      totalViews: rawData.metrics?.totalViews || 0,
      totalLikes: rawData.metrics?.totalLikes || 0,
      engagementRate: 0,
      avgViewsPerPost: 0,
      avgLikesPerPost: 0,
    },
    platformData: rawData.platformData || {},
  };

  const m = base.metrics;
  if (m.totalPosts > 0) {
    m.avgViewsPerPost = Math.round(m.totalViews / m.totalPosts);
    m.avgLikesPerPost = Math.round(m.totalLikes / m.totalPosts);
  }

  return base;
}

function normalizeAnalytics(platform, rawEntries) {
  return rawEntries.map((entry) => ({
    platform,
    date: entry.date,
    granularity: 'daily',
    followers: {
      total: entry.followers?.total || 0,
      gained: entry.followers?.gained || 0,
      lost: entry.followers?.lost || 0,
      net: entry.followers?.net || (entry.followers?.gained || 0) - (entry.followers?.lost || 0),
    },
    engagement: {
      likes: entry.engagement?.likes || 0,
      comments: entry.engagement?.comments || 0,
      shares: entry.engagement?.shares || 0,
      saves: entry.engagement?.saves || 0,
      clicks: entry.engagement?.clicks || 0,
      rate: entry.engagement?.rate || 0,
    },
    reach: {
      impressions: entry.reach?.impressions || 0,
      reach: entry.reach?.reach || 0,
      views: entry.reach?.views || 0,
      uniqueViewers: entry.reach?.uniqueViewers || 0,
      watchTime: entry.reach?.watchTime || 0,
    },
    content: {
      postsPublished: entry.content?.postsPublished || 0,
      topPostId: entry.content?.topPostId || null,
      avgEngagementPerPost: entry.content?.avgEngagementPerPost || 0,
    },
    rawMetrics: entry.rawMetrics || {},
  }));
}

function normalizeContent(platform, rawPosts) {
  return rawPosts.map((post) => ({
    platform,
    platformContentId: post.platformContentId,
    type: post.type,
    title: post.title || '',
    description: post.description || '',
    thumbnailUrl: post.thumbnailUrl || '',
    contentUrl: post.contentUrl || '',
    publishedAt: post.publishedAt,
    metrics: {
      views: post.metrics?.views || 0,
      likes: post.metrics?.likes || 0,
      dislikes: post.metrics?.dislikes || 0,
      comments: post.metrics?.comments || 0,
      shares: post.metrics?.shares || 0,
      saves: post.metrics?.saves || 0,
      impressions: post.metrics?.impressions || 0,
      reach: post.metrics?.reach || 0,
      clicks: post.metrics?.clicks || 0,
      watchTime: post.metrics?.watchTime || 0,
      avgWatchDuration: post.metrics?.avgWatchDuration || 0,
      engagementRate: post.metrics?.engagementRate || 0,
    },
    hashtags: post.hashtags || [],
    mentions: post.mentions || [],
    platformData: post.platformData || {},
  }));
}

function normalizeDemographics(platform, rawData) {
  const normalized = {
    platform,
    date: new Date(),
    ageGroups: [],
    genderDistribution: [],
    topCountries: [],
    topCities: [],
    languages: [],
    activeHours: [],
    interests: [],
    deviceTypes: [],
  };

  switch (platform) {
    case PLATFORMS.YOUTUBE:
      normalized.ageGroups = _parseYouTubeAgeGender(rawData.ageGender, 'age');
      normalized.genderDistribution = _parseYouTubeAgeGender(rawData.ageGender, 'gender');
      normalized.topCountries = rawData.countries?.map((c) => ({
        code: c.code,
        name: c.code,
        count: c.views,
      })) || [];
      break;

    case PLATFORMS.INSTAGRAM:
      if (rawData.ageGender) {
        normalized.ageGroups = _parseInstagramAgeGender(rawData.ageGender, 'age');
        normalized.genderDistribution = _parseInstagramAgeGender(rawData.ageGender, 'gender');
      }
      if (rawData.countries) {
        normalized.topCountries = Object.entries(rawData.countries).map(([code, count]) => ({
          code, name: code, count, percentage: 0,
        }));
      }
      if (rawData.cities) {
        normalized.topCities = Object.entries(rawData.cities).map(([name, count]) => ({
          name, count, percentage: 0,
        }));
      }
      break;

    default:
      break;
  }

  return normalized;
}

function normalizeRevenue(platform, rawEntries) {
  return rawEntries.map((entry) => ({
    platform,
    date: entry.date,
    adRevenue: entry.adRevenue || 0,
    sponsorships: entry.sponsorships || 0,
    tips: entry.tips || 0,
    memberships: entry.memberships || 0,
    merchandise: entry.merchandise || 0,
    affiliates: entry.affiliates || 0,
    other: entry.other || 0,
    totalRevenue: entry.totalRevenue || 0,
    currency: 'USD',
  }));
}

// Helpers
function _parseYouTubeAgeGender(rows, mode) {
  if (!rows || rows.length === 0) return [];
  if (mode === 'age') {
    const ageMap = {};
    for (const row of rows) {
      const age = row[0];
      const pct = row[2];
      ageMap[age] = (ageMap[age] || 0) + pct;
    }
    return Object.entries(ageMap).map(([range, percentage]) => ({ range, percentage }));
  }
  const genderMap = {};
  for (const row of rows) {
    const gender = row[1];
    const pct = row[2];
    genderMap[gender] = (genderMap[gender] || 0) + pct;
  }
  return Object.entries(genderMap).map(([gender, percentage]) => ({ gender, percentage }));
}

function _parseInstagramAgeGender(ageGenderObj, mode) {
  // Instagram returns keys like "M.25-34", "F.18-24"
  if (mode === 'gender') {
    const genderMap = {};
    for (const [key, value] of Object.entries(ageGenderObj)) {
      const gender = key.split('.')[0] === 'M' ? 'male' : key.split('.')[0] === 'F' ? 'female' : 'other';
      genderMap[gender] = (genderMap[gender] || 0) + value;
    }
    const total = Object.values(genderMap).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(genderMap).map(([gender, count]) => ({
      gender,
      count,
      percentage: (count / total) * 100,
    }));
  }
  const ageMap = {};
  for (const [key, value] of Object.entries(ageGenderObj)) {
    const range = key.split('.')[1];
    ageMap[range] = (ageMap[range] || 0) + value;
  }
  const total = Object.values(ageMap).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(ageMap).map(([range, count]) => ({
    range,
    count,
    percentage: (count / total) * 100,
  }));
}

module.exports = {
  normalizeAccountInfo,
  normalizeAnalytics,
  normalizeContent,
  normalizeDemographics,
  normalizeRevenue,
};

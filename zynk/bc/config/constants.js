module.exports = {
  PLATFORMS: {
    YOUTUBE: 'youtube',
    INSTAGRAM: 'instagram',
    TIKTOK: 'tiktok',
    TWITTER: 'twitter',
  },

  METRIC_TYPES: {
    FOLLOWERS: 'followers',
    VIEWS: 'views',
    LIKES: 'likes',
    COMMENTS: 'comments',
    SHARES: 'shares',
    ENGAGEMENT_RATE: 'engagement_rate',
    IMPRESSIONS: 'impressions',
    REACH: 'reach',
    WATCH_TIME: 'watch_time',
    CLICKS: 'clicks',
  },

  CONTENT_TYPES: {
    VIDEO: 'video',
    IMAGE: 'image',
    CAROUSEL: 'carousel',
    STORY: 'story',
    REEL: 'reel',
    SHORT: 'short',
    TWEET: 'tweet',
    THREAD: 'thread',
    LIVE: 'live',
  },

  CACHE_TTL: {
    ANALYTICS_OVERVIEW: 300,    // 5 minutes
    PLATFORM_METRICS: 600,      // 10 minutes
    AUDIENCE_DATA: 3600,        // 1 hour
    CONTENT_LIST: 900,          // 15 minutes
    PREDICTIONS: 7200,          // 2 hours
    COMPETITOR: 1800,           // 30 minutes
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  DATE_RANGES: {
    LAST_7_DAYS: '7d',
    LAST_30_DAYS: '30d',
    LAST_90_DAYS: '90d',
    LAST_YEAR: '1y',
    CUSTOM: 'custom',
  },
};

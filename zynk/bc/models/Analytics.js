const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  platform: {
    type: String,
    enum: ['youtube', 'instagram', 'tiktok', 'twitter'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  granularity: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily',
  },

  followers: {
    total: { type: Number, default: 0 },
    gained: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
  },

  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
  },

  reach: {
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    uniqueViewers: { type: Number, default: 0 },
    watchTime: { type: Number, default: 0 }, // minutes
  },

  content: {
    postsPublished: { type: Number, default: 0 },
    topPostId: String,
    avgEngagementPerPost: { type: Number, default: 0 },
  },

  // Platform-specific raw metrics
  rawMetrics: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

analyticsSchema.index({ userId: 1, platform: 1, date: -1 });
analyticsSchema.index({ userId: 1, date: -1 });
analyticsSchema.index({ userId: 1, platform: 1, granularity: 1, date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);

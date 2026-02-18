const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
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
  platformContentId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['video', 'image', 'carousel', 'story', 'reel', 'short', 'tweet', 'thread', 'live'],
    required: true,
  },

  title: String,
  description: String,
  thumbnailUrl: String,
  contentUrl: String,
  publishedAt: Date,

  metrics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    watchTime: { type: Number, default: 0 },
    avgWatchDuration: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
  },

  hashtags: [String],
  mentions: [String],
  topics: [String],

  // Performance scoring (calculated)
  performanceScore: { type: Number, default: 0 },
  viralityScore: { type: Number, default: 0 },

  // Metric history snapshots
  metricsHistory: [{
    date: Date,
    views: Number,
    likes: Number,
    comments: Number,
    shares: Number,
  }],

  platformData: mongoose.Schema.Types.Mixed,
  lastFetchedAt: Date,
}, {
  timestamps: true,
});

contentSchema.index({ userId: 1, platform: 1, publishedAt: -1 });
contentSchema.index({ userId: 1, performanceScore: -1 });
contentSchema.index({ platform: 1, platformContentId: 1 }, { unique: true });
contentSchema.index({ hashtags: 1 });

module.exports = mongoose.model('Content', contentSchema);

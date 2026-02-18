const mongoose = require('mongoose');

const competitorSchema = new mongoose.Schema({
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
  competitorUsername: {
    type: String,
    required: true,
  },
  competitorPlatformId: String,
  displayName: String,
  profileImageUrl: String,
  profileUrl: String,

  currentMetrics: {
    followers: { type: Number, default: 0 },
    totalPosts: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    avgLikesPerPost: { type: Number, default: 0 },
    avgCommentsPerPost: { type: Number, default: 0 },
    avgViewsPerPost: { type: Number, default: 0 },
    postingFrequency: { type: Number, default: 0 }, // posts per week
  },

  metricsHistory: [{
    date: Date,
    followers: Number,
    engagementRate: Number,
    postsCount: Number,
  }],

  recentContent: [{
    platformContentId: String,
    title: String,
    publishedAt: Date,
    views: Number,
    likes: Number,
    comments: Number,
    engagementRate: Number,
  }],

  topHashtags: [String],
  topTopics: [String],
  postingSchedule: mongoose.Schema.Types.Mixed, // heatmap of posting times

  lastFetchedAt: Date,
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

competitorSchema.index({ userId: 1, platform: 1 });
competitorSchema.index({ userId: 1, platform: 1, competitorUsername: 1 }, { unique: true });

module.exports = mongoose.model('Competitor', competitorSchema);

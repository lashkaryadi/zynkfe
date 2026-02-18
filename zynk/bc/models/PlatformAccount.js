const mongoose = require('mongoose');

const platformAccountSchema = new mongoose.Schema({
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
  platformUserId: {
    type: String,
    required: true,
  },
  username: String,
  displayName: String,
  profileImageUrl: String,
  profileUrl: String,
  bio: String,

  // Current snapshot metrics
  metrics: {
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    totalPosts: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    avgViewsPerPost: { type: Number, default: 0 },
    avgLikesPerPost: { type: Number, default: 0 },
  },

  // Platform-specific extra data
  platformData: mongoose.Schema.Types.Mixed,

  lastFetchedAt: Date,
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

platformAccountSchema.index({ userId: 1, platform: 1 }, { unique: true });
platformAccountSchema.index({ platform: 1, platformUserId: 1 }, { unique: true });

module.exports = mongoose.model('PlatformAccount', platformAccountSchema);

const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
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
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },

  adRevenue: { type: Number, default: 0 },
  sponsorships: { type: Number, default: 0 },
  tips: { type: Number, default: 0 },
  memberships: { type: Number, default: 0 },
  merchandise: { type: Number, default: 0 },
  affiliates: { type: Number, default: 0 },
  other: { type: Number, default: 0 },

  totalRevenue: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },

  // Revenue per metric
  revenuePerView: { type: Number, default: 0 },
  revenuePerFollower: { type: Number, default: 0 },
  rpm: { type: Number, default: 0 }, // Revenue per mille (1000 views)
  cpm: { type: Number, default: 0 }, // Cost per mille

  platformData: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

revenueSchema.pre('save', function (next) {
  this.totalRevenue = this.adRevenue + this.sponsorships + this.tips
    + this.memberships + this.merchandise + this.affiliates + this.other;
  next();
});

revenueSchema.index({ userId: 1, platform: 1, date: -1 });
revenueSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Revenue', revenueSchema);

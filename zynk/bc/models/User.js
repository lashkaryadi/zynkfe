const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 8,
    select: false,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: String,
  googleId: String,
  connectedPlatforms: [{
    platform: {
      type: String,
      enum: ['youtube', 'instagram', 'tiktok', 'twitter'],
    },
    accountId: String,
    accessToken: { type: String, select: false },
    refreshToken: { type: String, select: false },
    tokenExpiry: Date,
    username: String,
    profileUrl: String,
    connectedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  }],
  preferences: {
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    notifications: {
      email: { type: Boolean, default: true },
      milestones: { type: Boolean, default: true },
      alerts: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
    },
    dashboardLayout: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  alerts: [{
    metric: String,
    platform: String,
    condition: { type: String, enum: ['above', 'below', 'change_percent'] },
    threshold: Number,
    isActive: { type: Boolean, default: true },
  }],
  subscription: {
    plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
    expiresAt: Date,
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getActivePlatforms = function () {
  return this.connectedPlatforms.filter((p) => p.isActive).map((p) => p.platform);
};

module.exports = mongoose.model('User', userSchema);

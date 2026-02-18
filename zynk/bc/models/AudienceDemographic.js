const mongoose = require('mongoose');

const audienceDemographicSchema = new mongoose.Schema({
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

  ageGroups: [{
    range: String, // e.g., '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
    percentage: Number,
    count: Number,
  }],

  genderDistribution: [{
    gender: String, // 'male', 'female', 'other'
    percentage: Number,
    count: Number,
  }],

  topCountries: [{
    code: String,
    name: String,
    percentage: Number,
    count: Number,
  }],

  topCities: [{
    name: String,
    country: String,
    percentage: Number,
    count: Number,
  }],

  languages: [{
    code: String,
    name: String,
    percentage: Number,
  }],

  activeHours: [{
    hour: Number, // 0-23
    dayOfWeek: Number, // 0-6 (Sun-Sat)
    activityLevel: Number, // 0-100
  }],

  interests: [{
    category: String,
    percentage: Number,
  }],

  deviceTypes: [{
    type: String, // 'mobile', 'desktop', 'tablet', 'tv'
    percentage: Number,
  }],

  platformData: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

audienceDemographicSchema.index({ userId: 1, platform: 1, date: -1 });

module.exports = mongoose.model('AudienceDemographic', audienceDemographicSchema);

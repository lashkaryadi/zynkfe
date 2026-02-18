const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { getPlatformService, getAuthUrl, exchangeCode } = require('../services/platforms/platformFactory');
const normalization = require('../services/normalization');
const PlatformAccount = require('../models/PlatformAccount');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = await User.create({ email, password, name });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    const platforms = await PlatformAccount.find({ userId: req.user._id, isActive: true });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        preferences: user.preferences,
        subscription: user.subscription,
      },
      connectedPlatforms: platforms.map((p) => ({
        platform: p.platform,
        username: p.username,
        displayName: p.displayName,
        profileImageUrl: p.profileImageUrl,
        followers: p.metrics.followers,
        connectedAt: p.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, preferences } = req.body;
    const update = {};
    if (name) update.name = name;
    if (preferences) update.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json({ user: { id: user._id, email: user.email, name: user.name, preferences: user.preferences } });
  } catch (err) {
    next(err);
  }
}

// OAuth: Initiate platform connection
async function connectPlatform(req, res, next) {
  try {
    const { platform } = req.params;
    const state = Buffer.from(JSON.stringify({
      userId: req.user._id,
      nonce: uuidv4(),
    })).toString('base64');

    const authUrl = getAuthUrl(platform, state);

    // Twitter returns { url, codeVerifier }
    if (typeof authUrl === 'object') {
      // Store code verifier in session or cache for later use
      const cacheService = require('../services/cacheService');
      await cacheService.set(`twitter_verifier:${req.user._id}`, authUrl.codeVerifier, 600);
      return res.json({ authUrl: authUrl.url });
    }

    res.json({ authUrl });
  } catch (err) {
    next(err);
  }
}

// OAuth: Callback after platform authorization
async function platformCallback(req, res, next) {
  try {
    const { platform } = req.params;
    const { code, state } = req.query;

    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const userId = stateData.userId;

    let extra;
    if (platform === 'twitter') {
      const cacheService = require('../services/cacheService');
      extra = await cacheService.get(`twitter_verifier:${userId}`);
      await cacheService.del(`twitter_verifier:${userId}`);
    }

    const tokens = await exchangeCode(platform, code, extra);
    const service = getPlatformService(platform);

    // Fetch account info
    let rawInfo;
    switch (platform) {
      case 'youtube':
        rawInfo = await service.getChannelInfo(tokens.access_token, tokens.refresh_token);
        break;
      case 'instagram':
        rawInfo = await service.getAccountInfo(tokens.access_token);
        break;
      case 'tiktok':
        rawInfo = await service.getUserInfo(tokens.access_token);
        break;
      case 'twitter':
        rawInfo = await service.getUserInfo(tokens.access_token);
        break;
    }

    const normalized = normalization.normalizeAccountInfo(platform, rawInfo);

    // Save platform account
    await PlatformAccount.findOneAndUpdate(
      { userId, platform },
      { ...normalized, userId, lastFetchedAt: new Date() },
      { upsert: true, new: true },
    );

    // Update user's connected platforms
    await User.findByIdAndUpdate(userId, {
      $pull: { connectedPlatforms: { platform } },
    });
    await User.findByIdAndUpdate(userId, {
      $push: {
        connectedPlatforms: {
          platform,
          accountId: normalized.platformUserId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          username: normalized.username,
          profileUrl: normalized.profileUrl,
          isActive: true,
        },
      },
    });

    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/settings/platforms?connected=${platform}`);
  } catch (err) {
    logger.error(`OAuth callback error for ${req.params.platform}:`, err);
    res.redirect(`${process.env.FRONTEND_URL}/settings/platforms?error=${encodeURIComponent(err.message)}`);
  }
}

async function disconnectPlatform(req, res, next) {
  try {
    const { platform } = req.params;

    await PlatformAccount.findOneAndUpdate(
      { userId: req.user._id, platform },
      { isActive: false },
    );

    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'connectedPlatforms.$[elem].isActive': false },
    }, {
      arrayFilters: [{ 'elem.platform': platform }],
    });

    res.json({ message: `${platform} disconnected` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  connectPlatform,
  platformCallback,
  disconnectPlatform,
};

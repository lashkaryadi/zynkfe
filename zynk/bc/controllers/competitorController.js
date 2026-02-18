const Competitor = require('../models/Competitor');
const { getPlatformService } = require('../services/platforms/platformFactory');
const cacheService = require('../services/cacheService');
const { generateCacheKey } = require('../utils/helpers');
const { CACHE_TTL } = require('../config/constants');

async function listCompetitors(req, res, next) {
  try {
    const { platform } = req.query;
    const filter = { userId: req.user._id, isActive: true };
    if (platform) filter.platform = platform;

    const competitors = await Competitor.find(filter);
    res.json({ competitors });
  } catch (err) {
    next(err);
  }
}

async function addCompetitor(req, res, next) {
  try {
    const { platform, username } = req.body;

    const existing = await Competitor.findOne({
      userId: req.user._id,
      platform,
      competitorUsername: username,
    });
    if (existing) return res.status(409).json({ error: 'Competitor already tracked' });

    // Try to fetch public info
    let publicInfo = {};
    try {
      if (platform === 'twitter') {
        const twitterService = getPlatformService('twitter');
        const userData = await twitterService.getUserByUsername(username);
        publicInfo = {
          competitorPlatformId: userData.id,
          displayName: userData.name,
          profileImageUrl: userData.profile_image_url,
          profileUrl: `https://twitter.com/${userData.username}`,
          currentMetrics: {
            followers: userData.public_metrics.followers_count,
            totalPosts: userData.public_metrics.tweet_count,
          },
        };
      }
    } catch (err) {
      // Public fetch may fail — still add the competitor
    }

    const competitor = await Competitor.create({
      userId: req.user._id,
      platform,
      competitorUsername: username,
      ...publicInfo,
      lastFetchedAt: new Date(),
    });

    res.status(201).json(competitor);
  } catch (err) {
    next(err);
  }
}

async function removeCompetitor(req, res, next) {
  try {
    await Competitor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
    );
    res.json({ message: 'Competitor removed' });
  } catch (err) {
    next(err);
  }
}

async function compareWithCompetitors(req, res, next) {
  try {
    const { platform } = req.query;
    const cacheKey = generateCacheKey('competitors', req.user._id, { platform });

    const data = await cacheService.getOrSet(cacheKey, async () => {
      const filter = { userId: req.user._id, isActive: true };
      if (platform) filter.platform = platform;

      const competitors = await Competitor.find(filter);
      const PlatformAccount = require('../models/PlatformAccount');
      const myAccounts = await PlatformAccount.find({ userId: req.user._id, isActive: true });

      const comparison = {};
      for (const account of myAccounts) {
        if (platform && account.platform !== platform) continue;

        const platformCompetitors = competitors.filter((c) => c.platform === account.platform);
        comparison[account.platform] = {
          you: {
            username: account.username,
            followers: account.metrics.followers,
            engagementRate: account.metrics.engagementRate,
            avgViewsPerPost: account.metrics.avgViewsPerPost,
          },
          competitors: platformCompetitors.map((c) => ({
            username: c.competitorUsername,
            followers: c.currentMetrics.followers,
            engagementRate: c.currentMetrics.engagementRate,
            avgViewsPerPost: c.currentMetrics.avgViewsPerPost,
          })),
        };
      }

      return comparison;
    }, CACHE_TTL.COMPETITOR);

    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listCompetitors, addCompetitor, removeCompetitor, compareWithCompetitors };

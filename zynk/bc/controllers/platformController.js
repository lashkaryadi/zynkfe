const PlatformAccount = require('../models/PlatformAccount');
const { fetchUserAnalytics } = require('../jobs/fetchAnalytics');

async function listPlatforms(req, res, next) {
  try {
    const accounts = await PlatformAccount.find({ userId: req.user._id, isActive: true });
    res.json({
      platforms: accounts.map((a) => ({
        platform: a.platform,
        username: a.username,
        displayName: a.displayName,
        profileImageUrl: a.profileImageUrl,
        profileUrl: a.profileUrl,
        metrics: a.metrics,
        lastFetchedAt: a.lastFetchedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function getPlatformDetails(req, res, next) {
  try {
    const account = await PlatformAccount.findOne({
      userId: req.user._id,
      platform: req.params.platform,
      isActive: true,
    });

    if (!account) return res.status(404).json({ error: 'Platform not connected' });

    res.json({ account });
  } catch (err) {
    next(err);
  }
}

async function syncPlatform(req, res, next) {
  try {
    const user = await req.user.populate('connectedPlatforms');
    await fetchUserAnalytics(req.user);
    res.json({ message: 'Sync initiated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listPlatforms, getPlatformDetails, syncPlatform };

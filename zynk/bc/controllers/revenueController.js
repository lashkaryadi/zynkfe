const Revenue = require('../models/Revenue');
const { parseDateRange } = require('../utils/dateUtils');

async function getRevenueOverview(req, res, next) {
  try {
    const { range = '30d', startDate, endDate, platform } = req.query;
    const { start, end } = parseDateRange(range, startDate, endDate);

    const filter = { userId: req.user._id, date: { $gte: start, $lte: end } };
    if (platform) filter.platform = platform;

    const revenue = await Revenue.find(filter).sort({ date: 1 });

    // Totals by source
    const totals = revenue.reduce((acc, r) => ({
      adRevenue: acc.adRevenue + r.adRevenue,
      sponsorships: acc.sponsorships + r.sponsorships,
      tips: acc.tips + r.tips,
      memberships: acc.memberships + r.memberships,
      merchandise: acc.merchandise + r.merchandise,
      affiliates: acc.affiliates + r.affiliates,
      other: acc.other + r.other,
      total: acc.total + r.totalRevenue,
    }), { adRevenue: 0, sponsorships: 0, tips: 0, memberships: 0, merchandise: 0, affiliates: 0, other: 0, total: 0 });

    // By platform
    const byPlatform = {};
    for (const r of revenue) {
      if (!byPlatform[r.platform]) byPlatform[r.platform] = 0;
      byPlatform[r.platform] += r.totalRevenue;
    }

    // Daily trend
    const dailyTrend = revenue.map((r) => ({
      date: r.date,
      platform: r.platform,
      revenue: r.totalRevenue,
    }));

    res.json({ totals, byPlatform, dailyTrend, dateRange: { start, end } });
  } catch (err) {
    next(err);
  }
}

async function addManualRevenue(req, res, next) {
  try {
    const { platform, date, adRevenue, sponsorships, tips, memberships, merchandise, affiliates, other } = req.body;

    const entry = await Revenue.create({
      userId: req.user._id,
      platform,
      date: new Date(date),
      adRevenue: adRevenue || 0,
      sponsorships: sponsorships || 0,
      tips: tips || 0,
      memberships: memberships || 0,
      merchandise: merchandise || 0,
      affiliates: affiliates || 0,
      other: other || 0,
    });

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

module.exports = { getRevenueOverview, addManualRevenue };

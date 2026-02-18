const AudienceDemographic = require('../models/AudienceDemographic');
const cacheService = require('../services/cacheService');
const { generateCacheKey } = require('../utils/helpers');
const { CACHE_TTL } = require('../config/constants');

async function getAudienceOverview(req, res, next) {
  try {
    const { platform } = req.query;
    const cacheKey = generateCacheKey('audience', req.user._id, { platform });

    const data = await cacheService.getOrSet(cacheKey, async () => {
      const filter = { userId: req.user._id };
      if (platform) filter.platform = platform;

      const demographics = await AudienceDemographic.find(filter)
        .sort({ date: -1 })
        .limit(platform ? 1 : 10);

      if (demographics.length === 0) {
        return { demographics: [], message: 'No audience data available yet' };
      }

      // If no platform filter, aggregate across platforms
      if (!platform) {
        return { demographics, aggregated: _aggregateDemographics(demographics) };
      }

      return { demographics: demographics[0] };
    }, CACHE_TTL.AUDIENCE_DATA);

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getGeographicData(req, res, next) {
  try {
    const { platform } = req.query;
    const filter = { userId: req.user._id };
    if (platform) filter.platform = platform;

    const demographics = await AudienceDemographic.find(filter)
      .sort({ date: -1 })
      .limit(10);

    // Merge country data across platforms
    const countryMap = {};
    for (const demo of demographics) {
      for (const country of demo.topCountries) {
        if (!countryMap[country.code]) {
          countryMap[country.code] = { code: country.code, name: country.name, count: 0 };
        }
        countryMap[country.code].count += country.count || 0;
      }
    }

    const countries = Object.values(countryMap).sort((a, b) => b.count - a.count);
    const total = countries.reduce((s, c) => s + c.count, 0);
    for (const c of countries) {
      c.percentage = total > 0 ? ((c.count / total) * 100).toFixed(1) : 0;
    }

    res.json({ countries, totalDataPoints: total });
  } catch (err) {
    next(err);
  }
}

async function getActiveHours(req, res, next) {
  try {
    const { platform } = req.query;
    const filter = { userId: req.user._id };
    if (platform) filter.platform = platform;

    const demographics = await AudienceDemographic.findOne(filter).sort({ date: -1 });

    res.json({ activeHours: demographics?.activeHours || [] });
  } catch (err) {
    next(err);
  }
}

function _aggregateDemographics(demographics) {
  const ageMap = {};
  const genderMap = {};

  for (const demo of demographics) {
    for (const ag of demo.ageGroups) {
      ageMap[ag.range] = (ageMap[ag.range] || 0) + (ag.count || ag.percentage || 0);
    }
    for (const gd of demo.genderDistribution) {
      genderMap[gd.gender] = (genderMap[gd.gender] || 0) + (gd.count || gd.percentage || 0);
    }
  }

  return {
    ageGroups: Object.entries(ageMap).map(([range, count]) => ({ range, count })),
    genderDistribution: Object.entries(genderMap).map(([gender, count]) => ({ gender, count })),
  };
}

module.exports = { getAudienceOverview, getGeographicData, getActiveHours };

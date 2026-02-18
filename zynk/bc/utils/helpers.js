const { PAGINATION } = require('../config/constants');

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT),
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

function calculateEngagementRate(likes, comments, shares, followers) {
  if (!followers || followers === 0) return 0;
  return ((likes + comments + shares) / followers) * 100;
}

function calculateGrowthRate(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function normalizeMetric(value, min, max) {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

function generateCacheKey(prefix, userId, params = {}) {
  const paramStr = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return `${prefix}:${userId}${paramStr ? ':' + paramStr : ''}`;
}

module.exports = {
  parsePagination,
  paginatedResponse,
  calculateEngagementRate,
  calculateGrowthRate,
  normalizeMetric,
  generateCacheKey,
};

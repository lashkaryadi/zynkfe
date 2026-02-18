const Content = require('../models/Content');
const { parsePagination, paginatedResponse } = require('../utils/helpers');

async function listContent(req, res, next) {
  try {
    const { platform, type, sortBy = 'publishedAt' } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = { userId: req.user._id };
    if (platform) filter.platform = platform;
    if (type) filter.type = type;

    const sortOptions = { [sortBy]: -1 };

    const [content, total] = await Promise.all([
      Content.find(filter).sort(sortOptions).skip(skip).limit(limit),
      Content.countDocuments(filter),
    ]);

    res.json(paginatedResponse(content, total, page, limit));
  } catch (err) {
    next(err);
  }
}

async function getContentById(req, res, next) {
  try {
    const content = await Content.findOne({ _id: req.params.id, userId: req.user._id });
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json(content);
  } catch (err) {
    next(err);
  }
}

async function getTopContent(req, res, next) {
  try {
    const { platform, limit = 10 } = req.query;
    const filter = { userId: req.user._id };
    if (platform) filter.platform = platform;

    const content = await Content.find(filter)
      .sort({ performanceScore: -1 })
      .limit(parseInt(limit, 10));

    res.json({ topContent: content });
  } catch (err) {
    next(err);
  }
}

module.exports = { listContent, getContentById, getTopContent };

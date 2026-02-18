const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { webhookLimiter } = require('../middleware/rateLimiter');
const Content = require('../models/Content');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const logger = require('../utils/logger');

router.use(webhookLimiter);

// YouTube PubSubHubbub webhook
router.get('/youtube', (req, res) => {
  // Hub verification
  const challenge = req.query['hub.challenge'];
  if (challenge) return res.status(200).send(challenge);
  res.sendStatus(200);
});

router.post('/youtube', express.raw({ type: 'application/atom+xml' }), async (req, res) => {
  try {
    // Verify signature
    const signature = req.headers['x-hub-signature'];
    if (signature && process.env.YOUTUBE_WEBHOOK_SECRET) {
      const hmac = crypto.createHmac('sha1', process.env.YOUTUBE_WEBHOOK_SECRET);
      hmac.update(req.body);
      const expected = `sha1=${hmac.digest('hex')}`;
      if (signature !== expected) {
        logger.warn('YouTube webhook signature mismatch');
        return res.sendStatus(403);
      }
    }

    logger.info('YouTube webhook received');
    // Parse XML feed and process updates — in production, use an XML parser
    res.sendStatus(200);
  } catch (err) {
    logger.error('YouTube webhook error:', err);
    res.sendStatus(500);
  }
});

// Instagram webhook
router.get('/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

router.post('/instagram', async (req, res) => {
  try {
    const { entry } = req.body;
    if (!entry) return res.sendStatus(200);

    for (const item of entry) {
      const igUserId = item.id;
      if (item.changes) {
        for (const change of item.changes) {
          logger.info(`Instagram webhook: ${change.field} changed for ${igUserId}`);
          // Process media updates, story insights, etc.
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    logger.error('Instagram webhook error:', err);
    res.sendStatus(500);
  }
});

// TikTok webhook
router.post('/tiktok', async (req, res) => {
  try {
    const signature = req.headers['x-tiktok-signature'];
    if (signature && process.env.TIKTOK_WEBHOOK_SECRET) {
      const hmac = crypto.createHmac('sha256', process.env.TIKTOK_WEBHOOK_SECRET);
      hmac.update(JSON.stringify(req.body));
      const expected = hmac.digest('hex');
      if (signature !== expected) {
        logger.warn('TikTok webhook signature mismatch');
        return res.sendStatus(403);
      }
    }

    const { event, data } = req.body;
    logger.info(`TikTok webhook: event=${event}`);

    res.sendStatus(200);
  } catch (err) {
    logger.error('TikTok webhook error:', err);
    res.sendStatus(500);
  }
});

module.exports = router;

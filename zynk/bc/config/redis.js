const Redis = require('ioredis');
const logger = require('../utils/logger');

let client;
let redisAvailable = false;

function getRedisClient() {
  if (!client) {
    client = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis unavailable — running without cache');
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
    client.on('error', () => {
      if (redisAvailable) {
        logger.warn('Redis connection lost — cache disabled');
        redisAvailable = false;
      }
    });
    client.on('connect', () => {
      redisAvailable = true;
      logger.info('Redis connected');
    });
  }
  return client;
}

function isRedisAvailable() {
  return redisAvailable;
}

async function connectRedis() {
  try {
    const redis = getRedisClient();
    await redis.connect();
    await redis.ping();
    redisAvailable = true;
    logger.info('Redis connected and ready');
  } catch (err) {
    redisAvailable = false;
    logger.warn('Redis not available — app will run without caching');
  }
}

module.exports = { connectRedis, getRedisClient, isRedisAvailable };

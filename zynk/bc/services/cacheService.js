const { getRedisClient, isRedisAvailable } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Cache service — wraps Redis with graceful fallback when Redis is unavailable.
 * All operations silently skip if Redis is not connected.
 */

async function get(key) {
  if (!isRedisAvailable()) return null;
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error('Cache get error:', err.message);
    return null;
  }
}

async function set(key, value, ttlSeconds = 300) {
  if (!isRedisAvailable()) return;
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.error('Cache set error:', err.message);
  }
}

async function del(key) {
  if (!isRedisAvailable()) return;
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (err) {
    logger.error('Cache del error:', err.message);
  }
}

async function invalidatePattern(pattern) {
  if (!isRedisAvailable()) return;
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (err) {
    logger.error('Cache invalidate error:', err.message);
  }
}

async function getOrSet(key, fetchFn, ttlSeconds = 300) {
  const cached = await get(key);
  if (cached) return cached;

  const data = await fetchFn();
  await set(key, data, ttlSeconds);
  return data;
}

module.exports = { get, set, del, invalidatePattern, getOrSet };

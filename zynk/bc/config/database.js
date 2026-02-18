const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    throw err;
  }
}

module.exports = { connectDB };

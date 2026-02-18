const youtubeService = require('./youtube');
const instagramService = require('./instagram');
const tiktokService = require('./tiktok');
const twitterService = require('./twitter');

const services = {
  youtube: youtubeService,
  instagram: instagramService,
  tiktok: tiktokService,
  twitter: twitterService,
};

function getPlatformService(platform) {
  const service = services[platform];
  if (!service) throw new Error(`Unsupported platform: ${platform}`);
  return service;
}

function getAuthUrl(platform, state) {
  return getPlatformService(platform).getAuthUrl(state);
}

async function exchangeCode(platform, code, extra) {
  return getPlatformService(platform).exchangeCode(code, extra);
}

async function refreshToken(platform, refreshTokenValue) {
  return getPlatformService(platform).refreshAccessToken(refreshTokenValue);
}

function getAllPlatforms() {
  return Object.keys(services);
}

module.exports = {
  getPlatformService,
  getAuthUrl,
  exchangeCode,
  refreshToken,
  getAllPlatforms,
};

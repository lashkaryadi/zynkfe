const axios = require('axios');
const crypto = require('crypto');
const oauthConfig = require('../../config/oauth');
const logger = require('../../utils/logger');

const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const TWITTER_API_BASE = 'https://api.twitter.com/2';

function getAuthUrl(state) {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: oauthConfig.twitter.clientId,
    redirect_uri: oauthConfig.twitter.redirectUri,
    scope: oauthConfig.twitter.scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return {
    url: `${TWITTER_AUTH_URL}?${params}`,
    codeVerifier,
  };
}

async function exchangeCode(code, codeVerifier) {
  const credentials = Buffer.from(
    `${oauthConfig.twitter.clientId}:${oauthConfig.twitter.clientSecret}`,
  ).toString('base64');

  const res = await axios.post(`${TWITTER_API_BASE}/oauth2/token`, new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    redirect_uri: oauthConfig.twitter.redirectUri,
    code_verifier: codeVerifier,
  }), {
    headers: { Authorization: `Basic ${credentials}` },
  });

  return {
    access_token: res.data.access_token,
    refresh_token: res.data.refresh_token,
    expires_in: res.data.expires_in,
  };
}

async function refreshAccessToken(refreshToken) {
  const credentials = Buffer.from(
    `${oauthConfig.twitter.clientId}:${oauthConfig.twitter.clientSecret}`,
  ).toString('base64');

  const res = await axios.post(`${TWITTER_API_BASE}/oauth2/token`, new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }), {
    headers: { Authorization: `Basic ${credentials}` },
  });

  return res.data;
}

async function getUserInfo(accessToken) {
  const res = await axios.get(`${TWITTER_API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      'user.fields': 'id,name,username,profile_image_url,description,public_metrics,verified,created_at',
    },
  });

  const user = res.data.data;
  return {
    platformUserId: user.id,
    username: user.username,
    displayName: user.name,
    profileImageUrl: user.profile_image_url,
    profileUrl: `https://twitter.com/${user.username}`,
    bio: user.description,
    metrics: {
      followers: user.public_metrics.followers_count || 0,
      following: user.public_metrics.following_count || 0,
      totalPosts: user.public_metrics.tweet_count || 0,
      totalLikes: user.public_metrics.like_count || 0,
    },
    platformData: {
      verified: user.verified,
      createdAt: user.created_at,
    },
  };
}

async function getTweets(accessToken, userId, maxResults = 50) {
  const res = await axios.get(`${TWITTER_API_BASE}/users/${userId}/tweets`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      max_results: Math.min(maxResults, 100),
      'tweet.fields': 'id,text,created_at,public_metrics,entities,attachments',
      'media.fields': 'type,url,preview_image_url',
      expansions: 'attachments.media_keys',
    },
  });

  return (res.data.data || []).map((tweet) => ({
    platformContentId: tweet.id,
    type: _getTweetType(tweet),
    title: tweet.text.substring(0, 100),
    description: tweet.text,
    contentUrl: `https://twitter.com/i/status/${tweet.id}`,
    publishedAt: new Date(tweet.created_at),
    metrics: {
      likes: tweet.public_metrics.like_count || 0,
      comments: tweet.public_metrics.reply_count || 0,
      shares: tweet.public_metrics.retweet_count + (tweet.public_metrics.quote_count || 0),
      impressions: tweet.public_metrics.impression_count || 0,
      clicks: tweet.public_metrics.url_link_clicks || 0,
    },
    hashtags: (tweet.entities?.hashtags || []).map((h) => h.tag),
    mentions: (tweet.entities?.mentions || []).map((m) => m.username),
  }));
}

async function getAnalytics(accessToken, userId, startDate, endDate) {
  // Collect tweets in range and aggregate metrics
  const tweets = await getTweets(accessToken, userId, 100);
  const start = new Date(startDate);
  const end = new Date(endDate);

  const tweetsInRange = tweets.filter((t) => {
    const d = new Date(t.publishedAt);
    return d >= start && d <= end;
  });

  return {
    totalTweets: tweetsInRange.length,
    totalImpressions: tweetsInRange.reduce((sum, t) => sum + t.metrics.impressions, 0),
    totalLikes: tweetsInRange.reduce((sum, t) => sum + t.metrics.likes, 0),
    totalReplies: tweetsInRange.reduce((sum, t) => sum + t.metrics.comments, 0),
    totalRetweets: tweetsInRange.reduce((sum, t) => sum + t.metrics.shares, 0),
    tweets: tweetsInRange,
  };
}

async function getUserByUsername(username) {
  const res = await axios.get(`${TWITTER_API_BASE}/users/by/username/${username}`, {
    headers: { Authorization: `Bearer ${oauthConfig.twitter.bearerToken}` },
    params: {
      'user.fields': 'id,name,username,profile_image_url,description,public_metrics',
    },
  });
  return res.data.data;
}

function _getTweetType(tweet) {
  if (tweet.referenced_tweets?.some((r) => r.type === 'replied_to')) return 'thread';
  return 'tweet';
}

module.exports = {
  getAuthUrl,
  exchangeCode,
  refreshAccessToken,
  getUserInfo,
  getTweets,
  getAnalytics,
  getUserByUsername,
};

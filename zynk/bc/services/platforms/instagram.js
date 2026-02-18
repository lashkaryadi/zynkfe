const axios = require('axios');
const oauthConfig = require('../../config/oauth');
const logger = require('../../utils/logger');

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';
const INSTAGRAM_AUTH_URL = 'https://api.instagram.com/oauth/authorize';

function getAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: oauthConfig.instagram.clientId,
    redirect_uri: oauthConfig.instagram.redirectUri,
    scope: oauthConfig.instagram.scopes.join(','),
    response_type: 'code',
    state,
  });
  return `${INSTAGRAM_AUTH_URL}?${params}`;
}

async function exchangeCode(code) {
  // Short-lived token
  const tokenRes = await axios.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
    client_id: oauthConfig.instagram.clientId,
    client_secret: oauthConfig.instagram.clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: oauthConfig.instagram.redirectUri,
    code,
  }));

  // Exchange for long-lived token
  const longLivedRes = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: oauthConfig.instagram.clientId,
      client_secret: oauthConfig.instagram.clientSecret,
      fb_exchange_token: tokenRes.data.access_token,
    },
  });

  return {
    access_token: longLivedRes.data.access_token,
    expires_in: longLivedRes.data.expires_in,
    user_id: tokenRes.data.user_id,
  };
}

async function refreshAccessToken(accessToken) {
  const res = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: oauthConfig.instagram.clientId,
      client_secret: oauthConfig.instagram.clientSecret,
      fb_exchange_token: accessToken,
    },
  });
  return res.data;
}

async function getAccountInfo(accessToken) {
  // Get Instagram Business Account through Facebook Pages
  const pagesRes = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
    params: { access_token: accessToken, fields: 'instagram_business_account' },
  });

  const page = pagesRes.data.data.find((p) => p.instagram_business_account);
  if (!page) throw new Error('No Instagram business account found');

  const igAccountId = page.instagram_business_account.id;

  const accountRes = await axios.get(`${GRAPH_API_BASE}/${igAccountId}`, {
    params: {
      access_token: accessToken,
      fields: 'username,name,profile_picture_url,biography,followers_count,follows_count,media_count',
    },
  });

  const data = accountRes.data;
  return {
    platformUserId: igAccountId,
    username: data.username,
    displayName: data.name,
    profileImageUrl: data.profile_picture_url,
    profileUrl: `https://instagram.com/${data.username}`,
    bio: data.biography,
    metrics: {
      followers: data.followers_count || 0,
      following: data.follows_count || 0,
      totalPosts: data.media_count || 0,
    },
  };
}

async function getAnalytics(accessToken, igAccountId, startDate, endDate) {
  const since = Math.floor(new Date(startDate).getTime() / 1000);
  const until = Math.floor(new Date(endDate).getTime() / 1000);

  const metrics = 'impressions,reach,follower_count';

  const res = await axios.get(`${GRAPH_API_BASE}/${igAccountId}/insights`, {
    params: {
      access_token: accessToken,
      metric: metrics,
      period: 'day',
      since,
      until,
    },
  });

  const metricsMap = {};
  for (const metric of res.data.data) {
    for (const value of metric.values) {
      const dateKey = value.end_time.split('T')[0];
      if (!metricsMap[dateKey]) metricsMap[dateKey] = {};
      metricsMap[dateKey][metric.name] = value.value;
    }
  }

  return Object.entries(metricsMap).map(([date, data]) => ({
    date: new Date(date),
    reach: {
      impressions: data.impressions || 0,
      reach: data.reach || 0,
    },
    followers: {
      total: data.follower_count || 0,
    },
  }));
}

async function getMedia(accessToken, igAccountId, limit = 50) {
  const res = await axios.get(`${GRAPH_API_BASE}/${igAccountId}/media`, {
    params: {
      access_token: accessToken,
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement,saved)',
      limit,
    },
  });

  return res.data.data.map((post) => {
    const insights = {};
    if (post.insights) {
      for (const metric of post.insights.data) {
        insights[metric.name] = metric.values[0].value;
      }
    }

    return {
      platformContentId: post.id,
      type: _mapMediaType(post.media_type),
      description: post.caption,
      thumbnailUrl: post.thumbnail_url || post.media_url,
      contentUrl: post.permalink,
      publishedAt: new Date(post.timestamp),
      metrics: {
        likes: post.like_count || 0,
        comments: post.comments_count || 0,
        impressions: insights.impressions || 0,
        reach: insights.reach || 0,
        saves: insights.saved || 0,
        engagementRate: insights.engagement || 0,
      },
      hashtags: _extractHashtags(post.caption),
      mentions: _extractMentions(post.caption),
    };
  });
}

async function getDemographics(accessToken, igAccountId) {
  const metrics = 'audience_city,audience_country,audience_gender_age';

  const res = await axios.get(`${GRAPH_API_BASE}/${igAccountId}/insights`, {
    params: {
      access_token: accessToken,
      metric: metrics,
      period: 'lifetime',
    },
  });

  const result = { cities: {}, countries: {}, ageGender: {} };
  for (const metric of res.data.data) {
    if (metric.name === 'audience_city') result.cities = metric.values[0].value;
    if (metric.name === 'audience_country') result.countries = metric.values[0].value;
    if (metric.name === 'audience_gender_age') result.ageGender = metric.values[0].value;
  }

  return result;
}

function _mapMediaType(type) {
  const map = { IMAGE: 'image', VIDEO: 'reel', CAROUSEL_ALBUM: 'carousel' };
  return map[type] || 'image';
}

function _extractHashtags(text) {
  if (!text) return [];
  return (text.match(/#[\w]+/g) || []).map((h) => h.slice(1));
}

function _extractMentions(text) {
  if (!text) return [];
  return (text.match(/@[\w.]+/g) || []).map((m) => m.slice(1));
}

module.exports = {
  getAuthUrl,
  exchangeCode,
  refreshAccessToken,
  getAccountInfo,
  getAnalytics,
  getMedia,
  getDemographics,
};

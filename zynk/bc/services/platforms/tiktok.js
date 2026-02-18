const axios = require('axios');
const oauthConfig = require('../../config/oauth');
const logger = require('../../utils/logger');

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

function getAuthUrl(state) {
  const params = new URLSearchParams({
    client_key: oauthConfig.tiktok.clientKey,
    redirect_uri: oauthConfig.tiktok.redirectUri,
    scope: oauthConfig.tiktok.scopes.join(','),
    response_type: 'code',
    state,
  });
  return `${TIKTOK_AUTH_URL}?${params}`;
}

async function exchangeCode(code) {
  const res = await axios.post(`${TIKTOK_API_BASE}/oauth/token/`, new URLSearchParams({
    client_key: oauthConfig.tiktok.clientKey,
    client_secret: oauthConfig.tiktok.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: oauthConfig.tiktok.redirectUri,
  }));

  return {
    access_token: res.data.access_token,
    refresh_token: res.data.refresh_token,
    expires_in: res.data.expires_in,
    open_id: res.data.open_id,
  };
}

async function refreshAccessToken(refreshToken) {
  const res = await axios.post(`${TIKTOK_API_BASE}/oauth/token/`, new URLSearchParams({
    client_key: oauthConfig.tiktok.clientKey,
    client_secret: oauthConfig.tiktok.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }));
  return res.data;
}

async function getUserInfo(accessToken) {
  const res = await axios.get(`${TIKTOK_API_BASE}/user/info/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      fields: 'open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count',
    },
  });

  const user = res.data.data.user;
  return {
    platformUserId: user.open_id,
    username: user.display_name,
    displayName: user.display_name,
    profileImageUrl: user.avatar_url,
    profileUrl: user.profile_deep_link,
    bio: user.bio_description,
    metrics: {
      followers: user.follower_count || 0,
      following: user.following_count || 0,
      totalLikes: user.likes_count || 0,
      totalPosts: user.video_count || 0,
    },
    platformData: {
      isVerified: user.is_verified,
    },
  };
}

async function getVideos(accessToken, maxCount = 20) {
  const res = await axios.post(`${TIKTOK_API_BASE}/video/list/`, {
    max_count: maxCount,
  }, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      fields: 'id,title,video_description,create_time,cover_image_url,share_url,duration,like_count,comment_count,share_count,view_count',
    },
  });

  return (res.data.data.videos || []).map((video) => ({
    platformContentId: video.id,
    type: 'video',
    title: video.title,
    description: video.video_description,
    thumbnailUrl: video.cover_image_url,
    contentUrl: video.share_url,
    publishedAt: new Date(video.create_time * 1000),
    metrics: {
      views: video.view_count || 0,
      likes: video.like_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0,
    },
    hashtags: _extractHashtags(video.video_description),
    platformData: {
      duration: video.duration,
    },
  }));
}

async function getAnalytics(accessToken, _startDate, _endDate) {
  // TikTok Creator API doesn't provide day-by-day analytics via the basic API
  // We derive analytics from video-level data
  const videos = await getVideos(accessToken, 50);
  const userInfo = await getUserInfo(accessToken);

  return {
    summary: {
      followers: userInfo.metrics.followers,
      totalLikes: userInfo.metrics.totalLikes,
      totalPosts: userInfo.metrics.totalPosts,
      totalViews: videos.reduce((sum, v) => sum + v.metrics.views, 0),
    },
    videos,
  };
}

function _extractHashtags(text) {
  if (!text) return [];
  return (text.match(/#[\w]+/g) || []).map((h) => h.slice(1));
}

module.exports = {
  getAuthUrl,
  exchangeCode,
  refreshAccessToken,
  getUserInfo,
  getVideos,
  getAnalytics,
};

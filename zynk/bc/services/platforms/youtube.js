const axios = require('axios');
const { google } = require('googleapis');
const oauthConfig = require('../../config/oauth');
const logger = require('../../utils/logger');

const oauth2Client = new google.auth.OAuth2(
  oauthConfig.google.clientId,
  oauthConfig.google.clientSecret,
  oauthConfig.google.redirectUri,
);

function getAuthUrl(state) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: oauthConfig.google.scopes,
    state,
    prompt: 'consent',
  });
}

async function exchangeCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

async function refreshAccessToken(refreshToken) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

function getAuthenticatedClient(accessToken, refreshToken) {
  const client = new google.auth.OAuth2(
    oauthConfig.google.clientId,
    oauthConfig.google.clientSecret,
    oauthConfig.google.redirectUri,
  );
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return client;
}

async function getChannelInfo(accessToken, refreshToken) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);
  const youtube = google.youtube({ version: 'v3', auth });

  const response = await youtube.channels.list({
    part: 'snippet,statistics,contentDetails',
    mine: true,
  });

  const channel = response.data.items[0];
  if (!channel) throw new Error('No YouTube channel found');

  return {
    platformUserId: channel.id,
    username: channel.snippet.customUrl || channel.snippet.title,
    displayName: channel.snippet.title,
    profileImageUrl: channel.snippet.thumbnails.default.url,
    profileUrl: `https://youtube.com/channel/${channel.id}`,
    bio: channel.snippet.description,
    metrics: {
      followers: parseInt(channel.statistics.subscriberCount, 10) || 0,
      totalPosts: parseInt(channel.statistics.videoCount, 10) || 0,
      totalViews: parseInt(channel.statistics.viewCount, 10) || 0,
    },
    platformData: {
      uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
      hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount,
    },
  };
}

async function getAnalytics(accessToken, refreshToken, startDate, endDate) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);
  const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

  const response = await youtubeAnalytics.reports.query({
    ids: 'channel==MINE',
    startDate,
    endDate,
    metrics: 'views,likes,dislikes,comments,shares,subscribersGained,subscribersLost,estimatedMinutesWatched,averageViewDuration,impressions',
    dimensions: 'day',
    sort: 'day',
  });

  return (response.data.rows || []).map((row) => ({
    date: new Date(row[0]),
    reach: {
      views: row[1],
      impressions: row[10] || 0,
      watchTime: row[8],
    },
    engagement: {
      likes: row[2],
      comments: row[4],
      shares: row[5],
    },
    followers: {
      gained: row[6],
      lost: row[7],
      net: row[6] - row[7],
    },
    rawMetrics: {
      dislikes: row[3],
      avgViewDuration: row[9],
    },
  }));
}

async function getVideos(accessToken, refreshToken, maxResults = 50) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);
  const youtube = google.youtube({ version: 'v3', auth });

  // Get upload playlist
  const channelRes = await youtube.channels.list({
    part: 'contentDetails',
    mine: true,
  });
  const uploadsPlaylistId = channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;

  // Get video IDs
  const playlistRes = await youtube.playlistItems.list({
    part: 'contentDetails',
    playlistId: uploadsPlaylistId,
    maxResults,
  });

  const videoIds = playlistRes.data.items.map((item) => item.contentDetails.videoId);
  if (videoIds.length === 0) return [];

  // Get video details
  const videosRes = await youtube.videos.list({
    part: 'snippet,statistics,contentDetails',
    id: videoIds.join(','),
  });

  return videosRes.data.items.map((video) => ({
    platformContentId: video.id,
    type: _getVideoType(video),
    title: video.snippet.title,
    description: video.snippet.description,
    thumbnailUrl: video.snippet.thumbnails.medium?.url,
    contentUrl: `https://youtube.com/watch?v=${video.id}`,
    publishedAt: new Date(video.snippet.publishedAt),
    metrics: {
      views: parseInt(video.statistics.viewCount, 10) || 0,
      likes: parseInt(video.statistics.likeCount, 10) || 0,
      comments: parseInt(video.statistics.commentCount, 10) || 0,
    },
    hashtags: video.snippet.tags || [],
    platformData: {
      duration: video.contentDetails.duration,
      categoryId: video.snippet.categoryId,
    },
  }));
}

async function getDemographics(accessToken, refreshToken) {
  const auth = getAuthenticatedClient(accessToken, refreshToken);
  const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

  const [ageGender, countries] = await Promise.all([
    youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate: '2020-01-01',
      endDate: new Date().toISOString().split('T')[0],
      metrics: 'viewerPercentage',
      dimensions: 'ageGroup,gender',
    }),
    youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate: '2020-01-01',
      endDate: new Date().toISOString().split('T')[0],
      metrics: 'views',
      dimensions: 'country',
      sort: '-views',
      maxResults: 25,
    }),
  ]);

  return {
    ageGender: ageGender.data.rows || [],
    countries: (countries.data.rows || []).map((row) => ({
      code: row[0],
      views: row[1],
    })),
  };
}

async function getRevenueData(accessToken, refreshToken, startDate, endDate) {
  try {
    const auth = getAuthenticatedClient(accessToken, refreshToken);
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

    const response = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'estimatedRevenue,estimatedAdRevenue,estimatedRedPartnerRevenue',
      dimensions: 'day',
      sort: 'day',
    });

    return (response.data.rows || []).map((row) => ({
      date: new Date(row[0]),
      adRevenue: row[2] || 0,
      totalRevenue: row[1] || 0,
      memberships: row[3] || 0,
    }));
  } catch (err) {
    logger.warn('YouTube revenue data not available (monetization may not be enabled)');
    return [];
  }
}

function _getVideoType(video) {
  const duration = video.contentDetails.duration;
  // Shorts are <= 60 seconds
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (match) {
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3] || 0, 10);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 60) return 'short';
  }
  return 'video';
}

module.exports = {
  getAuthUrl,
  exchangeCode,
  refreshAccessToken,
  getChannelInfo,
  getAnalytics,
  getVideos,
  getDemographics,
  getRevenueData,
};

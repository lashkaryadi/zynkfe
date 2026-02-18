import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zynk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('zynk_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  connectPlatform: (platform) => api.get(`/auth/connect/${platform}`),
  disconnectPlatform: (platform) => api.post(`/auth/disconnect/${platform}`),
};

// Platforms
export const platformsAPI = {
  list: () => api.get('/platforms'),
  details: (platform) => api.get(`/platforms/${platform}`),
  sync: (platform) => api.post(`/platforms/${platform}/sync`),
};

// Analytics
export const analyticsAPI = {
  overview: (params) => api.get('/analytics/overview', { params }),
  platformDeepDive: (platform, params) => api.get(`/analytics/platform/${platform}`, { params }),
  growthTrends: (params) => api.get('/analytics/growth', { params }),
  contentPerformance: (params) => api.get('/analytics/content-performance', { params }),
};

// Content
export const contentAPI = {
  list: (params) => api.get('/content', { params }),
  top: (params) => api.get('/content/top', { params }),
  getById: (id) => api.get(`/content/${id}`),
};

// Audience
export const audienceAPI = {
  overview: (params) => api.get('/audience', { params }),
  geographic: (params) => api.get('/audience/geographic', { params }),
  activeHours: (params) => api.get('/audience/active-hours', { params }),
};

// Revenue
export const revenueAPI = {
  overview: (params) => api.get('/revenue', { params }),
  addManual: (data) => api.post('/revenue', data),
};

// Competitors
export const competitorsAPI = {
  list: (params) => api.get('/competitors', { params }),
  add: (data) => api.post('/competitors', data),
  remove: (id) => api.delete(`/competitors/${id}`),
  compare: (params) => api.get('/competitors/compare', { params }),
};

// Insights
export const insightsAPI = {
  followerPredictions: (params) => api.get('/insights/predictions/followers', { params }),
  contentPredictions: (params) => api.get('/insights/predictions/content', { params }),
  postingTimes: (params) => api.get('/insights/posting-times', { params }),
  suggestions: () => api.get('/insights/suggestions'),
  trending: () => api.get('/insights/trending'),
  hashtags: (params) => api.get('/insights/hashtags', { params }),
  burnout: () => api.get('/insights/burnout'),
  collaborations: () => api.get('/insights/collaborations'),
};

export default api;

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const instagramAPI = {
  // Get basic profile info
  getUserProfile: async (username) => {
    const response = await api.get(`/user/${username}`);
    return response.data;
  },

  // Get user posts (images/carousels)
  getUserPosts: async (username, params = {}) => {
    const response = await api.get(`/user/${username}/posts`, { params });
    return response.data;
  },

  // Get user reels (videos with extended data)
  getUserReels: async (username, params = {}) => {
    const response = await api.get(`/user/${username}/reels`, { params });
    return response.data;
  },

  // Get analytics
  getUserAnalytics: async (username) => {
    const response = await api.get(`/user/${username}/analytics`);
    return response.data;
  },

  // Refresh user data
  refreshUserData: async (username) => {
    const response = await api.post(`/user/${username}/refresh`);
    return response.data;
  },

  // Search users
  searchUsers: async (query, limit = 20) => {
    const response = await api.get('/users/search', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Get complete dashboard data (combined call)
  getDashboardData: async (username) => {
    try {
      const [profile, posts, reels, analytics] = await Promise.all([
        instagramAPI.getUserProfile(username),
        instagramAPI.getUserPosts(username, { limit: 12 }),
        instagramAPI.getUserReels(username, { limit: 12 }),
        instagramAPI.getUserAnalytics(username)
      ]);

      return {
        profile: profile.data,
        posts: posts.data,
        reels: reels.data,
        analytics: analytics.data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
};

export default instagramAPI;
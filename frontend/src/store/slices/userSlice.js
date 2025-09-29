import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Initial dummy state
const initialState = {
  profile: {
    username: '',
    full_name: '',
    profile_pic_url: '',
    followers: 0,
    following: 0,
    posts_count: 0,
    is_verified: false,
    engagement_rate: 0,
    avg_likes: 0,
    avg_comments: 0
  },
  posts: [],
  reels: [],
  loading: false,
  error: null,
  currentUser: null
};

// Async thunk for fetching complete user dashboard data synchronously
export const fetchUserDashboard = createAsyncThunk(
  'user/fetchDashboard',
  async (username, { rejectWithValue }) => {
    try {
      // Use the new dashboard endpoint that handles everything synchronously
      const response = await axios.get(`${API_BASE_URL}/user/${username}/dashboard`);

      return {
        profile: response.data.data.profile,
        posts: response.data.data.posts || [],
        reels: response.data.data.reels || []
      };
    } catch (error) {
      // Provide user-friendly error messages
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 404) {
        return rejectWithValue(`User "@${username}" not found. Please check the username and try again.`);
      } else if (status === 429) {
        return rejectWithValue('Too many requests. Please wait a moment and try again.');
      } else if (status >= 500) {
        return rejectWithValue('Server error. Please try again later.');
      } else {
        return rejectWithValue(message || `Failed to fetch data for @${username}`);
      }
    }
  }
);

// Async thunk for refreshing user data synchronously
export const refreshUserData = createAsyncThunk(
  'user/refreshData',
  async (username, { rejectWithValue }) => {
    try {
      // Use the dashboard endpoint which handles refresh automatically
      const response = await axios.get(`${API_BASE_URL}/user/${username}/dashboard`);

      return {
        profile: response.data.data.profile,
        posts: response.data.data.posts || [],
        reels: response.data.data.reels || []
      };
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 404) {
        return rejectWithValue(`User "@${username}" not found. Please check the username and try again.`);
      } else if (status === 429) {
        return rejectWithValue('Rate limit exceeded. Please wait before refreshing again.');
      } else if (status >= 500) {
        return rejectWithValue('Server error. Please try again later.');
      } else {
        return rejectWithValue(message || `Failed to refresh data for @${username}`);
      }
    }
  }
);

// Async thunk for loading more posts
export const loadMorePosts = createAsyncThunk(
  'user/loadMorePosts',
  async ({ username, page }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/${username}/posts`, {
        params: { page, limit: 40 }
      });
      return response.data.data?.items || [];
    } catch (error) {
      return rejectWithValue('Failed to load more posts');
    }
  }
);

// Async thunk for loading more reels
export const loadMoreReels = createAsyncThunk(
  'user/loadMoreReels',
  async ({ username, page }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/${username}/reels`, {
        params: { page, limit: 40 }
      });
      return response.data.data?.items || [];
    } catch (error) {
      return rejectWithValue('Failed to load more reels');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserData: (state) => {
      state.profile = initialState.profile;
      state.posts = [];
      state.reels = [];
      state.error = null;
      state.currentUser = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user dashboard
      .addCase(fetchUserDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
        // Clear previous user data when starting a new search
        state.profile = initialState.profile;
        state.posts = [];
        state.reels = [];
        state.currentUser = null;
      })
      .addCase(fetchUserDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.posts = action.payload.posts;
        state.reels = action.payload.reels;
        state.currentUser = action.payload.profile.username;
        state.error = null;
      })
      .addCase(fetchUserDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Refresh user data
      .addCase(refreshUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
        // Keep currentUser during refresh, but clear other data
        const currentUsername = state.currentUser;
        state.profile = initialState.profile;
        state.posts = [];
        state.reels = [];
        state.currentUser = currentUsername;
      })
      .addCase(refreshUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.posts = action.payload.posts;
        state.reels = action.payload.reels;
        state.error = null;
      })
      .addCase(refreshUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Load more posts
      .addCase(loadMorePosts.fulfilled, (state, action) => {
        state.posts = [...state.posts, ...action.payload];
      })

      // Load more reels
      .addCase(loadMoreReels.fulfilled, (state, action) => {
        state.reels = [...state.reels, ...action.payload];
      });
  }
});

export const { clearUserData, clearError } = userSlice.actions;
export default userSlice.reducer;

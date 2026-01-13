import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),
  getCurrentUser: () => api.get('/auth/me'),
};

// Story endpoints
export const storyAPI = {
  getStories: () => api.get('/stories'),
  getStory: (id) => api.get(`/stories/${id}`),
  createStory: (data) => api.post('/stories', data),
  addWord: (storyId, word) => api.post(`/stories/${storyId}/words`, { word }),
  endStory: (storyId) => api.post(`/stories/${storyId}/end`),
  deleteStory: (storyId) => api.delete(`/stories/${storyId}`),
};

// Invitation endpoints
export const invitationAPI = {
  createInvitations: (data) => api.post('/invitations', data),
  acceptInvitation: (token) => api.get(`/invitations/${token}`),
  getParticipants: (storyId) => api.get(`/invitations/stories/${storyId}/participants`),
  getPendingInvitations: (storyId) => api.get(`/invitations/stories/${storyId}/pending`),
};

// Admin endpoints
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  resendVerification: (userId) => api.post(`/admin/users/${userId}/resend-verification`),
};

export default api;

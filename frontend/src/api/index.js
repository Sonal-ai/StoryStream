import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Attach JWT token to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ss_token');
      localStorage.removeItem('ss_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const registerUser  = (data) => API.post('/auth/register', data);
export const loginUser     = (data) => API.post('/auth/login',    data);
export const getMe         = ()     => API.get('/auth/me');

// ─── Users ──────────────────────────────────────────────────────────────────
export const getUserProfile = (username)       => API.get(`/users/${username}`);
export const updateProfile  = (data)           => API.put('/users/profile', data);
export const getUserPosts   = (username, p)    => API.get(`/users/${username}/posts`, { params: p });
export const searchUsers    = (q)              => API.get('/users/search', { params: { q } });
export const followUser     = (username)       => API.post(`/users/${username}/follow`);
export const unfollowUser   = (username)       => API.delete(`/users/${username}/follow`);
export const getFollowers   = (username)       => API.get(`/users/${username}/followers`);
export const getFollowing   = (username)       => API.get(`/users/${username}/following`);

// ─── Posts ──────────────────────────────────────────────────────────────────
export const getAllPosts       = (params) => API.get('/posts',          { params });
export const getFeed          = (params) => API.get('/posts/feed',     { params });
export const getPostById      = (id)     => API.get(`/posts/${id}`);
export const createPost       = (data)   => API.post('/posts',           data);
export const deletePost       = (id)     => API.delete(`/posts/${id}`);
export const getPostsByHashtag = (tag, p)=> API.get(`/posts/hashtag/${tag}`, { params: p });

// ─── Comments ───────────────────────────────────────────────────────────────
export const getComments   = (postId, p) => API.get(`/posts/${postId}/comments`, { params: p });
export const addComment    = (postId, d) => API.post(`/posts/${postId}/comments`, d);
export const deleteComment = (id)        => API.delete(`/comments/${id}`);

// ─── Likes ──────────────────────────────────────────────────────────────────
export const likePost   = (postId) => API.post(`/posts/${postId}/like`);
export const unlikePost = (postId) => API.delete(`/posts/${postId}/like`);

// ─── Notifications ──────────────────────────────────────────────────────────
export const getNotifications    = (p)  => API.get('/notifications',           { params: p });
export const markNotifRead       = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotifsRead   = ()   => API.put('/notifications/read-all');
export const deleteNotification  = (id) => API.delete(`/notifications/${id}`);

export default API;

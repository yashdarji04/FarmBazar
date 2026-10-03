import axios from 'axios';
import { getSessionUser, clearSessionUser } from './authStorage';

// In local dev: Vite proxy forwards /api/* → localhost:5001
// In production: Vercel rewrites /api/* → Render backend
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to the header.
// Reads from THIS tab's session (sessionStorage-backed) so simultaneous
// logins with different roles in different tabs never bleed into each
// other — see services/authStorage.js for why.
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    const user = getSessionUser();
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    if (
      response.config.url &&
      response.config.url.startsWith('/cart') &&
      ['post', 'put', 'delete'].includes(response.config.method)
    ) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cartUpdated'));
      }
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token for THIS tab is invalid/expired — clear only this tab's
      // session (and the "remember me" template) and send the user back
      // to login. Other tabs with their own valid sessions are untouched.
      clearSessionUser();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

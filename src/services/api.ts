import axios from 'axios';

const TOKEN_KEY = 'epaas_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl: string = err.config?.url ?? '';
    const isAuthRequest = requestUrl.includes('/auth/');
    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem(TOKEN_KEY);
      // Avoid circular import — navigate via window location
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const TOKEN_STORAGE_KEY = TOKEN_KEY;

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

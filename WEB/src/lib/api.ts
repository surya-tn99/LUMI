import axios from 'axios';

const API_URL = `http://${window.location.hostname}:8000`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Dispatch a generic unauthorized event for ANY 401 error
      window.dispatchEvent(new CustomEvent('unauthorized-access'));
    }
    return Promise.reject(error);
  }
);

export default api;

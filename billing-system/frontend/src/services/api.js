import axios from 'axios';

const api = axios.create({
  baseURL: 'http://3.89.148.127:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

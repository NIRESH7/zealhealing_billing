/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data);
        } catch {
          console.error("Token invalid or expired");
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const payload = { username, password };
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem('token', data.access_token);
    setUser({ username, role: data.role });
  };

  const register = async (username, password) => {
    // Backend expects {username, password, role} for signup (content-type: application/json or similar)
    // Looking at backend/routers/auth.py, /signup expects a UserCreate JSON.
    const payload = {
      username: username,
      password: password,
      role: 'staff' // Default role for new registrations
    };
    await api.post('/auth/signup', payload);
    // Automatically log in after registration
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

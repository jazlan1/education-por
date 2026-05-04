import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('sms_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('sms_token'));
  const [loading, setLoading] = useState(true);

  const persistAuth = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('sms_user', JSON.stringify(userData));
    localStorage.setItem('sms_token', tokenData);
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sms_user');
    localStorage.removeItem('sms_token');
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: userData, token: tokenData } = res.data;
    persistAuth(userData, tokenData);
    return userData;
  };

  const logout = () => clearAuth();

  const refreshUser = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await authAPI.getMe();
      setUser(currentUser => {
        const freshUser = { ...currentUser, ...res.data.user };
        localStorage.setItem('sms_user', JSON.stringify(freshUser));
        return freshUser;
      });
    } catch (error) {
      // Only clear auth when the token is actually invalid.
      // Temporary network/server issues should not force-log the user out.
      if (error.response?.status === 401) {
        clearAuth();
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAdmin, isTeacher, isStudent,
      login, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

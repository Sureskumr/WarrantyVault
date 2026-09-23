import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/authApi.js';
import { setAccessToken, setUnauthorizedHandler } from '../api/axiosClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  // On first load, try to silently restore a session via the httpOnly
  // refresh cookie (if the browser still has one from a previous visit).
  useEffect(() => {
    (async () => {
      try {
        const refreshRes = await authApi.refresh();
        setAccessToken(refreshRes.data.accessToken);
        const meRes = await authApi.me();
        setUser(meRes.data.user);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [clearSession]);

  const login = async (payload) => {
    const res = await authApi.login(payload);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await authApi.register(payload);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const registerCustomer = async (payload) => {
    const res = await authApi.registerCustomer(payload);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, registerCustomer, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('zynk_token');
      if (!token) { setLoading(false); return; }
      const { data } = await authAPI.getProfile();
      setUser(data.user);
      setPlatforms(data.connectedPlatforms);
    } catch {
      localStorage.removeItem('zynk_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('zynk_token', data.token);
    setUser(data.user);
    await loadProfile();
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem('zynk_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('zynk_token');
    setUser(null);
    setPlatforms([]);
  };

  return (
    <AuthContext.Provider value={{ user, platforms, loading, login, register, logout, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import { useState, useEffect } from 'react';
import { isAuthenticated, getStoredUser, logout as apiLogout } from '../utils/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期化時にローカルストレージから認証状態を復元
    const checkAuth = () => {
      if (isAuthenticated()) {
        const storedUser = getStoredUser();
        setUser(storedUser);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData.user);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const register = (userData) => {
    setUser(userData.user);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    register
  };
};

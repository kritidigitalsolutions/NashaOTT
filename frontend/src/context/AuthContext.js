import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAdminProfile } from "../api/adminApi";

export const AuthContext = createContext({
  admin: null,
  token: null,
  isAuthed: false,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("nasha_admin_token") || null);
  const [loading, setLoading] = useState(true);

  // On mount, verify token is still valid by hitting /profile
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    getAdminProfile()
      .then((res) => {
        setAdmin(res.data.admin);
      })
      .catch(() => {
        // Token invalid/expired — clear everything
        localStorage.removeItem("nasha_admin_token");
        localStorage.removeItem("nasha_admin_user");
        localStorage.removeItem("nasha_admin_authed");
        setToken(null);
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback((jwtToken, adminData) => {
    localStorage.setItem("nasha_admin_token", jwtToken);
    localStorage.setItem("nasha_admin_authed", "true");
    if (adminData) {
      localStorage.setItem("nasha_admin_user", JSON.stringify(adminData));
    }
    setToken(jwtToken);
    setAdmin(adminData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("nasha_admin_token");
    localStorage.removeItem("nasha_admin_user");
    localStorage.removeItem("nasha_admin_authed");
    setToken(null);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      token,
      isAuthed: !!token && !!admin,
      loading,
      login,
      logout,
    }),
    [admin, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

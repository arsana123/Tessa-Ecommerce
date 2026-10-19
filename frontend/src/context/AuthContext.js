import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fk_user")); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem("fk_token");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await getMe();
      setUser(data.data.user);
      localStorage.setItem("fk_user", JSON.stringify(data.data.user));
    } catch {
      localStorage.removeItem("fk_token");
      localStorage.removeItem("fk_user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const login = (token, userData) => {
    localStorage.setItem("fk_token", token);
    localStorage.setItem("fk_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("fk_token");
    localStorage.removeItem("fk_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin:   user?.role === "admin",
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "./api";

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refresh: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem("devflow_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      localStorage.removeItem("devflow_token");
      localStorage.removeItem("devflow_refresh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (token: string, refresh: string) => {
    localStorage.setItem("devflow_token", token);
    localStorage.setItem("devflow_refresh", refresh);
    fetchUser();
  };

  const logout = () => {
    localStorage.removeItem("devflow_token");
    localStorage.removeItem("devflow_refresh");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

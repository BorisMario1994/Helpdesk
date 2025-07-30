import { jwtDecode } from "jwt-decode";
import { createContext, useContext, useState } from "react";
import api from "../api";
import User from "../models/master/User"

type TokenPayload = {
  user: User;
  scope: User;
}

type AuthContextType = {
  accessToken: string | null;
  user: User | null;
  scope: User | null;
  setToken: (token: string) => void;
  login: (username: string, password: string) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [scope, setScope] = useState<User | null>(null);

  const setToken = (token: string) => {
    setAccessToken(token);
    const decoded = jwtDecode<TokenPayload>(token);
    setUser(decoded.user); 
    setScope(decoded.scope);
  };

  const login = async (username: string, password: string) => {
    const login = await api.apiInstance.post("/auth/login", {
      data: {
        username: username,
        password: password
      }
    });
    api.setAccessToken(login.data);
    setToken(login.data);
  };

  const refresh = async (username?: string) => {
    const newAccessToken = await api.refreshToken(username ?? localStorage.getItem("scope") ?? scope?.username ?? "");
    setToken(newAccessToken);
  };

  const logout = async () => {
    await api.apiInstance.post("/auth/logout");
    localStorage.removeItem("scope");
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, user, scope, setToken, login, refresh, logout }}>
      { children }
    </AuthContext.Provider>  
  );
};

export const useAuth = () => useContext(AuthContext)!;

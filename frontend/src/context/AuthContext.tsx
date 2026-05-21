"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { setCookie, getCookie, deleteCookie } from "cookies-next";

interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in cookies
    const saved = getCookie("instantservice_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved as string));
      } catch {
        deleteCookie("instantservice_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setCookie("instantservice_user", JSON.stringify(userData), {
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: typeof window !== "undefined" && window.location.protocol === "https:",
    });
  };

  const logout = () => {
    setUser(null);
    deleteCookie("instantservice_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Rehydrate session on mount
  useEffect(() => {
    let isMounted = true;

    const fetchMe = async () => {
      try {
        const res = await api.get("/api/auth/me");
        if (!isMounted) return;
        setUser(res.data.user || null);
      } catch (error) {
        if (!isMounted) return;
        if (error?.response?.status === 401) {
          setUser(null);
        } else {
          console.error("Failed to fetch current user:", error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMe();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (email, password) => {
      try {
        const res = await api.post("/api/auth/login", { email, password });
        setUser(res.data.user || null);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get("redirect");
          router.push(redirect || "/dashboard");
        } else {
          router.push("/dashboard");
        }
        return res.data.user;
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to log in."
        );
        throw error;
      }
    },
    [router]
  );

  const register = useCallback(
    async (name, email, password) => {
      try {
        const res = await api.post("/api/auth/register", {
          name,
          email,
          password,
        });
        setUser(res.data.user || null);
        router.push("/dashboard");
        toast.success("Welcome to CollegeBazaar!");
        return res.data.user;
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to register."
        );
        throw error;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      router.push("/auth/login");
      toast.success("Logged out successfully.");
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data.user || null);
    } catch (error) {
      if (error?.response?.status === 401) {
        setUser(null);
      } else {
        console.error("Failed to refresh user:", error);
      }
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}


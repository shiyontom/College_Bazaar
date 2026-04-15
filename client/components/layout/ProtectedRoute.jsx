"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirect = encodeURIComponent(pathname || "/");
      router.replace(`/auth/login?redirect=${redirect}`);
      return;
    }
    if (requireAdmin && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [loading, user, router, pathname, requireAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          <span>Checking your session...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && user.role !== "admin") return null;

  return children;
}
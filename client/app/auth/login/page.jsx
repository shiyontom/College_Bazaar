"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z
    .string()
    .regex(/.+@.+\..+/, {
      message: "Enter a valid college email",
    })
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  const onSubmit = async (values) => {
    setApiError("");
    try {
      await login(values.email, values.password);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid credentials. Please try again.";
      setApiError(message);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-[#0f172a]">
        <p className="text-sm text-[#64748b]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 dark:bg-slate-900">
      <Card className="w-full max-w-md border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <CardHeader className="space-y-2">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center">
              <Image
                src="/logo.png"
                alt="CollegeBazaar"
                width={40}
                height={40}
                className="h-10 w-10"
              />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
              CollegeBazaar
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Log in with your college account to access your dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-gray-700 dark:text-slate-300">College Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@nsut.ac.in"
                className="border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-[#ef4444]">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-gray-700 dark:text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-[#ef4444]">
                  {errors.password.message}
                </p>
              )}
            </div>

            {apiError && (
              <p className="text-xs font-medium text-[#ef4444]">
                {apiError}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-[#64748b]">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="mt-2 w-full bg-green-600 text-sm font-semibold text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Logging you in...</span>
                </span>
              ) : (
                "Log in"
              )}
            </Button>
          </form>

          <p className="mt-2 text-center text-xs text-[#64748b]">
            New to CollegeBazaar?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .trim(),
    email: z
      .string()
      .regex(/.+@.+\..+/, {
        message: "Use your college email",
      })
      .trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, { message: "Password must contain at least 1 uppercase letter" })
      .regex(/\d/, { message: "Password must contain at least 1 number" }),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading, register: registerUser } = useAuth();
  const [apiError, setApiError] = useState("");
  const [showError, setShowError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  const onSubmit = async (values) => {
    setApiError("");
    setShowError(false);
    try {
      await registerUser(values.name, values.email, values.password);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      setApiError(message);
      setShowError(true);
    }
  };

  // While checking auth, avoid flicker
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
              Create an account with your college email to start buying &amp; selling.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiError && showError && (
            <Alert
              variant="destructive"
              className="border-[#ef4444] bg-[#fee2e2] text-[#991b1b]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <AlertTitle className="text-sm font-semibold">
                    Error
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {apiError}
                  </AlertDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setShowError(false)}
                  className="text-xs text-[#991b1b] hover:text-[#7f1d1d]"
                >
                  Dismiss
                </button>
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-gray-700 dark:text-slate-300">Full Name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                className="border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-[#ef4444]">
                  {errors.name.message}
                </p>
              )}
            </div>

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
              <p className="text-xs text-[#64748b]">
                Use your college email to verify your campus.
              </p>
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
                autoComplete="new-password"
                placeholder="Create a strong password"
                className="border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                {...register("password")}
              />
              <p className="text-xs text-[#64748b]">
                At least 8 characters, 1 uppercase letter, and 1 number.
              </p>
              {errors.password && (
                <p className="text-xs text-[#ef4444]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-slate-300">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-[#ef4444]">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="mt-2 w-full bg-green-600 text-sm font-semibold text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating your account...</span>
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="mt-2 text-center text-xs text-[#64748b]">
            Already have an account?{" "}
            <Link
              href="/auth/login"
                className="font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

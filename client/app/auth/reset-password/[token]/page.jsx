"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
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

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, {
        message: "Password must contain at least 1 uppercase letter",
      })
      .regex(/\d/, {
        message: "Password must contain at least 1 number",
      }),
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token;

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values) => {
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const res = await api.post(`/api/auth/reset-password/${token}`, {
        password: values.password,
      });
      if (res.data?.success) {
        setSuccessMessage("Password reset successful. Redirecting to login...");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Invalid or expired reset link. Please request a new one.";
      setErrorMessage(message);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const id = setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [successMessage, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
      <Card className="w-full max-w-md border border-[#e2e8f0] bg-white shadow-lg">
        <CardHeader className="space-y-2">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#16a34a] text-sm font-semibold text-white">
              CB
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-[#0f172a]">
              CollegeBazaar
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-[#64748b]">
              Choose a new password for your account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMessage && (
            <Alert className="border-[#16a34a] bg-[#dcfce7] text-[#166534]">
              <AlertTitle className="text-sm font-semibold">
                Password updated
              </AlertTitle>
              <AlertDescription className="text-xs">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && !successMessage && (
            <Alert
              variant="destructive"
              className="border-[#ef4444] bg-[#fee2e2] text-[#991b1b]"
            >
              <AlertTitle className="text-sm font-semibold">Error</AlertTitle>
              <AlertDescription className="text-xs">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#0f172a]">New Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                className="border-[#e2e8f0] bg-white text-[#0f172a] focus:border-[#16a34a] focus:ring-[#16a34a]"
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
              <Label htmlFor="confirmPassword" className="text-[#0f172a]">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="border-[#e2e8f0] bg-white text-[#0f172a] focus:border-[#16a34a] focus:ring-[#16a34a]"
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
              className="mt-2 w-full bg-[#16a34a] text-sm font-semibold text-white hover:bg-[#15803d]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Updating password...</span>
                </span>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          <p className="mt-2 text-center text-xs text-[#64748b]">
            Link not working?{" "}
            <Link
              href="/auth/forgot-password"
              className="font-semibold text-[#16a34a] hover:text-[#15803d]"
            >
              Request a new link
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

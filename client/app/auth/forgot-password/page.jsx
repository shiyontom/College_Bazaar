"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .regex(/.+@.+\..+/, "Enter a valid email address")
    .trim(),
});

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values) => {
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const res = await api.post("/api/auth/forgot-password", {
        email: values.email,
      });
      if (res.data?.success) {
        setSuccessMessage(
          "Check your college email! A password reset link has been sent."
        );
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to send reset link. Please try again.";
      setErrorMessage(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
      <Card className="w-full max-w-md border border-[#e2e8f0] bg-white shadow-lg">
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
            <CardTitle className="text-2xl font-bold tracking-tight text-[#0f172a]">
              CollegeBazaar
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-[#64748b]">
              Forgot your password? Enter your college email and we&apos;ll
              send you a reset link.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMessage && (
            <Alert className="border-[#16a34a] bg-[#dcfce7] text-[#166534]">
              <AlertTitle className="text-sm font-semibold">
                Email sent
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
              <Label htmlFor="email" className="text-[#0f172a]">College Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@college.edu"
                className="border-[#e2e8f0] bg-white text-[#0f172a] focus:border-[#2563eb] focus:ring-[#2563eb]"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-[#ef4444]">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="mt-2 w-full bg-[#2563eb] text-sm font-semibold text-white hover:bg-[#1d4ed8]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Sending reset link...</span>
                </span>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <p className="mt-2 text-center text-xs text-[#64748b]">
            Remembered your password?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
            >
              Back to Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

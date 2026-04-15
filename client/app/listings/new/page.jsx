"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  "Textbooks",
  "Electronics",
  "Stationery",
  "Clothing",
  "Furniture",
  "Sports",
  "Musical Instruments",
  "Other",
];

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  description: z
    .string()
    .min(20, "Description should be at least 20 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .or(
      z
        .string()
        .transform((v) => (v === "" ? 0 : Number(v)))
        .pipe(z.number().min(0, "Price cannot be negative"))
    ),
  isFree: z.boolean().optional(),
  isTradeable: z.boolean().optional(),
  tradePreferences: z
    .string()
    .max(300, "Trade preferences cannot exceed 300 characters")
    .optional(),
});

function NewListingContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      price: 0,
      isFree: false,
      isTradeable: false,
      tradePreferences: "",
    },
  });

  const descriptionValue = watch("description");
  const isFree = watch("isFree");
  const isTradeable = watch("isTradeable");
  const tradePreferencesValue = watch("tradePreferences");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (isFree) {
      setValue("price", 0);
    }
  }, [isFree, setValue]);

  useEffect(() => {
    if (!isTradeable) {
      setValue("tradePreferences", "");
    }
  }, [isTradeable, setValue]);

  const handleFileSelect = (event) => {
    const selected = Array.from(event.target.files || []);
    const combined = [...files, ...selected].slice(0, 5);
    setFiles(combined);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer.files || []);
    const allowed = dropped.filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );
    const combined = [...files, ...allowed].slice(0, 5);
    setFiles(combined);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleRemoveFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSubmit = useMemo(
    () => !authLoading && !!user && !isSubmitting,
    [authLoading, user, isSubmitting]
  );

  const onSubmit = async (values) => {
    if (!files.length) {
      setApiError("Please upload at least one image (max 5).");
      return;
    }

    try {
      setApiError("");
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("category", values.category);
      formData.append("description", values.description);

      const priceToSend = values.isFree ? 0 : values.price || 0;
      formData.append("price", String(priceToSend));

      formData.append("isTradeable", values.isTradeable ? "true" : "false");
      if (values.isTradeable && values.tradePreferences) {
        formData.append("tradePreferences", values.tradePreferences);
      }

      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await api.post("/api/listings", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });

      const created = response.data?.listing;
      if (created?._id) {
        router.push(`/listings/${created._id}`);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create listing. Please try again.";
      setApiError(message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">
          Create a New Listing
        </h1>
        <p className="text-xs text-slate-400">
          Share items with your campus community. You can sell or trade
          your listing.
        </p>
      </div>

      {apiError && (
        <p className="text-sm font-medium text-red-400">{apiError}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g., Engineering Mathematics 1st Year Textbook"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-red-400">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            className="h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-2 text-sm text-slate-100"
            {...register("category")}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-red-400">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="min-h-[100px] w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
            placeholder="Describe the condition, included accessories, and any important details..."
            {...register("description")}
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>
              {descriptionValue?.length || 0}/1000 characters
            </span>
            {errors.description && (
              <span className="text-red-400">
                {errors.description.message}
              </span>
            )}
          </div>
        </div>

        {/* Price and free toggle */}
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              disabled={isFree}
              {...register("price", {
                valueAsNumber: true,
              })}
            />
            {errors.price && (
              <p className="text-xs text-red-400">
                {errors.price.message}
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
              {...register("isFree")}
            />
            <span>This is FREE</span>
          </label>
        </div>

        {/* Images upload */}
        <div className="space-y-2">
          <Label>Images</Label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-6 text-center text-xs text-slate-400"
          >
            <p className="mb-1 font-medium text-slate-200">
              Drag and drop images here, or click to select
            </p>
            <p>JPG, PNG, or WEBP up to 5 images.</p>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="mt-3 block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-100 hover:file:bg-slate-700"
            />
          </div>
          {files.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-24 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-[10px] text-slate-100 hover:bg-black/80"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tradeable toggle and preferences */}
        <div className="space-y-2">
          <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/70 p-3">
            <div className="text-xs text-slate-200">
              <p className="font-semibold">
                I&apos;m open to bartering/trading this item
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Mark this listing as tradeable so students can propose
                swaps.
              </p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-500"
              {...register("isTradeable")}
            />
          </label>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              isTradeable ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {isTradeable && (
              <div className="mt-2 space-y-1.5">
                <Label htmlFor="tradePreferences">
                  Trade Preferences
                </Label>
                <textarea
                  id="tradePreferences"
                  className="min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                  placeholder="e.g., Will trade for a scientific calculator or Arduino kit"
                  maxLength={300}
                  {...register("tradePreferences")}
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>
                    {tradePreferencesValue?.length || 0}/300 characters
                  </span>
                  {errors.tradePreferences && (
                    <span className="text-red-400">
                      {errors.tradePreferences.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-1">
            <p className="text-[11px] text-slate-400">
              Uploading images... {uploadProgress}%
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            className="mt-2 bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500"
            disabled={!canSubmit}
          >
            {isSubmitting ? "Publishing..." : "Publish Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewListingPage() {
  return (
    <ProtectedRoute>
      <NewListingContent />
    </ProtectedRoute>
  );
}
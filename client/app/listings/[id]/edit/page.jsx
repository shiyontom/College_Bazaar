"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Toaster, toast } from "sonner";

const CATEGORIES = [
  "Books & Notes",
  "Electronics",
  "Clothing",
  "Sports",
  "Furniture",
  "Stationery",
  "Lab Equipment",
  "Other",
];

const COURSE_TAGS = ["CSE", "IT", "ECE", "EEE", "ME", "CE", "BT", "ICE", "ENV"];

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const id = params?.id;

  const [loadingListing, setLoadingListing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState("");

  const [listing, setListing] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    courseTags: [],
    isTradeable: false,
    tradePreferences: "",
  });

  const maxNewImagesAllowed = useMemo(
    () => Math.max(0, 5 - existingImages.length),
    [existingImages.length]
  );

  useEffect(() => {
    if (!id) return;

    const loadListing = async () => {
      try {
        setLoadingListing(true);
        const res = await api.get(`/api/listings/${id}`);
        const listingData = res?.data?.listing;

        if (!listingData) {
          toast.error("Listing not found.");
          router.replace(`/listings/${id}`);
          return;
        }

        setListing(listingData);
        setExistingImages(listingData.images || []);
        setForm({
          title: listingData.title || "",
          description: listingData.description || "",
          price:
            typeof listingData.price === "number"
              ? String(listingData.price)
              : "",
          category: listingData.category || "",
          courseTags: Array.isArray(listingData.courseTags)
            ? listingData.courseTags
            : [],
          isTradeable: Boolean(listingData.isTradeable),
          tradePreferences: listingData.tradePreferences || "",
        });
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to load listing details."
        );
        router.replace(`/listings/${id}`);
      } finally {
        setLoadingListing(false);
      }
    };

    loadListing();
  }, [id, router]);

  useEffect(() => {
    if (authLoading || loadingListing || !listing || user) return;
    router.replace(`/listings/${id}`);
  }, [authLoading, loadingListing, listing, user, router, id]);

  useEffect(() => {
    if (authLoading || loadingListing || !listing || !user) return;

    const isSeller = listing?.seller?._id === user?.id;
    const isAdmin = user?.role === "admin";
    if (!isSeller && !isAdmin) {
      toast.error("You are not allowed to edit this listing.");
      router.replace(`/listings/${id}`);
    }
  }, [authLoading, loadingListing, listing, user, router, id]);

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCourseTag = (tag) => {
    setForm((prev) => {
      const hasTag = prev.courseTags.includes(tag);
      if (hasTag) {
        return { ...prev, courseTags: prev.courseTags.filter((t) => t !== tag) };
      }
      return { ...prev, courseTags: [...prev.courseTags, tag] };
    });
  };

  const handleNewImageSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    const imagesOnly = selectedFiles.filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    );

    if (!imagesOnly.length) {
      toast.error("Please select JPG, PNG, or WEBP images.");
      return;
    }

    setNewImages((prev) => {
      const combined = [...prev, ...imagesOnly];
      const capped = combined.slice(0, maxNewImagesAllowed);
      if (combined.length > maxNewImagesAllowed) {
        toast.error("You can only keep up to 5 images in total.");
      }
      return capped;
    });

    event.target.value = "";
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (img) => {
    const imageId = img?.public_id || img?.publicId;
    if (!imageId) {
      toast.error("Image id not found.");
      return;
    }

    if (existingImages.length <= 1) {
      toast.error("A listing must have at least one image.");
      return;
    }

    try {
      setDeletingImageId(imageId);
      await api.delete(`/api/listings/${id}/image`, {
        data: {
          imageId,
          public_id: imageId,
          publicId: imageId,
        },
      });
      setExistingImages((prev) =>
        prev.filter((image) => (image?.public_id || image?.publicId) !== imageId)
      );
      toast.success("Image removed.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete image.");
    } finally {
      setDeletingImageId("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.category) {
      toast.error("Title, description, and category are required.");
      return;
    }

    if (existingImages.length + newImages.length < 1) {
      toast.error("At least one image is required.");
      return;
    }

    if (existingImages.length + newImages.length > 5) {
      toast.error("A listing can have at most 5 images.");
      return;
    }

    if (form.isTradeable && !form.tradePreferences.trim()) {
      toast.error("Add trade preferences for tradeable listings.");
      return;
    }

    const parsedPrice = Number(form.price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Price must be a valid non-negative number.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("price", String(parsedPrice));
      formData.append("category", form.category);
      formData.append("isTradeable", form.isTradeable ? "true" : "false");
      formData.append(
        "tradePreferences",
        form.isTradeable ? form.tradePreferences.trim() : ""
      );

      form.courseTags.forEach((tag) => {
        formData.append("courseTags", tag);
      });

      newImages.forEach((file) => {
        formData.append("images", file);
      });

      await api.put(`/api/listings/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Listing updated successfully.");
      router.push(`/listings/${id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update listing.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingListing) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Loading edit form...
          </p>
        </div>
      </main>
    );
  }

  if (!listing || !user) return null;

  const isSeller = listing?.seller?._id === user?.id;
  const isAdmin = user?.role === "admin";
  if (!isSeller && !isAdmin) return null;

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <Toaster position="top-right" richColors />

      <Link
        href={`/listings/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listing
      </Link>

      <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Edit Listing
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Update your listing details, trade settings, and images.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Listing title"
              className="dark:border-slate-600 dark:bg-slate-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your item"
              className="min-h-28 dark:border-slate-600 dark:bg-slate-900"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price (INR)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className="dark:border-slate-600 dark:bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const active = form.category === cat;
                  return (
                    <Badge
                      key={cat}
                      onClick={() => handleInputChange("category", cat)}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs ${
                        active
                          ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      {cat}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Course Tags</Label>
            <div className="flex flex-wrap gap-2">
              {COURSE_TAGS.map((tag) => {
                const active = form.courseTags.includes(tag);
                return (
                  <Badge
                    key={tag}
                    onClick={() => toggleCourseTag(tag)}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs ${
                      active
                        ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-amber-900 dark:text-amber-200">
                  Open to Trade
                </Label>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Turn on if you are willing to barter.
                </p>
              </div>
              <Switch
                checked={form.isTradeable}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    isTradeable: checked,
                    tradePreferences: checked ? prev.tradePreferences : "",
                  }))
                }
                className="data-[state=checked]:bg-amber-500 dark:data-[state=checked]:bg-amber-500"
              />
            </div>

            {form.isTradeable && (
              <div className="space-y-2">
                <Label htmlFor="tradePreferences" className="text-amber-900 dark:text-amber-200">
                  Trade Preferences
                </Label>
                <Input
                  id="tradePreferences"
                  value={form.tradePreferences}
                  onChange={(e) =>
                    handleInputChange("tradePreferences", e.target.value)
                  }
                  placeholder="e.g. Looking for graphing calculator"
                  className="border-amber-300 bg-white dark:border-amber-700 dark:bg-slate-900"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Existing Images</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {existingImages.map((img, idx) => {
                const imageId = img?.public_id || img?.publicId || `img-${idx}`;
                return (
                  <div
                    key={imageId}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Existing image ${idx + 1}`}
                      className="h-28 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingImage(img)}
                      disabled={deletingImageId === imageId}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/90 disabled:opacity-70"
                      aria-label="Delete image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newImages">
              Upload New Images ({existingImages.length + newImages.length}/5)
            </Label>
            <Input
              id="newImages"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleNewImageSelection}
              disabled={maxNewImagesAllowed <= 0}
              className="dark:border-slate-600 dark:bg-slate-900"
            />
            {newImages.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {newImages.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-28 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/90"
                      aria-label="Remove selected image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

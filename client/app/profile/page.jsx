"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import ListingCard from "@/components/listings/ListingCard";
import ListingCardSkeleton from "@/components/listings/ListingCardSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Package, CheckCircle2, Repeat } from "lucide-react";

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState("active");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.bio) {
      setBio(user.bio);
    }
    if (typeof user?.phone === "string") {
      setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    const fetchUserListings = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const res = await api.get("/api/auth/me");
        const userData = res.data?.user;
        if (userData?.listings) {
          setListings(Array.isArray(userData.listings) ? userData.listings : []);
        } else {
          setListings([]);
        }
      } catch (err) {
        console.error("Failed to fetch user listings", err);
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserListings();
  }, [user]);

  const activeListings = useMemo(
    () => listings.filter((l) => l.status === "active"),
    [listings]
  );
  const soldTradedListings = useMemo(
    () => listings.filter((l) => l.status === "sold" || l.status === "traded"),
    [listings]
  );
  const tradeableListings = useMemo(
    () => listings.filter((l) => l.isTradeable && l.status === "active"),
    [listings]
  );

  const displayedListings =
    tab === "active"
      ? activeListings
      : tab === "sold"
      ? soldTradedListings
      : tradeableListings;

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "CB";

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      await api.put("/api/users/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshUser();
      toast.success("Profile picture updated!");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update profile picture.";
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      formData.append("phone", phone);

      const res = await api.put("/api/users/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshUser();
      const userRes = await api.get("/api/auth/me");
      if (userRes.data?.user?.listings) {
        setListings(Array.isArray(userRes.data.user.listings) ? userRes.data.user.listings : []);
      }

      setEditing(false);
      if (res.data?.user) {
        setName(res.data.user.name || "");
        setBio(res.data.user.bio || "");
        setPhone(res.data.user.phone || "");
      }
      toast.success("Profile updated!");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update profile.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (listingId, status) => {
    try {
      await api.patch(`/api/listings/${listingId}/status`, { status });
      const userRes = await api.get("/api/auth/me");
      if (userRes.data?.user?.listings) {
        setListings(Array.isArray(userRes.data.user.listings) ? userRes.data.user.listings : []);
      }
      if (status === "sold") {
        toast.success("Marked as sold.");
      } else if (status === "traded") {
        toast.success("Marked as traded.");
      }
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (listingId) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await api.delete(`/api/listings/${listingId}`);
      const userRes = await api.get("/api/auth/me");
      if (userRes.data?.user?.listings) {
        setListings(Array.isArray(userRes.data.user.listings) ? userRes.data.user.listings : []);
      }
      toast.success("Listing deleted.");
    } catch (err) {
      console.error("Failed to delete listing", err);
      toast.error("Failed to delete listing.");
    }
  };

  const handleEdit = (listingId) => {
    router.push(`/listings/${listingId}/edit`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <section className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              onClick={handleAvatarClick}
              className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-green-600 bg-green-600 transition hover:border-green-700 dark:border-green-500 dark:hover:border-green-400"
            >
              {uploadingAvatar ? (
                <div className="flex h-full w-full items-center justify-center bg-green-600">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              ) : user.profilePicture?.url ? (
                <Image
                  src={user.profilePicture.url}
                  alt={user.name || "Profile picture"}
                  fill
                  className="object-cover"
                />
              ) : (
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt={user.name || "User"} />
                  <AvatarFallback className="bg-green-600 text-lg font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              {user.name}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
              {user.email}
            </p>
            {user.phone && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
                WhatsApp: {user.phone}
              </p>
            )}
            {user.collegeDomain && (
              <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                @{user.collegeDomain}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={() => setEditing((prev) => !prev)}
          >
            {editing ? "Cancel" : "Edit Profile"}
          </Button>
          {user.listingCount != null && (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {user.listingCount} total listings
            </p>
          )}
        </div>
      </section>

      {/* Edit form */}
      {editing && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Bio
              </Label>
              <textarea
                id="bio"
                className="min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                placeholder="Tell others about what you study, what you like to trade, or anything else."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                <span>{bio.length}/300 characters</span>
                {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-slate-300">
                WhatsApp Phone
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Use digits only (10-15), optional leading +.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                onClick={() => {
                  setEditing(false);
                  setError("");
                  setName(user.name || "");
                  setBio(user.bio || "");
                  setPhone(user.phone || "");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-green-600 text-xs font-semibold text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Tabs */}
      <section className="space-y-3">
        <div className="flex gap-2 border-b border-gray-200 pb-2 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === "active"
                ? "border-b-2 border-green-600 text-green-600 font-semibold dark:text-green-400"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-4 w-4" /> My Active Listings
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("sold")}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === "sold"
                ? "border-b-2 border-green-600 text-green-600 font-semibold dark:text-green-400"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Sold / Traded
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("tradeable")}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === "tradeable"
                ? "border-b-2 border-green-600 text-green-600 font-semibold dark:text-green-400"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Repeat className="h-4 w-4" /> Tradeable Items
            </span>
          </button>
        </div>

        <div className="space-y-3">
          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <ListingCardSkeleton key={idx} />
              ))}
            </div>
          )}

          {!isLoading && displayedListings.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex justify-center text-gray-400 dark:text-slate-500">
                {tab === "active" && <Package className="h-10 w-10" />}
                {tab === "sold" && <CheckCircle2 className="h-10 w-10" />}
                {tab === "tradeable" && <Repeat className="h-10 w-10" />}
              </div>
              <p className="mb-2 text-sm font-medium text-gray-900 dark:text-slate-100">
                {tab === "active" && "No active listings yet"}
                {tab === "sold" && "No sold or traded items yet"}
                {tab === "tradeable" && "No tradeable items. Toggle barter on a listing!"}
              </p>
              {tab === "active" && (
                <Link href="/listings/new">
                  <Button className="mt-4 bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
                    List an Item
                  </Button>
                </Link>
              )}
            </div>
          )}

          {!isLoading && displayedListings.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedListings.map((listing) => (
                <div key={listing._id} className="relative group">
                  <ListingCard listing={listing} />
                  {tab === "active" && (
                    <div className="absolute inset-x-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 border-gray-300 bg-white text-xs text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(listing._id);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 flex-1 bg-gray-600 text-xs text-white hover:bg-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusChange(listing._id, "sold");
                        }}
                      >
                        Sold
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 flex-1 bg-amber-500 text-xs text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusChange(listing._id, "traded");
                        }}
                      >
                        Traded
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 border-red-500 bg-white text-xs text-red-600 hover:bg-red-50 dark:border-red-600 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(listing._id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                  {tab === "sold" && (
                    <div className="absolute right-2 top-2">
                      <Badge
                        className={
                          listing.status === "sold"
                            ? "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }
                      >
                        {listing.status === "sold" ? "Sold" : "Traded"}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

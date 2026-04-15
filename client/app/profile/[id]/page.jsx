"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import api from "@/lib/api";
import ListingCard from "@/components/listings/ListingCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fetcher = (url) => api.get(url).then((res) => res.data);

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params?.id;
  const [copied, setCopied] = useState(false);

  const { data, error, isLoading } = useSWR(
    userId ? `/api/users/${userId}` : null,
    fetcher
  );

  const user = data?.user;
  const listings = data?.listings || [];
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "CB";

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-300">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-600 shadow-sm dark:border-red-800 dark:bg-slate-800 dark:text-red-300">
          Unable to load this profile.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user?.profilePicture?.url || ""} alt={user?.name || "User"} />
              <AvatarFallback className="bg-green-600 text-sm font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                {user.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">{user.email}</p>
              {user.collegeDomain && (
                <Badge className="mt-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  @{user.collegeDomain}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.email && (
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 text-xs text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={async () => {
                  await navigator.clipboard.writeText(user.email);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
              >
                {copied ? "Copied" : "Copy Email"}
              </Button>
            )}
            <Button asChild className="bg-green-600 text-white hover:bg-green-700">
              <Link href={`/dashboard?seller=${user._id}`}>View Seller Listings</Link>
            </Button>
          </div>
        </div>
        {user.bio && (
          <p className="mt-4 text-sm text-gray-700 dark:text-slate-300">{user.bio}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
          Active Listings
        </h2>
        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            No active listings from this user right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

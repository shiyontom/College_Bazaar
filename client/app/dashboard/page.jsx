"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import ListingCard from "@/components/listings/ListingCard";
import ListingCardSkeleton from "@/components/listings/ListingCardSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock3, Repeat, TrendingUp } from "lucide-react";

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

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const fetcher = (url) => api.get(url).then((res) => res.data);

function useListingsQuery() {
  const searchParams = useSearchParams();

  const key = useMemo(() => {
    const params = new URLSearchParams();

    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const categories = searchParams.get("categories") || searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const isTradeable = searchParams.get("barter");
    const page = searchParams.get("page") || "1";
    const seller = searchParams.get("seller");

    if (search) params.set("search", search);
    if (categories) params.set("category", categories);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (isTradeable === "true") params.set("isTradeable", "true");
    if (seller) params.set("seller", seller);
    if (sort) params.set("sort", sort);
    if (page) params.set("page", page);

    // Let backend default status to active if not provided
    const query = params.toString();
    return `/api/listings${query ? `?${query}` : ""}`;
  }, [searchParams]);

  const { data, error, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    data,
    error,
    isLoading,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const { data, error, isLoading } = useListingsQuery();

  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const barterOnly = searchParams.get("barter") === "true";
  const courseTag = searchParams.get("courseTag") || "";
  const page = Number(searchParams.get("page") || "1");
  const categoriesParam =
    searchParams.get("categories") || searchParams.get("category") || "";
  const selectedCategories = categoriesParam
    ? categoriesParam.split(",").filter(Boolean)
    : [];

  const pagination = data?.pagination;
  const listings = data?.listings || [];

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    // Reset to first page when filters change (unless explicitly set)
    if (!("page" in updates)) {
      params.delete("page");
    }

    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  };

  const handleCategoryToggle = (category) => {
    const current = new Set(selectedCategories);
    if (current.has(category)) {
      current.delete(category);
    } else {
      current.add(category);
    }
    const value = Array.from(current).join(",");
    updateParams({ categories: value || null });
  };

  const handleClearFilters = () => {
    updateParams({
      categories: null,
      minPrice: null,
      maxPrice: null,
      sort: "newest",
      barter: null,
      courseTag: null,
    });
  };

  const handlePageChange = (newPage) => {
    if (!pagination) return;
    if (newPage < 1 || newPage > pagination.pages) return;
    updateParams({ page: newPage });
  };


  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Sidebar / Filters */}
      <aside className="w-full space-y-4 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:w-64 md:shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-[#0f172a] dark:text-slate-100">
            Filters
          </h2>
        </div>

        {/* Course Tag Filter */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            Course Tag
          </p>
          <Input
            type="text"
            placeholder="Filter by course e.g. CS-201"
            value={courseTag}
            onChange={(e) => {
              const value = e.target.value.trim().toUpperCase();
              updateParams({ courseTag: value || null });
            }}
              className="h-8 border-gray-300 bg-white text-xs text-gray-900 focus:border-blue-600 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-slate-400"
          />
        </div>

        {/* Barter toggle */}
        <div className={`rounded-lg border-2 border-amber-300 bg-amber-50 p-3 transition ${barterOnly ? "shadow-amber-200 shadow-md" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-700">
                Barter Mode
              </p>
              <p className="mt-0.5 text-[11px] text-amber-600">
                Show only items open to trade
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateParams({ barter: barterOnly ? null : "true" })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                barterOnly ? "bg-amber-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${
                  barterOnly ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Price range */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            Price Range (₹)
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              defaultValue={minPrice}
              onBlur={(e) =>
                updateParams({
                  minPrice: e.target.value ? e.target.value : null,
                })
              }
              className="h-8 border-gray-300 bg-white text-xs text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100"
            />
            <span className="text-xs text-[#64748b]">—</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              defaultValue={maxPrice}
              onBlur={(e) =>
                updateParams({
                  maxPrice: e.target.value ? e.target.value : null,
                })
              }
              className="h-8 border-gray-300 bg-white text-xs text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            Sort By
          </p>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="h-8 w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 w-full border-[#e2e8f0] text-xs text-[#64748b] hover:bg-gray-50"
          onClick={handleClearFilters}
        >
          Clear All Filters
        </Button>
      </aside>

      {/* Main content */}
      <section className="flex-1 space-y-4">
        {/* Listings grid */}
        <div className="space-y-3">
          {isLoading && (
            <>
              {/* Loading: 3 horizontal scrolling sections */}
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4" /> Recently Added
                    </span>
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-64 w-48 shrink-0 animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm dark:border-slate-700 dark:bg-slate-700"
                      >
                        <div className="h-2/3 w-full bg-gray-200 dark:bg-slate-600" />
                        <div className="space-y-2 p-3">
                          <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-600" />
                          <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <span className="inline-flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" /> Trending in CS-201
                    </span>
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-64 w-48 shrink-0 animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm dark:border-slate-700 dark:bg-slate-700"
                      >
                        <div className="h-2/3 w-full bg-gray-200 dark:bg-slate-600" />
                        <div className="space-y-2 p-3">
                          <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-600" />
                          <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <span className="inline-flex items-center gap-1.5">
                      <Repeat className="h-4 w-4" /> Latest Barter Offers
                    </span>
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-64 w-48 shrink-0 animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm dark:border-slate-700 dark:bg-slate-700"
                      >
                        <div className="h-2/3 w-full bg-gray-200 dark:bg-slate-600" />
                        <div className="space-y-2 p-3">
                          <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-600" />
                          <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Loading: Grid skeleton */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <ListingCardSkeleton key={idx} />
                ))}
              </div>
            </>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-[#ef4444]">
                Failed to load listings. Please try again.
              </p>
            </div>
          )}

          {!isLoading && !error && listings.length === 0 && (
            <div className="space-y-6">
              {/* Empty State: 3 horizontal scrolling sections */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#0f172a]">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4" /> Recently Added
                  </span>
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-64 w-48 shrink-0 overflow-hidden rounded-xl border border-[#e2e8f0] bg-gray-50 shadow-sm"
                    >
                      <div className="h-2/3 w-full bg-gray-100 dark:bg-slate-700" />
                      <div className="space-y-2 p-3">
                        <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-slate-700" />
                        <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-slate-700" />
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/listings/new"
                  className="mt-3 flex justify-center"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-green-600 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20"
                  >
                    Be the first to list!
                  </Button>
                </Link>
              </div>
              <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <span className="inline-flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" /> Trending in CS-201
                    </span>
                  </h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-64 w-48 shrink-0 overflow-hidden rounded-xl border border-[#e2e8f0] bg-gray-50 shadow-sm"
                    >
                      <div className="h-2/3 w-full bg-gray-100 dark:bg-slate-700" />
                      <div className="space-y-2 p-3">
                        <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-slate-700" />
                        <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-slate-700" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#0f172a]">
                  <span className="inline-flex items-center gap-1.5">
                    <Repeat className="h-4 w-4" /> Latest Barter Offers
                  </span>
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-64 w-48 shrink-0 overflow-hidden rounded-xl border border-[#e2e8f0] bg-gray-50 shadow-sm"
                    >
                      <div className="h-2/3 w-full bg-gray-100 dark:bg-slate-700" />
                      <div className="space-y-2 p-3">
                        <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-slate-700" />
                        <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-slate-700" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && listings.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3 text-xs text-[#64748b]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="border-[#e2e8f0] text-xs text-[#0f172a] hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <span className="text-[11px]">
                    Page {page} of {pagination.pages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.pages}
                    onClick={() => handlePageChange(page + 1)}
                    className="border-[#e2e8f0] text-xs text-[#0f172a] hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

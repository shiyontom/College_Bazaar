"use client";

import Link from "next/link";
import { Repeat } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(days) > 7) {
    return date.toLocaleDateString();
  }
  if (Math.abs(days) >= 1) return rtf.format(days, "day");
  if (Math.abs(hours) >= 1) return rtf.format(hours, "hour");
  if (Math.abs(minutes) >= 1) return rtf.format(minutes, "minute");
  return rtf.format(seconds, "second");
}

export default function ListingCard({ listing }) {
  const {
    _id,
    title,
    price,
    category,
    images = [],
    isTradeable,
    seller,
    createdAt,
    courseTags = [],
  } = listing || {};

  const mainImage = images[0]?.url;
  const isFree = price === 0;

  const displayPrice = (() => {
    if (isFree && isTradeable) return "Trade Only";
    if (isFree) return "FREE";
    if (typeof price === "number") return `₹${price.toLocaleString()}`;
    return "-";
  })();

  const sellerName = seller?.name || "Unknown seller";
  const collegeDomain = seller?.collegeDomain
    ? `@${seller.collegeDomain}`
    : "";
  const initials =
    sellerName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "CB";

  return (
    <Link
      href={`/listings/${_id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="relative overflow-hidden">
        <div className="aspect-[4/3] w-full overflow-hidden bg-[#f1f5f9] dark:bg-slate-700">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[#64748b] dark:text-slate-400">
              No image
            </div>
          )}
        </div>

        {isTradeable && (
          <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#f59e0b] px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
            <Repeat className="h-3 w-3" />
            Open to Trade
          </div>
        )}

        {isFree && !isTradeable && (
          <div className="absolute right-2 top-2 rounded-full bg-[#16a34a] px-2.5 py-1 text-[11px] font-semibold text-white shadow">
            FREE
          </div>
        )}

        {category && (
          <div className="pointer-events-none absolute bottom-2 left-2">
            <Badge className="bg-gray-100 text-[10px] font-medium text-gray-700 dark:bg-slate-700 dark:text-slate-300">
              {category}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-[#0f172a] dark:text-slate-100">
            {title}
          </h3>
          <div className="shrink-0 text-right text-xs font-semibold text-[#16a34a] dark:text-green-400">
            {displayPrice}
          </div>
        </div>

        {courseTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {courseTags.slice(0, 3).map((tag, idx) => (
              <Badge
                key={idx}
                className="bg-blue-100 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {tag}
              </Badge>
            ))}
            {courseTags.length > 3 && (
              <Badge className="bg-blue-100 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                +{courseTags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={seller?.profilePicture?.url || ""}
                alt={sellerName}
              />
              <AvatarFallback className="bg-[#16a34a] text-[10px] font-semibold text-white dark:bg-green-600">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#0f172a] dark:text-slate-100">
                {sellerName}
              </p>
              {collegeDomain && (
                <p className="truncate text-[10px] text-[#64748b] dark:text-slate-400">
                  {collegeDomain}
                </p>
              )}
            </div>
          </div>

          <p className="shrink-0 text-[10px] text-[#64748b] dark:text-slate-400">
            {formatRelativeTime(createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

"use client";

export default function ListingCardSkeleton() {
  return (
    <div className="h-64 animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="h-2/3 w-full bg-gray-100 dark:bg-slate-700" />
      <div className="space-y-2 p-3.5">
        <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-slate-700" />
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gray-100 dark:bg-slate-700" />
          <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

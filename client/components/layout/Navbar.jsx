"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { Search, ChevronDown, LogOut, User, Package, Settings, Menu, X, Sun, Moon, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CATEGORIES = [
  { name: "All" },
  { name: "Textbooks" },
  { name: "Electronics" },
  { name: "Stationery" },
  { name: "Clothing" },
  { name: "Furniture" },
  { name: "Sports" },
  { name: "Musical Instruments" },
  { name: "Other" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname?.startsWith("/auth") || pathname === undefined;

  // Hide navbar on auth pages
  if (isAuthPage) {
    return null;
  }

  useEffect(() => {
    const searchValue = searchParams?.get("search") || "";
    setSearch(searchValue);
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = search.trim();
    const params = new URLSearchParams();
    if (pathname === "/dashboard" && searchParams) {
      for (const [key, value] of searchParams.entries()) {
        params.set(key, value);
      }
    }

    if (!query) {
      params.delete("search");
    } else {
      params.set("search", query);
    }

    params.delete("page");
    const queryString = params.toString();
    router.push(`/dashboard${queryString ? `?${queryString}` : ""}`);
  };

  const handleCategoryClick = (categoryName) => {
    if (categoryName === "All") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard?category=${encodeURIComponent(categoryName)}`);
    }
  };

  const currentCategory = searchParams?.get("category") || "All";
  const collegeDomain = user?.collegeDomain || "nsut.ac.in";

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "CB";

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md dark:bg-slate-900 dark:border-b dark:border-slate-700">
      {/* Row 1: Top Bar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Left: Logo + Brand */}
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-white rounded-md p-1 dark:bg-transparent">
              <Image
                src="/logo.png"
                alt="CollegeBazaar"
                width={36}
                height={36}
                className="h-9 w-9 dark:invert"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-green-700">
                CollegeBazaar
              </span>
              <span className="text-xs text-green-600 bg-green-50 rounded-full px-2 py-0.5 w-fit">
                @{collegeDomain}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden flex-1 justify-center md:flex"
        >
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for books, electronics, furniture..."
              className="h-12 w-full rounded-full border border-gray-300 bg-white pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
        </form>

        {/* Right: Auth Buttons / User Menu */}
        <div className="flex shrink-0 items-center gap-2">
          {!user ? (
            <>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex"
                >
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  size="sm"
                  className="bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Register
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/listings/new">
                <Button
                  size="sm"
                  className="rounded-full bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 sm:px-5"
                >
                  <PlusCircle className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Sell Item</span>
                </Button>
              </Link>
              {/* Dark Mode Toggle */}
              {mounted && (
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  aria-label="Toggle dark mode"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              )}
              {/* Desktop: Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 hover:bg-gray-50 sm:flex">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.profilePicture?.url || ""}
                        alt={user?.name || "User"}
                      />
                      <AvatarFallback className="bg-green-600 text-xs font-semibold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700">
                  <DropdownMenuLabel className="pointer-events-none">
                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {user?.name || "User"}
                    </div>
                    <div className="truncate text-xs font-normal text-gray-500 dark:text-slate-400">
                      {user?.email}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    My Listings
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin")}
                      className="cursor-pointer text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-sm text-red-600 focus:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Mobile: Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 sm:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-600" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Category Bar */}
      <div className="hidden border-b border-gray-200 bg-gray-100 dark:border-slate-700 dark:bg-slate-800 sm:flex">
        <div className="mx-auto flex h-10 max-w-7xl items-center gap-2 overflow-x-auto px-4">
          {CATEGORIES.map((category) => {
            const isActive = currentCategory === category.name;
            return (
              <button
                key={category.name}
                type="button"
                onClick={() => handleCategoryClick(category.name)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "border-green-600 bg-green-600 text-white dark:bg-green-600 dark:text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-green-500 hover:text-green-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-green-500 dark:hover:text-green-400"
                }`}
              >
                {category.emoji && <span className="mr-1">{category.emoji}</span>}
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: Search Bar (shown below top bar on mobile) */}
      <div className="border-b border-gray-200 bg-white md:hidden">
        <form onSubmit={handleSearchSubmit} className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for books, electronics, furniture..."
              className="h-10 w-full rounded-full border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </form>
      </div>

      {/* Mobile: User Menu Dropdown */}
      {user && mobileMenuOpen && (
        <div className="border-b border-gray-200 bg-white sm:hidden">
          <div className="px-4 py-3">
            <div className="mb-3 flex items-center gap-3 border-b border-gray-200 pb-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user?.profilePicture?.url || ""}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="bg-green-600 text-sm font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  router.push("/profile");
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                My Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push("/dashboard");
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <Package className="h-4 w-4" />
                My Listings
              </button>
              {user?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => {
                    router.push("/admin");
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </button>
              )}
              <div className="border-t border-gray-200 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

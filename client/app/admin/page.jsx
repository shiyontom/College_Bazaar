"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

const fetcher = (url) => api.get(url).then((res) => res.data);

function AdminContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [usersPagination, setUsersPagination] = useState(null);
  const [listingsPagination, setListingsPagination] = useState(null);
  const [usersPage, setUsersPage] = useState(1);
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsStatusFilter, setListingsStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
    if (!authLoading && user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchStats();
      if (activeTab === "users") {
        fetchUsers();
      } else {
        fetchListings();
      }
    }
  }, [user, activeTab, usersPage, listingsPage, listingsStatusFilter]);

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/admin/stats");
      setStats(res.data.stats);
    } catch (err) {
      console.error("Failed to fetch stats", err);
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/api/admin/users?page=${usersPage}&limit=20`);
      setUsers(res.data.users);
      setUsersPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch users", err);
      toast.error("Failed to load users");
    }
  };

  const fetchListings = async () => {
    try {
      const url = `/api/admin/listings?page=${listingsPage}&limit=20${listingsStatusFilter ? `&status=${listingsStatusFilter}` : ""}`;
      const res = await api.get(url);
      setListings(res.data.listings);
      setListingsPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch listings", err);
      toast.error("Failed to load listings");
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to toggle role", err);
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/api/admin/listings/${listingId}`);
      toast.success("Listing deleted");
      fetchListings();
    } catch (err) {
      console.error("Failed to delete listing", err);
      toast.error("Failed to delete listing");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  if (loading || !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage users and listings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border-l-4 border-blue-600 border-gray-200 bg-white p-4 shadow-sm dark:border-blue-500 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
        </div>
        <div className="rounded-xl border-l-4 border-green-600 border-gray-200 bg-white p-4 shadow-sm dark:border-green-500 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Listings</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalListings}</p>
        </div>
        <div className="rounded-xl border-l-4 border-green-600 border-gray-200 bg-white p-4 shadow-sm dark:border-green-500 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Active Listings</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeListings}</p>
        </div>
        <div className="rounded-xl border-l-4 border-amber-500 border-gray-200 bg-white p-4 shadow-sm dark:border-amber-600 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Barter Listings</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.tradeableListings}</p>
        </div>
        <div className="rounded-xl border-l-4 border-purple-600 border-gray-200 bg-white p-4 shadow-sm dark:border-purple-500 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">New Users (Week)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.newUsersThisWeek}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm font-medium transition ${activeTab === "users"
            ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
        >
          Users
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("listings")}
          className={`px-4 py-2 text-sm font-medium transition ${activeTab === "listings"
            ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
        >
          Listings
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Domain</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Joined</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr
                    key={u._id}
                    className={`border-t border-gray-200 dark:border-slate-700 ${idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-gray-50 dark:bg-slate-900"}`}
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.collegeDomain || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          u.role === "admin"
                            ? "bg-blue-600 text-white dark:bg-blue-500"
                            : "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300"
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleToggleRole(u._id, u.role)}
                      >
                        {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {usersPagination && usersPagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 px-4 py-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Page {usersPagination.page} of {usersPagination.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={usersPage <= 1}
                  onClick={() => setUsersPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={usersPage >= usersPagination.pages}
                  onClick={() => setUsersPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Listings Tab */}
      {activeTab === "listings" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-900 dark:text-gray-100">Filter by Status:</label>
            <select
              value={listingsStatusFilter}
              onChange={(e) => {
                setListingsStatusFilter(e.target.value);
                setListingsPage(1);
              }}
              className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 focus:border-blue-600 focus:ring-blue-600 dark:focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="traded">Traded</option>
              <option value="removed">Removed</option>
            </select>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Title</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Seller</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Price</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Category</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Barter</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Posted</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing, idx) => (
                    <tr
                      key={listing._id}
                      className={`border-t border-gray-200 dark:border-slate-700 ${idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-gray-50 dark:bg-slate-900"}`}
                    >
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{listing.title}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {listing.seller?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        {listing.price === 0 ? "FREE" : `₹${listing.price}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{listing.category}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            listing.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : listing.status === "sold"
                                ? "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400"
                                : listing.status === "traded"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300"
                          }
                        >
                          {listing.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {listing.isTradeable ? (
                          <Badge className="bg-amber-500 text-white dark:bg-amber-600">Yes</Badge>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => handleDeleteListing(listing._id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {listingsPagination && listingsPagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 px-4 py-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Page {listingsPagination.page} of {listingsPagination.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={listingsPage <= 1}
                    onClick={() => setListingsPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={listingsPage >= listingsPagination.pages}
                    onClick={() => setListingsPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminContent />
    </ProtectedRoute>
  );
}

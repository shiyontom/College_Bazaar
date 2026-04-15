"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Mail, MessageCircle, Repeat, Send } from "lucide-react";
import useSWR from "swr";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "react-hot-toast";

const fetcher = (url) => api.get(url).then((res) => res.data);

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
  if (Math.abs(days) > 7) return date.toLocaleDateString();
  if (Math.abs(days) >= 1) return rtf.format(days, "day");
  if (Math.abs(hours) >= 1) return rtf.format(hours, "hour");
  if (Math.abs(minutes) >= 1) return rtf.format(minutes, "minute");
  return rtf.format(seconds, "second");
}

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { user } = useAuth();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/listings/${id}` : null,
    fetcher
  );

  const listing = data?.listing;
  const isOwner = user && listing && user.id && listing.seller?._id === user.id;
  const images = listing?.images || [];
  const activeImage = images[activeImageIdx]?.url || images[0]?.url;
  const isFree = listing?.price === 0;

  const displayPrice = (() => {
    if (isFree && listing?.isTradeable) return "Trade Only";
    if (isFree) return "FREE";
    if (typeof listing?.price === "number") return `₹${listing.price.toLocaleString()}`;
    return "-";
  })();

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Copied!");
      setTimeout(() => setCopyMessage(""), 1500);
    } catch {
      setCopyMessage("Unable to copy");
      setTimeout(() => setCopyMessage(""), 1500);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await api.patch(`/api/listings/${listing._id}/status`, { status });
      mutate();
      toast.success(status === "sold" ? "Marked as sold." : "Marked as traded.");
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Failed to update status.");
    }
  };

  const loadChat = useCallback(async () => {
    if (!id) return;
    try {
      setChatLoading(true);
      const res = await api.get(`/api/chats/listing/${id}`);
      setChatData(res.data?.chat || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load chat.");
    } finally {
      setChatLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!showChatModal) return;
    loadChat();
    const timer = setInterval(loadChat, 5000);
    return () => clearInterval(timer);
  }, [showChatModal, id, loadChat]);

  const handleSendMessage = async () => {
    const message = chatMessage.trim();
    if (!message) return;
    try {
      setSendingMessage(true);
      const res = await api.post(`/api/chats/listing/${id}/messages`, {
        content: message,
      });
      setChatData(res.data?.chat || null);
      setChatMessage("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="h-64 animate-pulse rounded-lg bg-[#f1f5f9]" />
          <div className="space-y-2">
            <div className="h-4 w-2/3 rounded bg-[#f1f5f9]" />
            <div className="h-3 w-1/3 rounded bg-[#f1f5f9]" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-sm text-[#ef4444] shadow-sm">
          Failed to load listing. It may have been removed or does not exist.
        </div>
      </main>
    );
  }

  const seller = listing.seller || {};
  const sellerName = seller.name || "Unknown seller";
  const sellerEmail = seller.email;
  const sellerPhone = seller.phone;
  const collegeDomain = seller.collegeDomain ? `@${seller.collegeDomain}` : "";
  const initials =
    sellerName.split(" ").map((n) => n[0]).join("").toUpperCase() || "CB";

  const defaultTradeMessage = `Hi ${sellerName.split(" ")[0] || ""}, I saw your "${listing.title}" listing on CollegeBazaar and would like to propose a trade. Here are the items I can offer in exchange:`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row">

        {/* Images */}
        <div className="flex-1 space-y-3">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-slate-700">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-500 dark:text-slate-400">
                  No images available
                </div>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.publicId || idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${idx === activeImageIdx
                    ? "border-green-600 dark:border-green-500"
                    : "border-gray-200 hover:border-gray-300 dark:border-slate-600 dark:hover:border-slate-500"
                    }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-slate-100">Description</h2>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">{listing.description}</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full space-y-4 lg:w-80">
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{listing.title}</h1>
              <Badge className="bg-gray-100 text-[11px] font-medium text-gray-700 dark:bg-slate-700 dark:text-slate-300">
                {listing.category}
              </Badge>
            </div>

            <p className="text-xl font-semibold text-green-600 dark:text-green-400">{displayPrice}</p>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
              <span>Posted {formatRelativeTime(listing.createdAt)}</span>
              <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />
              <span>{listing.views ?? 0} views</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                className={`text-[10px] font-medium ${listing.status === "active"
                  ? "bg-green-100 text-green-700"
                  : listing.status === "sold"
                    ? "bg-gray-100 text-gray-500"
                    : listing.status === "traded"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
              >
                {listing.status.toUpperCase()}
              </Badge>
              {listing.isTradeable && (
                <Badge className="bg-[#f59e0b] text-[10px] font-bold text-white">
                  Open to Trade
                </Badge>
              )}
            </div>
          </div>

          {/* Trade preferences box */}
          {listing.isTradeable && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/20">
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
                <Repeat className="h-3.5 w-3.5" /> Open to Trade
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {listing.tradePreferences || "Seller is open to reasonable barter offers."}
              </p>
            </div>
          )}

          {/* Seller card */}
          <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={seller?.profilePicture?.url || ""} alt={sellerName} />
                <AvatarFallback className="bg-green-600 text-xs font-semibold text-white dark:bg-green-500">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{sellerName}</p>
                {collegeDomain && (
                  <p className="text-[11px] text-gray-600 dark:text-slate-400">{collegeDomain}</p>
                )}
              </div>
            </div>
            {seller.bio && (
              <p className="text-xs text-gray-600 dark:text-slate-400">{seller.bio}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full border-gray-300 text-[11px] text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-100 dark:hover:bg-slate-700"
              asChild
            >
              <Link href={`/profile/${seller?._id}`}>View Profile</Link>
            </Button>
          </div>

          {/* Actions */}
          {!isOwner ? (
            <div className="space-y-2">
              <Button
                type="button"
                className="h-9 w-full bg-green-600 text-sm font-semibold text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                onClick={() => setShowContactModal(true)}
              >
                <MessageCircle className="mr-1 h-4 w-4" /> Contact Seller
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full border-blue-500 bg-white text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                onClick={() => setShowChatModal(true)}
              >
                <MessageCircle className="mr-1 h-4 w-4" /> Message in App
              </Button>
              {listing.isTradeable && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full border-amber-500 bg-white text-sm font-semibold text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
                  onClick={() => setShowTradeModal(true)}
                >
                  <Repeat className="mr-1 h-4 w-4" /> Propose a Trade
                </Button>
              )}
              {copyMessage && (
                <p className="text-center text-[11px] text-[#16a34a]">{copyMessage}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Link href={`/listings/${listing._id}/edit`}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Edit Listing
                </Button>
              </Link>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 bg-gray-600 text-xs font-semibold text-white hover:bg-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                  onClick={() => handleStatusUpdate("sold")}
                >
                  Mark as Sold
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 bg-amber-500 text-xs font-semibold text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                  onClick={() => handleStatusUpdate("traded")}
                >
                  Mark as Traded
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Seller Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-slate-100"><MessageCircle className="h-4 w-4" /> Contact Seller</h2>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-slate-400">
              Choose how you&apos;d like to contact the seller.
            </p>

            <div className="mt-4 space-y-2">
              <Button
                type="button"
                className="h-9 w-full bg-[#25D366] text-xs font-semibold text-white hover:bg-[#20BA5A]"
                onClick={() => {
                  if (!sellerPhone) {
                    toast.error("Seller has not added a WhatsApp number yet.");
                    return;
                  }
                  const normalizedPhone = String(sellerPhone).replace(/\D/g, "");
                  const whatsappMessage = encodeURIComponent(
                    `Hi! I found your listing "${listing.title}" on CollegeBazaar. Is it still available?`
                  );
                  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${whatsappMessage}`;
                  window.open(whatsappUrl, '_blank');
                }}
              >
                Chat on WhatsApp
              </Button>
              <p className="text-[10px] text-[#64748b] text-center">
                Share your WhatsApp number with the seller first
              </p>

              <Button
                type="button"
                className="h-9 w-full bg-[#2563eb] text-xs font-semibold text-white hover:bg-[#1d4ed8]"
                onClick={() => {
                  const emailSubject = encodeURIComponent(`CollegeBazaar: Interested in "${listing.title}"`);
                  const emailBody = encodeURIComponent(
                    `Hi ${sellerName},\n\nI found your listing "${listing.title}" on CollegeBazaar priced at ${displayPrice}.\n\nI'm interested! Can we meet on campus?\n\nRegards`
                  );
                  const mailtoUrl = `mailto:${sellerEmail}?subject=${emailSubject}&body=${emailBody}`;
                  window.open(mailtoUrl, '_blank');
                }}
                disabled={!sellerEmail}
              >
                <Mail className="mr-1 h-4 w-4" /> Send Email
              </Button>

              <button
                type="button"
                onClick={() => handleCopy(sellerEmail)}
                disabled={!sellerEmail}
                className="w-full text-[10px] text-green-600 hover:text-green-700 underline dark:text-green-400 dark:hover:text-green-300"
              >
                Copy Email Address
              </button>
            </div>

            <p className="mt-3 text-[11px] text-gray-600 dark:text-slate-400">
              Safety tip: Always meet in public areas on campus.
            </p>
          </div>
        </div>
      )}

      {/* Trade Proposal Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400"><Repeat className="h-4 w-4" /> Propose a Trade</h2>
              <button
                type="button"
                onClick={() => setShowTradeModal(false)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-slate-400">
              Draft a message to send to the seller about your trade offer.
            </p>
            <textarea
              className="mt-3 h-28 w-full rounded-lg border border-gray-300 bg-white p-2 text-xs text-gray-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              defaultValue={defaultTradeMessage}
            />
            <Button
              type="button"
              className="mt-3 h-8 w-full bg-amber-500 text-xs font-semibold text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
              onClick={() => handleCopy(defaultTradeMessage)}
            >
              Copy Proposal Text
            </Button>
            <p className="mt-2 text-[11px] text-gray-600 dark:text-slate-400">
              Paste this into your email when you contact the seller.
            </p>
          </div>
        </div>
      )}

      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                <MessageCircle className="h-4 w-4" /> Chat with Seller
              </h2>
              <button
                type="button"
                onClick={() => setShowChatModal(false)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                Close
              </button>
            </div>
            <div className="mt-3 h-72 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900">
              {chatLoading && <p className="text-xs text-gray-500 dark:text-slate-400">Loading messages...</p>}
              {!chatLoading && (!chatData?.messages || chatData.messages.length === 0) && (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Start the conversation with the seller.
                </p>
              )}
              {chatData?.messages?.map((msg) => {
                const mine = msg.sender?._id === user?.id;
                return (
                  <div
                    key={msg._id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${mine
                      ? "ml-auto bg-green-600 text-white"
                      : "bg-white text-gray-800 dark:bg-slate-700 dark:text-slate-100"
                      }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-green-100" : "text-gray-500 dark:text-slate-400"}`}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="h-9 flex-1 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <Button
                type="button"
                className="h-9 bg-green-600 text-white hover:bg-green-700"
                onClick={handleSendMessage}
                disabled={sendingMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

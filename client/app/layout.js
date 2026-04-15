export const dynamic = "force-dynamic";

import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "CollegeBazaar",
  description: "The campus marketplace for NSUT students",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased dark:bg-slate-900 dark:text-slate-100`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 pb-8 pt-6">
              {children}
            </main>
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on login & setup pages to keep focused experience
  if (pathname === "/login" || pathname === "/profile/setup") {
    return null;
  }

  const isFeed = pathname === "/";
  const isReport = pathname.startsWith("/report/new");
  const isProfile = pathname.startsWith("/profile");

  return (
    <nav
      aria-label="Mobile Navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around shadow-lg transition-colors duration-150"
    >
      {/* Feed */}
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
          isFeed
            ? "text-blue-600 dark:text-blue-400 font-semibold"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={isFeed ? 2.2 : 1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <span className="text-[11px] leading-none">Feed</span>
      </Link>

      {/* Primary Action: Report Flooding */}
      <Link
        href="/report/new"
        className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all -mt-3 border border-blue-600 dark:border-blue-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Report</span>
      </Link>

      {/* Profile */}
      <Link
        href="/profile"
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
          isProfile
            ? "text-blue-600 dark:text-blue-400 font-semibold"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={isProfile ? 2.2 : 1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="text-[11px] leading-none">Profile</span>
      </Link>
    </nav>
  );
}

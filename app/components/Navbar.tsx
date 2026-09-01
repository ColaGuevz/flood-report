import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  profile: {
    display_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export default function Navbar({ profile }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-[#0b1120]/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center text-xl shadow-md shadow-blue-500/25 group-hover:scale-105 group-hover:shadow-blue-500/40 transition-all duration-200">
            🌧️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                FloodWatch
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
              Community Flood Intelligence
            </p>
          </div>
        </Link>

        {/* User profile, ThemeToggle & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Profile link */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition-all group focus:outline-none"
            title="View your profile"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-blue-500/20 group-hover:ring-blue-500/60 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center overflow-hidden shrink-0 transition-all shadow-xs">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                  {profile.display_name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-tight transition-colors">
                {profile.display_name}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">
                @{profile.username}
              </p>
            </div>
          </Link>

          {/* Sign Out */}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 bg-slate-100/80 hover:bg-red-50 dark:bg-slate-800/80 dark:hover:bg-red-950/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-red-200 dark:hover:border-red-800/50 transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
              title="Sign Out"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";

interface NavbarProps {
  profile: {
    display_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export default function Navbar({ profile }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/85 border-b border-slate-200/80 transition-all">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 flex items-center justify-center text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            🌧️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                FloodWatch
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Community Flood Intelligence
            </p>
          </div>
        </Link>

        {/* User profile & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 pl-2 group focus:outline-none"
            title="View your profile"
          >
            <div className="w-9 h-9 rounded-full ring-2 ring-blue-500/20 group-hover:ring-blue-500/50 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 transition-all">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-blue-600">
                  {profile.display_name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 leading-tight transition-colors">
                {profile.display_name}
              </p>
              <p className="text-[11px] text-slate-500">
                @{profile.username}
              </p>
            </div>
          </Link>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-100/80 hover:bg-red-50 rounded-lg border border-slate-200/60 hover:border-red-200 transition-all cursor-pointer"
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
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

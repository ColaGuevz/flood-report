import Link from "next/link";
import Navbar from "@/app/components/Navbar";

export default function ReportNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] flex flex-col font-sans transition-colors duration-200">
      <Navbar profile={null} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center justify-center text-center">
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-8 sm:p-12 w-full space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
            ⚠️
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Flood Report Not Found
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              This report may have been resolved and removed, deleted by the author, or the link might be incorrect.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all"
            >
              <span>View Live Reports</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>

            <Link
              href="/report/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold px-5 py-3 rounded-2xl transition-colors border border-slate-200/80 dark:border-slate-700"
            >
              <span>+ Report Flooding</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b1120] py-6 text-center text-xs text-slate-400 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4">
          <p>© {new Date().getFullYear()} FloodWatch — Community Crowdsourced Safety Network</p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useToast } from "./Toast";

interface ShareReportSectionProps {
  reportId: string | number;
  location: string;
  description?: string;
  className?: string;
}

export default function ShareReportSection({
  reportId,
  location,
  description = "",
  className = "",
}: ShareReportSectionProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [canonicalUrl, setCanonicalUrl] = useState(`/report/${reportId}`);
  const { toast } = useToast();

  useEffect(() => {
    // Resolve absolute canonical URL on client
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}/report/${reportId}`;
      setCanonicalUrl(fullUrl);
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        setCanNativeShare(true);
      }
    }
  }, [reportId]);

  const shareTitle = `Flood Alert: ${location} | FloodWatch`;
  const shareText = description
    ? `⚠️ Flood Alert at ${location}: "${description.slice(0, 100)}${
        description.length > 100 ? "..." : ""
      }" — Check live road conditions on FloodWatch:`
    : `⚠️ Live Flood Alert at ${location} — Check live road conditions and status on FloodWatch:`;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(canonicalUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = canonicalUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast({
        type: "success",
        title: "Link Copied",
        message: "Public report link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
      toast({
        type: "error",
        title: "Copy Failed",
        message: "Could not copy URL to clipboard.",
      });
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) {
      handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: canonicalUrl,
      });
      toast({
        type: "success",
        title: "Shared Successfully",
        message: "Flood alert shared.",
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        handleCopyLink();
      }
    }
  };

  const encodedUrl = encodeURIComponent(canonicalUrl);
  const encodedText = encodeURIComponent(shareText);

  const socialLinks = [
    {
      name: "X (Twitter)",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: "Facebook",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "WhatsApp",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.124.553 4.197 1.603 6.015L.062 24l6.13-1.609a11.97 11.97 0 0 0 5.839 1.512h.005c6.645 0 12.029-5.387 12.029-12.032C24.065 5.385 18.676 0 12.031 0zm-.005 21.873a9.88 9.88 0 0 1-5.04-1.381l-.362-.215-3.741.981.998-3.647-.235-.375a9.87 9.87 0 0 1-1.513-5.205c0-5.46 4.442-9.902 9.904-9.902 5.461 0 9.903 4.442 9.903 9.902-.001 5.46-4.444 9.902-9.907 9.902z" />
        </svg>
      ),
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    },
    {
      name: "Telegram",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.939z" />
        </svg>
      ),
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
  ];

  return (
    <div
      className={`bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3.5 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Broadcast & Share Alert
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Share this verified flood hazard with local residents & motorists.
          </p>
        </div>

        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>Share</span>
          </button>
        )}
      </div>

      {/* URL Bar & Copy Link Action */}
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 rounded-xl p-1.5 border border-slate-200 dark:border-slate-700/80">
        <div className="flex-1 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 font-mono truncate select-all">
          {canonicalUrl}
        </div>
        <button
          type="button"
          onClick={handleCopyLink}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
            copied
              ? "bg-emerald-600 text-white"
              : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500"
          }`}
          title="Copy report link"
        >
          {copied ? (
            <>
              <span className="text-xs">✓</span>
              <span>Copied!</span>
            </>
          ) : (
            <>
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Social Share Links */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Share via:
        </span>
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title={`Share on ${social.name}`}
          >
            {social.icon}
            <span>{social.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

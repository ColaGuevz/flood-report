"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfileSetup() {
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        const supabase = createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setError("You are not logged in.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.from("profiles").insert({
            id: user.id,
            username: username.toLowerCase(),
            display_name: displayName,
            avatar_url: user.user_metadata?.avatar_url || null,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push("/");
    };

    return (
        <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
            <div className="w-full max-w-md">

                <div className="bg-white rounded-2xl shadow-lg p-8">

                    <div className="text-center">

                        <div className="text-5xl mb-4">
                            🌧️
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900">
                            Complete Your Profile
                        </h1>

                        <p className="mt-2 text-slate-500">
                            Just a few details before you get started.
                        </p>

                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Display Name
                            </label>

                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                                required
                                className="w-full rounded-lg border border-slate-300
                           px-4 py-3 outline-none
                           focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Username
                            </label>

                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. marcelo123"
                                required
                                className="w-full rounded-lg border border-slate-300
                           px-4 py-3 outline-none
                           focus:ring-2 focus:ring-blue-500"
                            />

                            <p className="mt-1 text-xs text-slate-400">
                                This will be your public username.
                            </p>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-600
                         py-3 font-medium text-white
                         hover:bg-blue-700
                         disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Continue"}
                        </button>

                    </form>

                </div>

            </div>
        </main>
    );
}
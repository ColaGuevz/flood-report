"use client";

import { createClient } from "@/lib/supabase/client";

export default function Login() {
    const handleGoogleLogin = async () => {
        const supabase = createClient();

        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
            <div className="w-full max-w-md">

                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">

                    <div className="text-5xl mb-4">
                        🌧️
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900">
                        FloodWatch
                    </h1>

                    <p className="mt-3 text-slate-600">
                        Share flood conditions in your area
                        and help keep your community informed.
                    </p>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full mt-8 bg-white border border-slate-300
                       rounded-lg py-3 px-4 font-medium
                       text-slate-700 hover:bg-slate-50
                       transition cursor-pointer"
                    >
                        Continue with Google
                    </button>

                    <p className="mt-6 text-xs text-slate-400">
                        Community reports are user-submitted.
                    </p>

                </div>

            </div>
        </main>
    );
}
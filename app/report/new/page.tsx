"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewReport() {
    const router = useRouter();

    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        if (!image) {
            setError("Please upload an image.");
            setLoading(false);
            return;
        }

        const supabase = createClient();

        // Get the logged-in user
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setError("You must be logged in.");
            setLoading(false);
            return;
        }

        // Create a unique filename
        const fileExtension = image.name.split(".").pop();

        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExtension}`;

        // Upload image
        const { error: uploadError } = await supabase.storage
            .from("post-images")
            .upload(fileName, image);

        if (uploadError) {
            setError(uploadError.message);
            setLoading(false);
            return;
        }

        // Get public image URL
        const {
            data: { publicUrl },
        } = supabase.storage
            .from("post-images")
            .getPublicUrl(fileName);

        // Create post
        const { error: postError } = await supabase
            .from("posts")
            .insert({
                user_id: user.id,
                location,
                description,
                image_url: publicUrl,
            });

        if (postError) {
            setError(postError.message);
            setLoading(false);
            return;
        }

        // Go back home
        router.push("/");
    };

    return (
        <main className="min-h-screen bg-slate-100 py-12 px-6">
            <div className="max-w-xl mx-auto">

                <div className="bg-white rounded-2xl shadow-sm p-8">

                    <h1 className="text-2xl font-bold text-slate-900">
                        Create Flood Report
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Share what is happening in your area.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Location
                            </label>

                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Brgy. San Jose, Malolos, Bulacan"
                                required
                                className="w-full rounded-lg border border-slate-300
                           px-4 py-3 outline-none
                           focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                What's happening?
                            </label>

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the flooding..."
                                rows={5}
                                required
                                className="w-full rounded-lg border border-slate-300
                           px-4 py-3 outline-none resize-none
                           focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Image */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Flood Photo
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setImage(e.target.files?.[0] || null)
                                }
                                required
                                className="w-full rounded-lg border border-slate-300
                           px-4 py-3"
                            />

                            <p className="mt-2 text-xs text-slate-400">
                                Please upload a photo showing the flood conditions.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white rounded-lg
                         py-3 font-medium hover:bg-blue-700
                         transition disabled:opacity-50"
                        >
                            {loading ? "Posting..." : "Post Flood Report"}
                        </button>

                    </form>

                </div>

            </div>
        </main>
    );
}
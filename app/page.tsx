import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, send user to login
  if (!user) {
    redirect("/login");
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist, send user to profile setup
  if (!profile) {
    redirect("/profile/setup");
  }

  // Get flood reports
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
    *,
    profiles (
      username,
      display_name,
      avatar_url
    )
  `)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-100">

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">

          <h1 className="text-xl font-bold text-slate-900">
            🌧️ FloodWatch
          </h1>

          <div className="flex items-center gap-3">

            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-9 h-9 rounded-full"
              />
            )}

            <span className="text-sm font-medium text-slate-700">
              {profile.display_name}
            </span>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-slate-500 hover:text-red-600 transition"
              >
                Sign Out
              </button>
            </form>

          </div>

        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Welcome section */}
        <div className="mb-8">

          <h2 className="text-2xl font-bold text-slate-900">
            Welcome, {profile.display_name}! 👋
          </h2>

          <p className="mt-2 text-slate-600">
            See the latest flood reports from the community.
          </p>

          <a
            href="/report/new"
            className="inline-block mt-5 bg-blue-600 text-white
                       rounded-lg px-5 py-3 font-medium
                       hover:bg-blue-700 transition"
          >
            + Create Flood Report
          </a>

        </div>

        {/* Flood reports */}
        <div className="space-y-6">

          {error && (
            <div className="bg-red-50 text-red-600 rounded-lg p-4">
              Unable to load flood reports.
            </div>
          )}

          {!error && posts?.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">

              <div className="text-4xl mb-3">
                🌧️
              </div>

              <h3 className="font-semibold text-slate-900">
                No flood reports yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Be the first person to report flooding in your area.
              </p>

            </div>
          )}

          {posts?.map((post) => (

            <article
              key={post.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
            >

              {/* Post header */}
              <div className="p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-full bg-slate-200
                  flex items-center justify-center
                  overflow-hidden">

                    {post.profiles?.avatar_url ? (
                      <img
                        src={post.profiles.avatar_url}
                        alt={post.profiles.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">
                        👤
                      </span>
                    )}

                  </div>

                  <div>

                    <p className="font-semibold text-slate-900">
                      {post.profiles?.display_name || "Community Member"}
                    </p>

                    <p className="text-xs text-slate-500">
                      @{post.profiles?.username || "user"}
                      {" · "}
                      {new Date(post.created_at).toLocaleString()}
                    </p>

                  </div>

                </div>

                {/* Location */}
                <div className="mt-4">

                  <p className="text-sm font-medium text-slate-700">
                    📍 {post.location}
                  </p>

                </div>

                {/* Description */}
                <p className="mt-3 text-slate-700 whitespace-pre-wrap">
                  {post.description}
                </p>

              </div>

              {/* Flood image */}
              <img
                src={post.image_url}
                alt={`Flood report at ${post.location}`}
                className="w-full max-h-[600px] object-cover"
              />

            </article>

          ))}

        </div>

      </div>

    </main>
  );
}
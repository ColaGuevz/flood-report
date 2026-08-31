import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FeedList, { FeedPost } from "@/app/components/FeedList";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }),
  }),
}));

describe("FeedList Component Integration", () => {
  const MOCK_POSTS: FeedPost[] = [
    {
      id: "post-1",
      user_id: "user-current",
      location: "San Jose, Malolos, Bulacan",
      description: "Waist high flood water",
      image_url: "/flood1.jpg",
      severity: "critical",
      status: "active",
      created_at: new Date().toISOString(),
      profiles: {
        username: "juandc",
        display_name: "Juan Dela Cruz",
        avatar_url: null,
      },
    },
    {
      id: "post-2",
      user_id: "user-other",
      location: "Guiguinto, Bulacan",
      description: "Knee deep water near highway",
      image_url: "/flood2.jpg",
      severity: "moderate",
      status: "active",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      profiles: {
        username: "mariap",
        display_name: "Maria Santos",
        avatar_url: "/maria.jpg",
      },
    },
    {
      id: "post-3",
      user_id: "user-other",
      location: "Calumpit, Bulacan",
      description: "Roads cleared, flood subsided",
      image_url: "/flood3.jpg",
      severity: "minor",
      status: "resolved",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      profiles: {
        username: "pedro",
        display_name: "Pedro Penduko",
        avatar_url: null,
      },
    },
  ];

  it("renders all posts with locations, badges, and timestamps", () => {
    render(<FeedList posts={MOCK_POSTS} currentUserId="user-current" />);

    expect(screen.getByText("San Jose, Malolos, Bulacan")).toBeInTheDocument();
    expect(screen.getByText("Guiguinto, Bulacan")).toBeInTheDocument();
    expect(screen.getByText("Calumpit, Bulacan")).toBeInTheDocument();

    // Verify badges
    expect(screen.getByText("Critical / Impassable")).toBeInTheDocument();
    expect(screen.getAllByText(/Flooding Active/i)).toHaveLength(2);
    expect(screen.getByText(/Flooding Resolved/i)).toBeInTheDocument();
  });

  it("shows Edit, Delete, and Status toggle controls only on owner posts", () => {
    render(<FeedList posts={MOCK_POSTS} currentUserId="user-current" />);

    // Current user has 'You' badge on their post
    expect(screen.getByText("You")).toBeInTheDocument();

    // Current user is owner of post-1 (which is active)
    expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute(
      "href",
      "/report/edit/post-1"
    );
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark as resolved/i })).toBeInTheDocument();

    // Only 1 edit button rendered because only 1 post belongs to user-current
    expect(screen.getAllByRole("link", { name: /edit/i })).toHaveLength(1);
  });

  it("filters feed when user types in location search input", () => {
    render(<FeedList posts={MOCK_POSTS} currentUserId="user-current" />);

    const searchInput = screen.getByPlaceholderText(/search location/i);
    fireEvent.change(searchInput, { target: { value: "Malolos" } });

    expect(screen.getByText("San Jose, Malolos, Bulacan")).toBeInTheDocument();
    expect(screen.queryByText("Guiguinto, Bulacan")).not.toBeInTheDocument();
    expect(screen.queryByText("Calumpit, Bulacan")).not.toBeInTheDocument();
  });

  it("filters feed when severity button is clicked", () => {
    render(<FeedList posts={MOCK_POSTS} currentUserId="user-current" />);

    const minorBtn = screen.getByRole("button", { name: /minor/i });
    fireEvent.click(minorBtn);

    expect(screen.getByText("Calumpit, Bulacan")).toBeInTheDocument();
    expect(screen.queryByText("San Jose, Malolos, Bulacan")).not.toBeInTheDocument();
  });

  it("filters feed when status button is clicked", () => {
    render(<FeedList posts={MOCK_POSTS} currentUserId="user-current" />);

    const resolvedFilterBtn = screen.getByRole("button", { name: /🟢\s*Resolved/i });
    fireEvent.click(resolvedFilterBtn);

    expect(screen.getByText("Calumpit, Bulacan")).toBeInTheDocument();
    expect(screen.queryByText("San Jose, Malolos, Bulacan")).not.toBeInTheDocument();
    expect(screen.queryByText("Guiguinto, Bulacan")).not.toBeInTheDocument();
  });

  it("shows empty search state and allows clearing filters", () => {
    render(<FeedList posts={MOCK_POSTS} currentUserId="user-current" />);

    const searchInput = screen.getByPlaceholderText(/search location/i);
    fireEvent.change(searchInput, { target: { value: "NonExistentCity" } });

    expect(screen.getByText("No flood reports match your search")).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: /clear filters/i });
    fireEvent.click(clearBtn);

    expect(screen.getByText("San Jose, Malolos, Bulacan")).toBeInTheDocument();
    expect(screen.getByText("Guiguinto, Bulacan")).toBeInTheDocument();
  });
});

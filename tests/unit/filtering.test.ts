import { describe, it, expect } from "vitest";
import { FeedPost } from "@/app/components/FeedList";

// Pure filtering function matching the logic used in FeedList
function filterPosts(
  posts: FeedPost[],
  options: {
    searchQuery?: string;
    selectedSeverity?: string;
    selectedStatus?: string;
  }
): FeedPost[] {
  const {
    searchQuery = "",
    selectedSeverity = "all",
    selectedStatus = "all",
  } = options;

  return posts.filter((post) => {
    // Status filter
    if (selectedStatus !== "all") {
      const postStatus = post.status || "active";
      if (postStatus !== selectedStatus) return false;
    }

    // Severity filter
    if (selectedSeverity !== "all") {
      const postSeverity = post.severity || "moderate";
      if (postSeverity !== selectedSeverity) return false;
    }

    // Location search (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const locationText = (post.location || "").toLowerCase();
      if (!locationText.includes(query)) return false;
    }

    return true;
  });
}

describe("Feed Filtering Logic", () => {
  const MOCK_POSTS: FeedPost[] = [
    {
      id: "1",
      user_id: "user-1",
      location: "Brgy. San Jose, Malolos, Bulacan",
      description: "Waist deep flooding near church",
      image_url: "/img1.jpg",
      severity: "critical",
      status: "active",
      created_at: "2026-08-31T10:00:00Z",
    },
    {
      id: "2",
      user_id: "user-2",
      location: "Guiguinto, Bulacan",
      description: "Ankle deep water on main road",
      image_url: "/img2.jpg",
      severity: "minor",
      status: "active",
      created_at: "2026-08-31T09:00:00Z",
    },
    {
      id: "3",
      user_id: "user-1",
      location: "Malolos Crossing, Bulacan",
      description: "Water has fully drained",
      image_url: "/img3.jpg",
      severity: "moderate",
      status: "resolved",
      created_at: "2026-08-30T10:00:00Z",
    },
    {
      id: "4",
      user_id: "user-3",
      location: "Calumpit, Bulacan",
      description: "Severe flooding near riverbank",
      image_url: "/img4.jpg",
      severity: "severe",
      status: "active",
      created_at: "2026-08-29T08:00:00Z",
    },
  ];

  it("returns all posts when no filters are applied", () => {
    const results = filterPosts(MOCK_POSTS, {});
    expect(results).toHaveLength(4);
  });

  describe("Location Search", () => {
    it("matches exact location text", () => {
      const results = filterPosts(MOCK_POSTS, { searchQuery: "Guiguinto, Bulacan" });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("2");
    });

    it("matches partial location text (case-insensitive)", () => {
      const resultsLower = filterPosts(MOCK_POSTS, { searchQuery: "malolos" });
      expect(resultsLower).toHaveLength(2);
      expect(resultsLower.map((r) => r.id)).toEqual(["1", "3"]);

      const resultsUpper = filterPosts(MOCK_POSTS, { searchQuery: "MALOLOS" });
      expect(resultsUpper).toHaveLength(2);
    });

    it("ignores surrounding whitespace in search query", () => {
      const results = filterPosts(MOCK_POSTS, { searchQuery: "  calumpit  " });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("4");
    });

    it("returns empty array when search query has no match", () => {
      const results = filterPosts(MOCK_POSTS, { searchQuery: "Manila" });
      expect(results).toHaveLength(0);
    });
  });

  describe("Severity Filter", () => {
    it("filters by minor severity", () => {
      const results = filterPosts(MOCK_POSTS, { selectedSeverity: "minor" });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("2");
    });

    it("filters by critical severity", () => {
      const results = filterPosts(MOCK_POSTS, { selectedSeverity: "critical" });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });

    it("defaults undefined severity to moderate for backward compatibility", () => {
      const postsWithMissingSeverity: FeedPost[] = [
        {
          id: "legacy",
          user_id: "user-1",
          location: "Hagonoy",
          description: "Legacy report",
          image_url: "",
          severity: null,
          status: "active",
          created_at: "2026-08-30T00:00:00Z",
        },
      ];
      const results = filterPosts(postsWithMissingSeverity, { selectedSeverity: "moderate" });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("legacy");
    });
  });

  describe("Status Filter", () => {
    it("filters by active status", () => {
      const results = filterPosts(MOCK_POSTS, { selectedStatus: "active" });
      expect(results).toHaveLength(3);
      expect(results.map((r) => r.id)).toEqual(["1", "2", "4"]);
    });

    it("filters by resolved status", () => {
      const results = filterPosts(MOCK_POSTS, { selectedStatus: "resolved" });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("3");
    });
  });

  describe("Combined Multi-condition Filters", () => {
    it("combines location search and severity filter", () => {
      // Malolos + critical => post 1 only
      const results = filterPosts(MOCK_POSTS, {
        searchQuery: "Malolos",
        selectedSeverity: "critical",
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });

    it("combines location search and status filter", () => {
      // Malolos + resolved => post 3 only
      const results = filterPosts(MOCK_POSTS, {
        searchQuery: "Malolos",
        selectedStatus: "resolved",
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("3");
    });

    it("combines severity filter and status filter", () => {
      // moderate + resolved => post 3 only
      const results = filterPosts(MOCK_POSTS, {
        selectedSeverity: "moderate",
        selectedStatus: "resolved",
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("3");
    });

    it("combines all three: location + severity + status", () => {
      // Malolos + critical + active => post 1
      const match = filterPosts(MOCK_POSTS, {
        searchQuery: "Malolos",
        selectedSeverity: "critical",
        selectedStatus: "active",
      });
      expect(match).toHaveLength(1);
      expect(match[0].id).toBe("1");

      // Malolos + critical + resolved => none
      const noMatch = filterPosts(MOCK_POSTS, {
        searchQuery: "Malolos",
        selectedSeverity: "critical",
        selectedStatus: "resolved",
      });
      expect(noMatch).toHaveLength(0);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SeverityBadge from "@/app/components/SeverityBadge";
import StatusBadge from "@/app/components/StatusBadge";
import RecentBadge from "@/app/components/RecentBadge";
import Navbar from "@/app/components/Navbar";
import DeletePostButton from "@/app/components/DeletePostButton";
import ToggleStatusButton from "@/app/components/ToggleStatusButton";
import EditProfileModal from "@/app/components/EditProfileModal";

// Mock Supabase client
const mockDelete = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
});

const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      delete: mockDelete,
      update: mockUpdate,
    }),
  }),
}));

describe("UI Components Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SeverityBadge Component", () => {
    it("renders Minor severity badge with accessible label and emoji", () => {
      render(<SeverityBadge severity="minor" />);
      expect(screen.getByText("🟢")).toBeInTheDocument();
      expect(screen.getByText("Minor")).toBeInTheDocument();
    });

    it("renders Critical severity badge with accessible label and emoji", () => {
      render(<SeverityBadge severity="critical" />);
      expect(screen.getByText("🔴")).toBeInTheDocument();
      expect(screen.getByText("Critical / Impassable")).toBeInTheDocument();
    });

    it("falls back gracefully when severity is null", () => {
      render(<SeverityBadge severity={null} />);
      expect(screen.getByText("🟡")).toBeInTheDocument();
      expect(screen.getByText("Moderate")).toBeInTheDocument();
    });
  });

  describe("StatusBadge Component", () => {
    it("renders Flooding Active status badge", () => {
      render(<StatusBadge status="active" />);
      expect(screen.getByText("🔴")).toBeInTheDocument();
      expect(screen.getByText(/Flooding Active/i)).toBeInTheDocument();
    });

    it("renders Flooding Resolved status badge", () => {
      render(<StatusBadge status="resolved" />);
      expect(screen.getByText("🟢")).toBeInTheDocument();
      expect(screen.getByText(/Flooding Resolved/i)).toBeInTheDocument();
    });

    it("defaults to Flooding Active when status is undefined", () => {
      render(<StatusBadge status={undefined} />);
      expect(screen.getByText(/Flooding Active/i)).toBeInTheDocument();
    });
  });

  describe("RecentBadge Component", () => {
    it("renders RECENT indicator with title tooltip", () => {
      render(<RecentBadge />);
      const badge = screen.getByText("RECENT");
      expect(badge).toBeInTheDocument();
      expect(badge.closest("span")).toHaveAttribute("title", "Posted within the last 24 hours");
    });
  });

  describe("Navbar Component", () => {
    const mockProfile = {
      display_name: "Juan Dela Cruz",
      username: "juandc",
      avatar_url: "https://example.com/avatar.jpg",
    };

    it("renders brand, LIVE indicator, user name, and link to profile", () => {
      render(<Navbar profile={mockProfile} />);
      expect(screen.getByText("FloodWatch")).toBeInTheDocument();
      expect(screen.getByText("LIVE")).toBeInTheDocument();
      expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
      expect(screen.getByText("@juandc")).toBeInTheDocument();

      const profileLink = screen.getByTitle("View your profile");
      expect(profileLink).toHaveAttribute("href", "/profile");
    });

    it("renders avatar fallback when avatar_url is null", () => {
      render(
        <Navbar
          profile={{
            display_name: "Maria Santos",
            username: "maria",
            avatar_url: null,
          }}
        />
      );
      expect(screen.getByText("M")).toBeInTheDocument();
    });

    it("contains sign out form and button", () => {
      render(<Navbar profile={mockProfile} />);
      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
      expect(signOutButton.closest("form")).toHaveAttribute("action", "/auth/signout");
    });
  });

  describe("DeletePostButton Component", () => {
    it("opens confirmation modal when delete button is clicked", () => {
      render(<DeletePostButton postId="post-1" userId="user-1" />);
      const deleteBtn = screen.getByRole("button", { name: /delete/i });
      fireEvent.click(deleteBtn);

      expect(screen.getByText("Delete Flood Report?")).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete this report/i)).toBeInTheDocument();
    });

    it("closes modal on cancel", () => {
      render(<DeletePostButton postId="post-1" userId="user-1" />);
      fireEvent.click(screen.getByRole("button", { name: /delete/i }));
      expect(screen.getByText("Delete Flood Report?")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.queryByText("Delete Flood Report?")).not.toBeInTheDocument();
    });

    it("executes delete and closes modal on confirmation", async () => {
      render(<DeletePostButton postId="post-1" userId="user-1" />);
      fireEvent.click(screen.getByRole("button", { name: /delete/i }));

      const confirmDeleteBtn = screen.getByRole("button", { name: /delete report/i });
      fireEvent.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalled();
        expect(screen.queryByText("Delete Flood Report?")).not.toBeInTheDocument();
      });
    });
  });

  describe("ToggleStatusButton Component", () => {
    it("renders 'Mark as Resolved' for active status", () => {
      render(
        <ToggleStatusButton
          postId="post-1"
          currentStatus="active"
          userId="user-1"
        />
      );
      expect(screen.getByRole("button", { name: /mark as resolved/i })).toBeInTheDocument();
    });

    it("renders 'Mark as Active' for resolved status", () => {
      render(
        <ToggleStatusButton
          postId="post-1"
          currentStatus="resolved"
          userId="user-1"
        />
      );
      expect(screen.getByRole("button", { name: /mark as active/i })).toBeInTheDocument();
    });

    it("calls Supabase update with toggled status on click", async () => {
      const onStatusChange = vi.fn();
      render(
        <ToggleStatusButton
          postId="post-1"
          currentStatus="active"
          userId="user-1"
          onStatusChange={onStatusChange}
        />
      );

      const button = screen.getByRole("button", { name: /mark as resolved/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ status: "resolved" });
        expect(onStatusChange).toHaveBeenCalledWith("resolved");
      });
    });
  });

  describe("EditProfileModal Component", () => {
    it("renders Edit Profile button and opens modal on click when eligible", () => {
      render(
        <EditProfileModal
          initialProfile={{
            id: "user-1",
            username: "juandc",
            display_name: "Juan Dela Cruz",
            profile_last_updated_at: null,
          }}
        />
      );

      const editBtn = screen.getByRole("button", { name: /edit profile/i });
      expect(editBtn).toBeInTheDocument();

      fireEvent.click(editBtn);

      expect(screen.getByRole("heading", { name: /edit profile/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toHaveValue("Juan Dela Cruz");
      expect(screen.getByLabelText(/username/i)).toHaveValue("juandc");
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    it("displays locked status and cooldown message when under 60-day restriction", () => {
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
      render(
        <EditProfileModal
          initialProfile={{
            id: "user-1",
            username: "juandc",
            display_name: "Juan Dela Cruz",
            profile_last_updated_at: twentyDaysAgo,
          }}
        />
      );

      const editBtn = screen.getByRole("button", { name: /edit profile/i });
      fireEvent.click(editBtn);

      expect(screen.getByText(/profile editing locked/i)).toBeInTheDocument();
      expect(screen.getByText(/you can change your profile again in 40 days/i)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /understood/i })).toBeInTheDocument();
    });
  });
});

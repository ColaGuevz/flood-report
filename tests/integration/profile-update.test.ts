import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProfile } from "@/app/profile/actions";

let mockUser: { id: string } | null = { id: "user-123" };
let mockCurrentProfile: any = {
  id: "user-123",
  username: "juandc",
  display_name: "Juan Dela Cruz",
  profile_last_updated_at: null,
};
let mockExistingOtherUser: any = null;
let updatedPayload: any = null;
let updateEqCalls: [string, any][] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(() => ({
    auth: {
      getUser: vi.fn().mockImplementation(() =>
        Promise.resolve({
          data: { user: mockUser },
          error: mockUser ? null : { message: "No session" },
        })
      ),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockImplementation((cols: string) => ({
            eq: vi.fn().mockImplementation((col: string, val: any) => {
              if (col === "id") {
                return {
                  single: vi.fn().mockResolvedValue({
                    data: mockCurrentProfile,
                    error: mockCurrentProfile ? null : { message: "Not found" },
                  }),
                };
              }
              if (col === "username") {
                return {
                  neq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: mockExistingOtherUser,
                      error: null,
                    }),
                  }),
                };
              }
              return {
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              };
            }),
          })),
          update: vi.fn().mockImplementation((payload: any) => {
            updatedPayload = payload;
            return {
              eq: vi.fn().mockImplementation((col: string, val: any) => {
                updateEqCalls.push([col, val]);
                return Promise.resolve({ error: null });
              }),
            };
          }),
        };
      }
      return {};
    }),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Profile Update Server Action Integration", () => {
  beforeEach(() => {
    mockUser = { id: "user-123" };
    mockCurrentProfile = {
      id: "user-123",
      username: "juandc",
      display_name: "Juan Dela Cruz",
      profile_last_updated_at: null,
    };
    mockExistingOtherUser = null;
    updatedPayload = null;
    updateEqCalls = [];
  });

  it("fails if user is not authenticated", async () => {
    mockUser = null;
    const res = await updateProfile({
      displayName: "New Name",
      username: "newuser",
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/signed in/i);
  });

  it("rejects empty display name", async () => {
    const res = await updateProfile({
      displayName: "   ",
      username: "newuser",
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Display name cannot be empty/i);
  });

  it("rejects username with invalid characters or too short", async () => {
    const resShort = await updateProfile({
      displayName: "Valid Name",
      username: "ab",
    });
    expect(resShort.success).toBe(false);
    expect(resShort.error).toMatch(/at least 3 characters/i);
  });

  it("enforces 60-day cooldown server-side if user changed profile 20 days ago", async () => {
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    mockCurrentProfile.profile_last_updated_at = twentyDaysAgo;

    const res = await updateProfile({
      displayName: "New Name",
      username: "newusername",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe("You can change your profile again in 40 days.");
    expect(res.daysRemaining).toBe(40);
    expect(updatedPayload).toBeNull();
  });

  it("rejects duplicate username if another user already has it", async () => {
    mockExistingOtherUser = { id: "user-456" };

    const res = await updateProfile({
      displayName: "Juan Dela Cruz",
      username: "takenusername",
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/already taken/i);
    expect(updatedPayload).toBeNull();
  });

  it("successfully updates profile and records profile_last_updated_at timestamp", async () => {
    const res = await updateProfile({
      displayName: "Juan Updated",
      username: "juan_updated",
    });

    expect(res.success).toBe(true);
    expect(updatedPayload).not.toBeNull();
    expect(updatedPayload.display_name).toBe("Juan Updated");
    expect(updatedPayload.username).toBe("juan_updated");
    expect(updatedPayload.profile_last_updated_at).toBeDefined();

    // Verify user cannot update another user's profile
    expect(updateEqCalls).toEqual([["id", "user-123"]]);
  });
});

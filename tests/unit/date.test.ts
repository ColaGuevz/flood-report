import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { formatRelativeTime, isRecent, getProfileCooldownInfo } from "@/lib/date";

describe("Date Utilities - formatRelativeTime", () => {
  const MOCK_NOW = new Date("2026-08-31T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty string for null or empty input", () => {
    expect(formatRelativeTime("")).toBe("");
    expect(formatRelativeTime(null as any)).toBe("");
    expect(formatRelativeTime(undefined as any)).toBe("");
  });

  it("handles 'Just now' for timestamps less than 60 seconds ago", () => {
    const tenSecondsAgo = new Date("2026-08-31T11:59:50.000Z");
    expect(formatRelativeTime(tenSecondsAgo)).toBe("Just now");

    const rightNow = new Date("2026-08-31T12:00:00.000Z");
    expect(formatRelativeTime(rightNow)).toBe("Just now");
  });

  it("handles minor clock skew in the future as 'Just now'", () => {
    const tenSecondsInFuture = new Date("2026-08-31T12:00:10.000Z");
    expect(formatRelativeTime(tenSecondsInFuture)).toBe("Just now");
  });

  it("handles singular and plural minutes", () => {
    const oneMinAgo = new Date("2026-08-31T11:59:00.000Z");
    expect(formatRelativeTime(oneMinAgo)).toBe("1 minute ago");

    const fiveMinsAgo = new Date("2026-08-31T11:55:00.000Z");
    expect(formatRelativeTime(fiveMinsAgo)).toBe("5 minutes ago");

    const fiftyNineMinsAgo = new Date("2026-08-31T11:01:00.000Z");
    expect(formatRelativeTime(fiftyNineMinsAgo)).toBe("59 minutes ago");
  });

  it("handles singular and plural hours", () => {
    const oneHourAgo = new Date("2026-08-31T11:00:00.000Z");
    expect(formatRelativeTime(oneHourAgo)).toBe("1 hour ago");

    const threeHoursAgo = new Date("2026-08-31T09:00:00.000Z");
    expect(formatRelativeTime(threeHoursAgo)).toBe("3 hours ago");

    const twentyThreeHoursAgo = new Date("2026-08-30T13:00:00.000Z");
    expect(formatRelativeTime(twentyThreeHoursAgo)).toBe("23 hours ago");
  });

  it("handles 'Yesterday' for exactly 1 day difference (24-48 hours)", () => {
    const yesterday = new Date("2026-08-30T11:00:00.000Z");
    expect(formatRelativeTime(yesterday)).toBe("Yesterday");
  });

  it("handles days ago (2 to 6 days)", () => {
    const twoDaysAgo = new Date("2026-08-29T11:00:00.000Z");
    expect(formatRelativeTime(twoDaysAgo)).toBe("2 days ago");

    const sixDaysAgo = new Date("2026-08-25T11:00:00.000Z");
    expect(formatRelativeTime(sixDaysAgo)).toBe("6 days ago");
  });

  it("handles older dates beyond 7 days with locale format", () => {
    const tenDaysAgoSameYear = new Date("2026-08-20T12:00:00.000Z");
    const result = formatRelativeTime(tenDaysAgoSameYear);
    expect(result).toMatch(/Aug 20/);

    const lastYear = new Date("2025-05-15T12:00:00.000Z");
    const resultLastYear = formatRelativeTime(lastYear);
    expect(resultLastYear).toMatch(/2025/);
  });
});

describe("Date Utilities - isRecent", () => {
  const MOCK_NOW = new Date("2026-08-31T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for null or empty input", () => {
    expect(isRecent("")).toBe(false);
    expect(isRecent(null as any)).toBe(false);
    expect(isRecent(undefined as any)).toBe(false);
  });

  it("returns true for timestamps within 24 hours", () => {
    const fiveMinutesAgo = new Date("2026-08-31T11:55:00.000Z");
    expect(isRecent(fiveMinutesAgo)).toBe(true);

    const twentyHoursAgo = new Date("2026-08-30T16:00:00.000Z");
    expect(isRecent(twentyHoursAgo)).toBe(true);

    const exactly24HoursAgo = new Date("2026-08-30T12:00:00.000Z");
    expect(isRecent(exactly24HoursAgo)).toBe(true);
  });

  it("returns false for timestamps older than 24 hours", () => {
    const twentyFiveHoursAgo = new Date("2026-08-30T11:00:00.000Z");
    expect(isRecent(twentyFiveHoursAgo)).toBe(false);

    const twoDaysAgo = new Date("2026-08-29T12:00:00.000Z");
    expect(isRecent(twoDaysAgo)).toBe(false);
  });

  it("supports custom threshold hours", () => {
    const threeHoursAgo = new Date("2026-08-31T09:00:00.000Z");
    expect(isRecent(threeHoursAgo, 2)).toBe(false);
    expect(isRecent(threeHoursAgo, 4)).toBe(true);
  });
});

describe("Date Utilities - getProfileCooldownInfo", () => {
  const MOCK_NOW = new Date("2026-08-31T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows editing immediately for null or undefined lastUpdatedAt", () => {
    const res = getProfileCooldownInfo(null);
    expect(res.canEdit).toBe(true);
    expect(res.daysRemaining).toBe(0);
    expect(res.nextEligibleDate).toBeNull();
  });

  it("allows editing when last update was 60 or more days ago", () => {
    const sixtyDaysAgo = new Date("2026-07-02T12:00:00.000Z");
    const res = getProfileCooldownInfo(sixtyDaysAgo);
    expect(res.canEdit).toBe(true);
    expect(res.daysRemaining).toBe(0);
  });

  it("calculates correct days remaining and message when within 60 days", () => {
    // 17 days ago -> 43 days remaining
    const seventeenDaysAgo = new Date("2026-08-14T12:00:00.000Z");
    const res = getProfileCooldownInfo(seventeenDaysAgo);
    expect(res.canEdit).toBe(false);
    expect(res.daysRemaining).toBe(43);
    expect(res.message).toBe("You can change your profile again in 43 days.");
  });
});


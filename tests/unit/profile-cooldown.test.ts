import { describe, it, expect } from "vitest";
import { getProfileCooldownInfo } from "@/lib/date";

describe("Profile Edit 60-Day Cooldown Unit Tests", () => {
  it("allows editing immediately if user has never changed their profile before (null or undefined)", () => {
    const infoNull = getProfileCooldownInfo(null);
    expect(infoNull.canEdit).toBe(true);
    expect(infoNull.daysRemaining).toBe(0);
    expect(infoNull.nextEligibleDate).toBeNull();

    const infoUndefined = getProfileCooldownInfo(undefined);
    expect(infoUndefined.canEdit).toBe(true);
    expect(infoUndefined.daysRemaining).toBe(0);
    expect(infoUndefined.nextEligibleDate).toBeNull();
  });

  it("allows editing if last update was 60 or more days ago", () => {
    const sixtyOneDaysAgo = new Date(Date.now() - 61 * 24 * 60 * 60 * 1000).toISOString();
    const info = getProfileCooldownInfo(sixtyOneDaysAgo);

    expect(info.canEdit).toBe(true);
    expect(info.daysRemaining).toBe(0);
  });

  it("calculates correct remaining days (e.g. 43 days remaining when updated 17 days ago)", () => {
    const seventeenDaysAgo = new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString();
    const info = getProfileCooldownInfo(seventventeenDaysAgo() ?? seventeenDaysAgo);

    expect(info.canEdit).toBe(false);
    expect(info.daysRemaining).toBe(43);
    expect(info.message).toBe("You can change your profile again in 43 days.");
    expect(info.nextEligibleDate).toBeInstanceOf(Date);
  });

  it("formats singular '1 day' when 1 day is remaining", () => {
    const fiftyNineDaysAgo = new Date(Date.now() - 59.2 * 24 * 60 * 60 * 1000).toISOString();
    const info = getProfileCooldownInfo(fiftyNineDaysAgo);

    expect(info.canEdit).toBe(false);
    expect(info.daysRemaining).toBe(1);
    expect(info.message).toBe("You can change your profile again in 1 day.");
  });

  it("calculates 60 days remaining when just updated minutes ago", () => {
    const justNow = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const info = getProfileCooldownInfo(justNow);

    expect(info.canEdit).toBe(false);
    expect(info.daysRemaining).toBe(60);
    expect(info.message).toBe("You can change your profile again in 60 days.");
  });
});

function seventventeenDaysAgo() {
  return new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString();
}

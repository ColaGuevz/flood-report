import { describe, it, expect } from "vitest";
import { getStatusConfig, ReportStatus } from "@/app/components/StatusBadge";

describe("Status Badge Config", () => {
  it("returns correct configuration for active status", () => {
    const config = getStatusConfig("active");
    expect(config.emoji).toBe("🔴");
    expect(config.label).toBe("Flooding Active");
    expect(config.text).toContain("text-rose-700");
  });

  it("returns correct configuration for resolved status", () => {
    const config = getStatusConfig("resolved");
    expect(config.emoji).toBe("🟢");
    expect(config.label).toBe("Flooding Resolved");
    expect(config.text).toContain("text-emerald-700");
  });

  it("defaults to active when status is null, undefined, or unknown", () => {
    expect(getStatusConfig(null).label).toBe("Flooding Active");
    expect(getStatusConfig(undefined).label).toBe("Flooding Active");
    expect(getStatusConfig("unknown" as ReportStatus).label).toBe("Flooding Active");
  });
});

import { describe, it, expect } from "vitest";
import { getSeverityConfig, Severity } from "@/app/components/SeverityBadge";

describe("Severity Badge Config", () => {
  it("returns correct configuration for minor severity", () => {
    const config = getSeverityConfig("minor");
    expect(config.emoji).toBe("🟢");
    expect(config.label).toBe("Minor");
    expect(config.text).toContain("text-green-800");
  });

  it("returns correct configuration for moderate severity", () => {
    const config = getSeverityConfig("moderate");
    expect(config.emoji).toBe("🟡");
    expect(config.label).toBe("Moderate");
    expect(config.text).toContain("text-yellow-800");
  });

  it("returns correct configuration for severe severity", () => {
    const config = getSeverityConfig("severe");
    expect(config.emoji).toBe("🟠");
    expect(config.label).toBe("Severe");
    expect(config.text).toContain("text-orange-800");
  });

  it("returns correct configuration for critical severity", () => {
    const config = getSeverityConfig("critical");
    expect(config.emoji).toBe("🔴");
    expect(config.label).toBe("Critical / Impassable");
    expect(config.text).toContain("text-red-800");
  });

  it("falls back to moderate when severity is null or unknown", () => {
    const nullConfig = getSeverityConfig(null);
    expect(nullConfig.label).toBe("Moderate");

    const unknownConfig = getSeverityConfig("unknown_value" as Severity);
    expect(unknownConfig.label).toBe("Moderate");
  });
});

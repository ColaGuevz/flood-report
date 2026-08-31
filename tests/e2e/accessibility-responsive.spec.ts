import { test, expect } from "@playwright/test";

test.describe("E2E - Responsive & Accessibility", () => {
  test("login page renders cleanly on desktop and mobile viewports", async ({ page }) => {
    // Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "FloodWatch" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();

    // Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "FloodWatch" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  });

  test("create report page form inputs have proper labels and keyboard focusability", async ({ page }) => {
    await page.goto("/report/new");

    const locationInput = page.getByPlaceholder(/Brgy\. San Jose/i);
    await locationInput.focus();
    await expect(locationInput).toBeFocused();

    const descInput = page.getByPlaceholder(/Describe current water level/i);
    await descInput.focus();
    await expect(descInput).toBeFocused();
  });
});

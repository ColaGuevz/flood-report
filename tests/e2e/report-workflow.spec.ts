import { test, expect } from "@playwright/test";

test.describe("E2E Group 3 & 9 - Create & Edit Report Workflow", () => {
  test("create flood report form displays all required inputs, severity options, and dropzone", async ({ page }) => {
    await page.goto("/report/new");

    // Header and navigation
    await expect(page.getByRole("heading", { name: "Create Flood Report" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to Feed/i })).toBeVisible();

    // Required inputs
    const locationInput = page.getByPlaceholder(/Brgy\. San Jose/i);
    await expect(locationInput).toBeVisible();
    await expect(locationInput).toHaveAttribute("required", "");

    const descInput = page.getByPlaceholder(/Describe current water level/i);
    await expect(descInput).toBeVisible();
    await expect(descInput).toHaveAttribute("required", "");

    // 4 Severity options
    await expect(page.getByText("Minor", { exact: true })).toBeVisible();
    await expect(page.getByText("Moderate", { exact: true })).toBeVisible();
    await expect(page.getByText("Severe", { exact: true })).toBeVisible();
    await expect(page.getByText("Critical / Impassable", { exact: true })).toBeVisible();

    // Image upload area
    await expect(page.getByText(/Click to upload photo/i)).toBeVisible();

    // Submit and cancel buttons
    await expect(page.getByRole("button", { name: /Post Flood Report/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Cancel/i })).toBeVisible();
  });
});

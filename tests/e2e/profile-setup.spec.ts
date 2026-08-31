import { test, expect } from "@playwright/test";

test.describe("E2E Group 2 - Profile Setup Page", () => {
  test("profile setup page displays form fields, helper text, and submit button", async ({ page }) => {
    await page.goto("/profile/setup");

    // Headings
    await expect(page.getByRole("heading", { name: "Complete Your Profile" })).toBeVisible();

    // Inputs with labels
    await expect(page.getByLabel(/Display Name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Juan dela Cruz/i)).toBeVisible();

    await expect(page.getByLabel(/Username/i)).toBeVisible();
    await expect(page.getByText("Letters, numbers, and underscores only.")).toBeVisible();

    // Submit button
    const submitBtn = page.getByRole("button", { name: /Complete Setup/i });
    await expect(submitBtn).toBeVisible();
  });
});

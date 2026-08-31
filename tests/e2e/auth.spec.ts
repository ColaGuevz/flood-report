import { test, expect } from "@playwright/test";

test.describe("E2E Group 1 - Authentication & Protected Routes", () => {
  test("unauthenticated visitor to / is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated visitor to /profile is redirected to /login", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders all brand elements, highlights, and Google button", async ({ page }) => {
    await page.goto("/login");

    // Brand and title
    await expect(page.getByRole("heading", { name: "FloodWatch" })).toBeVisible();
    await expect(page.getByText("Community Safety Network")).toBeVisible();

    // Community benefits list
    await expect(page.getByText(/Live community-reported flood levels/i)).toBeVisible();
    await expect(page.getByText(/Exact locations and verified photos/i)).toBeVisible();
    await expect(page.getByText(/Help your neighbors stay safe & informed/i)).toBeVisible();

    // Google login button
    const googleButton = page.getByRole("button", { name: /Continue with Google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();

    // Privacy disclaimer
    await expect(
      page.getByText(/By signing in, you agree to submit helpful and accurate flood reports/i)
    ).toBeVisible();
  });
});

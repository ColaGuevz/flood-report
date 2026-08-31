import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock Next.js navigation
export const mockPush = vi.fn();
export const mockRefresh = vi.fn();
export const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
    prefetch: vi.fn(),
  }),
  useParams: () => ({ id: "test-post-123" }),
  usePathname: () => "/",
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
if (typeof window !== "undefined") {
  window.URL.createObjectURL = vi.fn(() => "blob:http://localhost:3000/mock-image");
  window.URL.revokeObjectURL = vi.fn();
}

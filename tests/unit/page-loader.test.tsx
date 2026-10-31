// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageLoader } from "@/components/ui/PageLoader";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("gsap", () => ({ default: {
  set: vi.fn(), to: vi.fn(() => ({ kill: vi.fn() })),
  timeline: vi.fn(() => { const tl = { to: vi.fn(() => tl), add: vi.fn(() => tl), kill: vi.fn() }; return tl; }),
} }));

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  route.pathname = "/";
  document.documentElement.className = "";
  window.matchMedia = vi.fn((query: string) => ({ matches: query.includes("max-width"), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("page loader lifecycle", () => {
  it("shows on a first mobile visit and releases the page if animation stalls", async () => {
    render(<PageLoader />);
    expect(screen.queryByRole("status")).not.toBeNull();
    expect(document.documentElement.classList.contains("page-loader-active")).toBe(true);
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.documentElement.classList.contains("page-loader-active")).toBe(false);
    expect(sessionStorage.getItem("portfolio-loaded")).toBe("1");
  });
  it("does not replay after the first visit", () => {
    sessionStorage.setItem("portfolio-loaded", "1");
    render(<PageLoader />);
    expect(screen.queryByRole("status")).toBeNull();
  });
  it("respects reduced motion", () => {
    window.matchMedia = vi.fn(() => ({ matches: true })) as unknown as typeof window.matchMedia;
    render(<PageLoader />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.documentElement.classList.contains("page-loader-active")).toBe(false);
  });
  it("never blocks workspace routes", () => {
    route.pathname = "/dashboard";
    render(<PageLoader />);
    expect(screen.queryByRole("status")).toBeNull();
  });
  it("releases the scroll lock when unmounted", () => {
    const view = render(<PageLoader />);
    view.unmount();
    expect(document.documentElement.classList.contains("page-loader-active")).toBe(false);
  });
});

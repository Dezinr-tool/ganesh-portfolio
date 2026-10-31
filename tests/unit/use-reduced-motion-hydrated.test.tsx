// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReducedMotionHydrated } from "@/lib/use-reduced-motion-hydrated";

function Probe() {
  return <p>{useReducedMotionHydrated() ? "reduced" : "animated"}</p>;
}

let changeListener: (() => void) | undefined;
let matches = true;

beforeEach(() => {
  matches = true;
  changeListener = undefined;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      get matches() {
        return matches;
      },
      addEventListener: (_: string, listener: () => void) => {
        changeListener = listener;
      },
      removeEventListener: vi.fn(),
    })),
  );
});

describe("useReducedMotionHydrated", () => {
  it("renders the animated version on the server, whatever the visitor prefers", () => {
    expect(renderToString(<Probe />)).toContain("animated");
  });

  it("uses the visitor's preference in the browser", () => {
    render(<Probe />);
    expect(screen.getByText("reduced")).toBeTruthy();
  });

  it("follows a change of preference", () => {
    render(<Probe />);
    matches = false;
    act(() => changeListener?.());
    expect(screen.getByText("animated")).toBeTruthy();
  });
});

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WORKS_PROJECTS } from "@/components/sections/works/projects";
import { getCaseStudyBySlugFallback } from "@/lib/work/case-studies-fallback";

const PUBLIC_DIR = join(process.cwd(), "public");
const sample = getCaseStudyBySlugFallback("sample");

describe("sample case study", () => {
  it("exists, but is not listed on the works page", () => {
    expect(sample).toBeDefined();
    expect(WORKS_PROJECTS.some((project) => project.id === "sample")).toBe(false);
  });

  it("has a placeholder in every image slot, background and the hero video", () => {
    const files = [
      sample!.heroVideo,
      sample!.heroPoster,
      sample!.mainImage,
      sample!.backgroundMain,
      sample!.backgroundTop.image,
      sample!.backgroundMiddle.image,
      sample!.dsgn3.image,
      sample!.dsgn4.image,
      sample!.dsgn4.bg,
      sample!.dsgn5.image,
      sample!.dsgn6.image,
      sample!.dsgn7.image,
      sample!.dsgn7.bg,
    ];
    for (const file of files) {
      expect(file, "slot is filled").toBeTruthy();
      expect(existsSync(join(PUBLIC_DIR, file as string)), `${file} exists`).toBe(true);
    }
  });

  it("does not name the agency", () => {
    expect(JSON.stringify(sample)).not.toMatch(/brucira/i);
  });
});

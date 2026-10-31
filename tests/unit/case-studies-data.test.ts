import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WORKS_PROJECTS } from "@/components/sections/works/projects";
import {
  getAllCaseSlugsFallback,
  getCaseStudyBySlugFallback,
} from "@/lib/work/case-studies-fallback";

const PUBLIC_DIR = join(process.cwd(), "public");

/** Every string anywhere inside a value. */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

const slugs = getAllCaseSlugsFallback();
const studies = slugs.map((slug) => getCaseStudyBySlugFallback(slug)!);

describe("case studies", () => {
  it("has a study for every project on the works page, with the same title", () => {
    for (const project of WORKS_PROJECTS) {
      const study = getCaseStudyBySlugFallback(project.id);
      expect(study, `study for ${project.id}`).toBeDefined();
      expect(study!.title).toBe(project.title);
      expect(project.href).toBe(`/work/${project.id}`);
    }
  });

  it("points every image and video at a file that exists", () => {
    const missing = studies.flatMap((study) =>
      strings(study)
        .filter((value) => value.startsWith("/img/"))
        .filter((value) => !existsSync(join(PUBLIC_DIR, value)))
        .map((value) => `${study.slug}: ${value}`),
    );
    expect(missing).toEqual([]);
  });

  it("points every works thumbnail at a file that exists", () => {
    const missing = WORKS_PROJECTS.filter((project) => !existsSync(join(PUBLIC_DIR, project.image))).map(
      (project) => `${project.id}: ${project.image}`,
    );
    expect(missing).toEqual([]);
  });

  // Update this once the 'thanks for the opportunity' credit line is added.
  it("does not name the agency anywhere", () => {
    const hits = studies.flatMap((study) =>
      strings(study)
        .filter((value) => /brucira/i.test(value))
        .map((value) => `${study.slug}: ${value.slice(0, 60)}`),
    );
    expect(hits).toEqual([]);
  });

  it("has no testimonial section", () => {
    for (const study of studies) {
      const labels = study.sections.map((section) => section.label);
      expect(labels.filter((label) => /testimonial|review|quote/i.test(label)), study.slug).toEqual([]);
    }
  });

  it("gives every section a label and at least one paragraph", () => {
    for (const study of studies) {
      expect(study.sections.length, study.slug).toBeGreaterThanOrEqual(3);
      for (const section of study.sections) {
        expect(section.label.trim(), study.slug).not.toBe("");
        expect(section.paragraphs.length, `${study.slug} ${section.label}`).toBeGreaterThan(0);
        for (const paragraph of section.paragraphs) expect(paragraph.trim()).not.toBe("");
      }
    }
  });
});

describe("snabbit", () => {
  const study = getCaseStudyBySlugFallback("snabbit");

  it("exists and links to the live site", () => {
    expect(study).toBeDefined();
    expect(study!.title).toBe("Snabbit");
    expect(study!.websiteUrl).toBe("https://snabbit.com/");
  });

  it("covers the challenge, the work and the impact", () => {
    const labels = study!.sections.map((section) => section.label);
    for (const label of ["BRIEF", "CHALLENGE", "SOLUTION", "IMPACT"]) expect(labels).toContain(label);
  });

  it("opens with the homepage video and uses each of its supplied videos", () => {
    expect(study!.heroVideo).toMatch(/^\/img\/projects\/snabbit\/.+\.mp4$/);
    const videos = strings(study).filter((value) => value.endsWith(".mp4"));
    expect(new Set(videos).size).toBeGreaterThanOrEqual(3);
  });

  it("is a four week project", () => {
    expect(study!.services[3]).toMatch(/4 weeks/i);
  });
});

describe("verbaflo", () => {
  const study = getCaseStudyBySlugFallback("verbaflo");

  it("exists and is listed on the works page", () => {
    expect(study).toBeDefined();
    expect(study!.title).toBe("VerbaFlo");
    expect(WORKS_PROJECTS.map((project) => project.id)).toContain("verbaflo");
  });

  it("covers the challenge, the work and the impact", () => {
    const labels = study!.sections.map((section) => section.label);
    for (const label of ["BRIEF", "CHALLENGE", "SOLUTION", "IMPACT"]) expect(labels).toContain(label);
  });

  it("shows its product in motion", () => {
    const videos = strings(study).filter((value) => value.endsWith(".mp4"));
    expect(new Set(videos).size).toBeGreaterThanOrEqual(4);
  });

  it("runs on a retainer and has no live-site link", () => {
    expect(study!.services[3]).toMatch(/retainer/i);
    expect(study!.websiteUrl).toBeUndefined();
  });
});

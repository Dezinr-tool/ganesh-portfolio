export type WorksCategory = "product-design" | "branding";

export type WorksProject = {
  id: string;
  title: string;
  month: string;
  year: string;
  image: string;
  href: string;
  category: WorksCategory;
};

export const WORKS_CATEGORIES: { id: WorksCategory; label: string }[] = [
  { id: "product-design", label: "Product design" },
  { id: "branding", label: "Brand systems" },
];

export const WORKS_PROJECTS: WorksProject[] = [
  {
    id: "cove-lane",
    title: "Cove & Lane",
    month: "UX",
    year: "Case study",
    image: "/img/projects/cove-lane/figma-moodboard.png",
    href: "/work/cove-lane",
    category: "product-design",
  },
  {
    id: "totoko",
    title: "Totoko",
    month: "UX",
    year: "Case study",
    image: "/img/projects/totoko/figma-brief.png",
    href: "/work/totoko",
    category: "product-design",
  },
  {
    id: "progent",
    title: "Progent",
    month: "Brand",
    year: "Case study",
    image: "/img/projects/progent/figma-home-page.png",
    href: "/work/progent",
    category: "branding",
  },
  {
    id: "snabbit",
    title: "Snabbit",
    month: "Brand",
    year: "Case study",
    image: "/img/projects/snabbit/website.png",
    href: "/work/snabbit",
    category: "branding",
  },
  {
    id: "verbaflo",
    title: "VerbaFlo",
    month: "UX",
    year: "Case study",
    image: "/img/projects/verbaflo/hero-mockup.webp",
    href: "/work/verbaflo",
    category: "product-design",
  },
];

export function getProjectsByCategory(
  category: WorksCategory,
  projects: WorksProject[] = WORKS_PROJECTS,
): WorksProject[] {
  return projects.filter((project) => project.category === category);
}

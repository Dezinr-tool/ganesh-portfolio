export type WorksCategory =
  | "product-design"
  | "branding"
  | "illustration"
  | "iconography"
  | "graphics";

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
  { id: "product-design", label: "Product Design" },
  { id: "branding", label: "Branding" },
  { id: "illustration", label: "Illustration" },
  { id: "iconography", label: "Iconography" },
  { id: "graphics", label: "Graphics" },
];

/** Project preview images (from olhalazarieva.com, hosted locally) */
const PREVIEW = "/img/projects";

export const WORKS_PROJECTS: WorksProject[] = [
  {
    id: "anima",
    title: "Anima",
    month: "06",
    year: "2025",
    image: `${PREVIEW}/art6.jpg`,
    href: "/work/anima",
    category: "product-design",
  },
  {
    id: "lumex",
    title: "LumeX",
    month: "03",
    year: "2025",
    image: `${PREVIEW}/art4.jpg`,
    href: "/work/lumex",
    category: "product-design",
  },
  {
    id: "planza",
    title: "Planza",
    month: "11",
    year: "2024",
    image: `${PREVIEW}/art1.jpg`,
    href: "/work/planza",
    category: "product-design",
  },
  {
    id: "neurosync",
    title: "NeuroSync",
    month: "02",
    year: "2023",
    image: `${PREVIEW}/art2.jpg`,
    href: "/work/neurosync",
    category: "product-design",
  },
  {
    id: "vera",
    title: "Vera Studio",
    month: "09",
    year: "2022",
    image: `${PREVIEW}/art3.jpg`,
    href: "/work/vera",
    category: "branding",
  },
  {
    id: "horizon-atlas",
    title: "Horizon Atlas",
    month: "07",
    year: "2024",
    image: `${PREVIEW}/art5.jpg`,
    href: "/work/horizon-atlas",
    category: "branding",
  },
  {
    id: "northline",
    title: "Northline",
    month: "04",
    year: "2024",
    image: `${PREVIEW}/art2.jpg`,
    href: "/work/northline",
    category: "branding",
  },
  {
    id: "atelier-m",
    title: "Atelier M",
    month: "01",
    year: "2023",
    image: `${PREVIEW}/art4.jpg`,
    href: "/work/atelier-m",
    category: "branding",
  },
  {
    id: "wildflower",
    title: "Wildflower",
    month: "08",
    year: "2024",
    image: `${PREVIEW}/art3.jpg`,
    href: "/work/wildflower",
    category: "illustration",
  },
  {
    id: "coastal-dreams",
    title: "Coastal Dreams",
    month: "05",
    year: "2023",
    image: `${PREVIEW}/art5.jpg`,
    href: "/work/coastal-dreams",
    category: "illustration",
  },
  {
    id: "paper-birds",
    title: "Paper Birds",
    month: "10",
    year: "2022",
    image: `${PREVIEW}/art1.jpg`,
    href: "/work/paper-birds",
    category: "illustration",
  },
  {
    id: "glyph-set",
    title: "Glyph Set",
    month: "12",
    year: "2024",
    image: `${PREVIEW}/art6.jpg`,
    href: "/work/glyph-set",
    category: "iconography",
  },
  {
    id: "wayfinder",
    title: "Wayfinder",
    month: "06",
    year: "2023",
    image: `${PREVIEW}/art2.jpg`,
    href: "/work/wayfinder",
    category: "iconography",
  },
  {
    id: "pixel-pulse",
    title: "Pixel Pulse",
    month: "03",
    year: "2024",
    image: `${PREVIEW}/art4.jpg`,
    href: "/work/pixel-pulse",
    category: "iconography",
  },
  {
    id: "signal-noise",
    title: "Signal & Noise",
    month: "09",
    year: "2024",
    image: `${PREVIEW}/art5.jpg`,
    href: "/work/signal-noise",
    category: "graphics",
  },
  {
    id: "chromatic",
    title: "Chromatic",
    month: "02",
    year: "2023",
    image: `${PREVIEW}/art3.jpg`,
    href: "/work/chromatic",
    category: "graphics",
  },
  {
    id: "form-stack",
    title: "Form Stack",
    month: "11",
    year: "2022",
    image: `${PREVIEW}/art1.jpg`,
    href: "/work/form-stack",
    category: "graphics",
  },
];

export function getProjectsByCategory(
  category: WorksCategory,
  projects: WorksProject[] = WORKS_PROJECTS,
): WorksProject[] {
  return projects.filter((project) => project.category === category);
}

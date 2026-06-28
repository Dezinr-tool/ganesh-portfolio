import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyView } from "@/components/work/CaseStudyView";
import { WORKS_PROJECTS } from "@/components/sections/works/projects";
import { getCaseStudyBySlugFallback } from "@/lib/work/case-studies-fallback";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return WORKS_PROJECTS.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlugFallback(slug);

  if (!study) return { title: "Project not found" };

  const title = `${study.title} — Ganesh Das`;
  const description = study.sections[0]?.paragraphs[0] ?? "Case study by Ganesh Das.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: study.mainImage, alt: study.title }],
    },
  };
}

export default async function WorkCaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const study = getCaseStudyBySlugFallback(slug);

  if (!study) notFound();

  const moreWorks = WORKS_PROJECTS.filter((p) => p.id !== slug)
    .slice(0, 5)
    .map((p) => ({ slug: p.id, title: p.title, image: p.image }));

  return <CaseStudyView study={study} moreWorks={moreWorks} />;
}

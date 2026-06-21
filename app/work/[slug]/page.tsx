import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyView } from "@/components/work/CaseStudyView";
import {
  fetchAllProjectSlugs,
  fetchCaseStudyBySlug,
  fetchMoreWorks,
  fetchWorksProjects,
} from "@/lib/sanity/fetch";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await fetchAllProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = await fetchCaseStudyBySlug(slug);

  if (!study) {
    return { title: "Project not found" };
  }

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
  const study = await fetchCaseStudyBySlug(slug);

  if (!study) {
    notFound();
  }

  const projects = await fetchWorksProjects();
  const moreWorks = await fetchMoreWorks(slug, projects);

  return <CaseStudyView study={study} moreWorks={moreWorks} />;
}

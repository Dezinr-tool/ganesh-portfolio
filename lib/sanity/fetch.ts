import {
  FALLBACK_ABOUT,
  FALLBACK_HERO,
  FALLBACK_HOMEPAGE,
  FALLBACK_SITE_SETTINGS,
  FALLBACK_SOCIAL_LINKS,
  fallbackTestimonials,
  fallbackWorksProjects,
} from '@/lib/sanity/fallbacks'
import {
  mapSanityProjectToCaseStudy,
  mapSanityProjectsToWorksProjects,
  mapSanityTestimonial,
} from '@/lib/sanity/mappers'
import type { HomepageContent, SanityProject, SanityTestimonial } from '@/lib/sanity/types'
import type { CaseStudy } from '@/lib/work/case-studies'
import { serverClient } from '@/sanity/lib/client'
import {
  homepageQuery,
  projectBySlugQuery,
  projectSlugsQuery,
  projectsQuery,
  testimonialsQuery,
} from '@/sanity/queries'
import { isSanityConfigured } from '@/sanity/env'
import type { Testimonial } from '@/components/sections/Testimonials'
import type { WorksProject } from '@/components/sections/works/projects'

function mergeHomepage(data: Partial<HomepageContent> | null): HomepageContent {
  return {
    siteSettings: { ...FALLBACK_SITE_SETTINGS, ...data?.siteSettings },
    hero: { ...FALLBACK_HERO, ...data?.hero },
    about: { ...FALLBACK_ABOUT, ...data?.about },
    socialLinks: { ...FALLBACK_SOCIAL_LINKS, ...data?.socialLinks },
    projects: data?.projects ?? [],
    testimonials: data?.testimonials ?? [],
  }
}

export async function fetchHomepageContent(): Promise<HomepageContent> {
  if (!isSanityConfigured) return FALLBACK_HOMEPAGE

  try {
    const data = await serverClient.fetch<Partial<HomepageContent> | null>(homepageQuery)
    return mergeHomepage(data)
  } catch {
    return FALLBACK_HOMEPAGE
  }
}

export async function fetchWorksProjects(): Promise<WorksProject[]> {
  if (!isSanityConfigured) return fallbackWorksProjects()

  try {
    const projects = await serverClient.fetch<SanityProject[]>(projectsQuery)
    if (!projects?.length) return fallbackWorksProjects()
    return mapSanityProjectsToWorksProjects(projects)
  } catch {
    return fallbackWorksProjects()
  }
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  if (!isSanityConfigured) return fallbackTestimonials()

  try {
    const items = await serverClient.fetch<SanityTestimonial[]>(testimonialsQuery)
    if (!items?.length) return fallbackTestimonials()
    return items.map(mapSanityTestimonial)
  } catch {
    return fallbackTestimonials()
  }
}

export async function fetchAllProjectSlugs(): Promise<string[]> {
  if (!isSanityConfigured) {
    return fallbackWorksProjects().map((project) => project.id)
  }

  try {
    const slugs = await serverClient.fetch<string[]>(projectSlugsQuery)
    if (!slugs?.length) {
      return fallbackWorksProjects().map((project) => project.id)
    }
    return slugs
  } catch {
    return fallbackWorksProjects().map((project) => project.id)
  }
}

export async function fetchCaseStudyBySlug(slug: string): Promise<CaseStudy | undefined> {
  if (!isSanityConfigured) {
    const { getCaseStudyBySlugFallback } = await import('@/lib/work/case-studies-fallback')
    return getCaseStudyBySlugFallback(slug)
  }

  try {
    const project = await serverClient.fetch<SanityProject | null>(projectBySlugQuery, { slug })
    if (project) return mapSanityProjectToCaseStudy(project)

    const { getCaseStudyBySlugFallback } = await import('@/lib/work/case-studies-fallback')
    return getCaseStudyBySlugFallback(slug)
  } catch {
    const { getCaseStudyBySlugFallback } = await import('@/lib/work/case-studies-fallback')
    return getCaseStudyBySlugFallback(slug)
  }
}

export async function fetchMoreWorks(currentSlug: string, projects?: WorksProject[]) {
  const list = projects ?? (await fetchWorksProjects())
  return list
    .filter((project) => project.id !== currentSlug)
    .slice(0, 5)
    .map((project) => ({
      slug: project.id,
      title: project.title,
      image: project.image,
    }))
}

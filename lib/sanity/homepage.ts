import { fetchHomepageContent } from '@/lib/sanity/fetch'
import { fallbackTestimonials, fallbackWorksProjects } from '@/lib/sanity/fallbacks'
import {
  mapSanityProjectsToWorksProjects,
  mapSanityTestimonial,
  splitLines,
} from '@/lib/sanity/mappers'

export async function getHomepageRenderData() {
  const content = await fetchHomepageContent()
  const projects = content.projects.length
    ? mapSanityProjectsToWorksProjects(content.projects)
    : fallbackWorksProjects()
  const testimonials = content.testimonials.length
    ? content.testimonials.map(mapSanityTestimonial)
    : fallbackTestimonials()

  const headlineLines = splitLines(content.hero.headline, [
    'Design & Strategy',
    'Partner for Startups',
  ])
  const badgeLines = splitLines(content.hero.badgeText, ['Design Manager', '@BRUCIRA'])

  return {
    content,
    projects,
    testimonials,
    headlineLines,
    badgeLines,
  }
}

import type { Testimonial } from '@/components/sections/Testimonials'
import {
  type WorksCategory,
  type WorksProject,
  WORKS_CATEGORIES,
} from '@/components/sections/works/projects'
import type { CaseStudy } from '@/lib/work/case-studies'
import { urlFor } from '@/sanity/lib/image'
import type { SanityProject, SanityTestimonial } from '@/lib/sanity/types'

const CATEGORY_MAP: Record<string, WorksCategory> = {
  'Product Design': 'product-design',
  Branding: 'branding',
  Illustration: 'illustration',
  Iconography: 'iconography',
  Graphics: 'graphics',
}

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=85&auto=format&fit=crop'

function imageUrl(source: SanityProject['thumbnailImage'], width = 1600): string {
  if (!source) return PLACEHOLDER
  return urlFor(source).width(width).auto('format').url()
}

function galleryUrls(project: SanityProject): string[] {
  const images = project.gallery ?? []
  return images.map((image) => urlFor(image).width(1600).auto('format').url())
}

export function mapCategoryToSlug(category: string): WorksCategory {
  return CATEGORY_MAP[category] ?? 'product-design'
}

export function mapSanityProjectToWorksProject(project: SanityProject): WorksProject {
  return {
    id: project.slug,
    title: project.title,
    month: '01',
    year: project.year ?? '',
    image: imageUrl(project.thumbnailImage, 1200),
    href: `/work/${project.slug}`,
    category: mapCategoryToSlug(project.category),
  }
}

export function mapSanityProjectsToWorksProjects(projects: SanityProject[]): WorksProject[] {
  return projects.map(mapSanityProjectToWorksProject)
}

export function mapSanityTestimonial(item: SanityTestimonial): Testimonial {
  return {
    id: item._id,
    quote: item.quote,
    name: item.name,
    role: item.role ?? '',
    company: item.company ?? '',
    initials: item.initials,
  }
}

export function mapSanityProjectToCaseStudy(project: SanityProject): CaseStudy {
  const thumbnail = imageUrl(project.thumbnailImage)
  const cover = project.coverImage ? imageUrl(project.coverImage) : thumbnail
  const gallery = galleryUrls(project)
  const padded = [cover, ...gallery]

  while (padded.length < 6) {
    padded.push(PLACEHOLDER)
  }

  const description = project.description?.trim() ?? ''
  const overview = description ? [description] : ['Case study overview coming soon.']
  const industry = project.category.toLowerCase()
  const year = project.year ?? ''

  return {
    slug: project.slug,
    title: project.title,
    mainImage: thumbnail,
    services: [
      'website',
      project.role?.trim() || 'web design, UX/UI design',
      industry,
      year,
    ],
    barcodeTitle: '( india )',
    sections: [
      { label: 'OVERVIEW', paragraphs: overview },
      {
        label: 'SOLUTION',
        paragraphs: [
          description
            ? `Delivered for ${project.client?.trim() || 'the client'} with a focus on clarity, craft, and scalable design systems.`
            : 'Solution details coming soon.',
        ],
      },
    ],
    websiteUrl: project.liveUrl || `mailto:hello@designbyganesh.com`,
    websiteLabel: project.liveUrl ? 'visit website' : 'get in touch',
    backgroundMain: cover,
    backgroundTop: { title: '', image: padded[0] ?? PLACEHOLDER },
    backgroundMiddle: { title: '', image: padded[1] ?? PLACEHOLDER },
    dsgn3: { image: padded[2] ?? PLACEHOLDER, title: '' },
    dsgn4: { title: project.title.toLowerCase(), image: padded[3] ?? PLACEHOLDER, bg: null },
    dsgn5: { title: 'about page', image: padded[4] ?? PLACEHOLDER },
    dsgn6: { title: 'adaptive design', image: padded[5] ?? PLACEHOLDER },
    dsgn7: {
      title: 'project page',
      image: padded[6] ?? padded[0] ?? PLACEHOLDER,
      bg: cover,
      video: null,
    },
  }
}

export function splitLines(value: string | undefined, fallback: string[]): string[] {
  if (!value?.trim()) return fallback
  const lines = value.split('\n').map((line) => line.trim()).filter(Boolean)
  return lines.length > 0 ? lines : fallback
}

export function splitEmailLines(email: string): [string, string] {
  const atIndex = email.indexOf('@')
  if (atIndex === -1) return [email, '']
  return [email.slice(0, atIndex + 1), email.slice(atIndex + 1)]
}

export function phoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits ? `tel:+${digits.startsWith('91') ? digits : `91${digits}`}` : `tel:${phone}`
}

export { WORKS_CATEGORIES }

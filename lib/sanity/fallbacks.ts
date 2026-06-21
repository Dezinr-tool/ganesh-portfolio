import { ABOUT_TEXT } from '@/components/sections/about-content'
import { TESTIMONIALS, type Testimonial } from '@/components/sections/Testimonials'
import { WORKS_PROJECTS, type WorksProject } from '@/components/sections/works/projects'
import type {
  HomepageContent,
  SanityAbout,
  SanityHero,
  SanitySiteSettings,
  SanitySocialLinks,
} from '@/lib/sanity/types'

export const FALLBACK_SITE_SETTINGS: SanitySiteSettings = {
  siteName: 'Ganesh Das',
  tagline: 'Design & Strategy Partner for Startups',
  email: 'hello@designbyganesh.com',
  phone: '73044 92888',
  location: '3101, Venus, Forest Enclave, Hiranandani\nFortunecity, Maharashtra 410207',
  footerCopyright:
    'All Right Reserved. Ganesh Das.\nAny Reproduction, Distribution, Or Use Of The\nMaterials Without Permission Is Prohibited.',
  worksSectionTitle: 'recent works',
  testimonialsHeading: "Trusted by the people I've built with",
}

export const FALLBACK_HERO: SanityHero = {
  headline: 'Design & Strategy\nPartner for Startups',
  subtext:
    'I help founders build products people love — from zero to launch and beyond. D2C, B2B & B2B2C specialist with 14+ years across funded Indian startups.',
  badgeText: 'Design Manager\n@BRUCIRA',
  ctaLabel: '',
  ctaLink: '',
}

export const FALLBACK_ABOUT: SanityAbout = {
  sectionLabel: "I don't just solve problems",
  bodyText: ABOUT_TEXT,
}

export const FALLBACK_SOCIAL_LINKS: SanitySocialLinks = {
  dribbble: 'https://dribbble.com/ganeshdas',
  behance: 'https://behance.net/ganeshdas',
  linkedin: 'https://linkedin.com/in/ganeshdas',
  instagram: '',
}

export const FALLBACK_HOMEPAGE: HomepageContent = {
  siteSettings: FALLBACK_SITE_SETTINGS,
  hero: FALLBACK_HERO,
  about: FALLBACK_ABOUT,
  socialLinks: FALLBACK_SOCIAL_LINKS,
  projects: [],
  testimonials: [],
}

export function fallbackWorksProjects(): WorksProject[] {
  return WORKS_PROJECTS
}

export function fallbackTestimonials(): Testimonial[] {
  return TESTIMONIALS
}

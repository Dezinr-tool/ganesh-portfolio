import type { SanityImageSource } from '@sanity/image-url'

export type SanitySiteSettings = {
  siteName?: string
  tagline?: string
  email?: string
  phone?: string
  location?: string
  footerCopyright?: string
  worksSectionTitle?: string
  testimonialsHeading?: string
}

export type SanityHero = {
  headline?: string
  subtext?: string
  badgeText?: string
  ctaLabel?: string
  ctaLink?: string
}

export type SanityAbout = {
  sectionLabel?: string
  bodyText?: string
}

export type SanitySocialLinks = {
  instagram?: string
  linkedin?: string
  behance?: string
  dribbble?: string
}

export type SanityProject = {
  _id: string
  title: string
  slug: string
  category: string
  year?: string
  client?: string
  role?: string
  description?: string
  liveUrl?: string
  thumbnailImage?: SanityImageSource
  coverImage?: SanityImageSource
  gallery?: SanityImageSource[]
}

export type SanityTestimonial = {
  _id: string
  name: string
  role?: string
  company?: string
  quote: string
  initials?: string
}

export type HomepageContent = {
  siteSettings: SanitySiteSettings
  hero: SanityHero
  about: SanityAbout
  socialLinks: SanitySocialLinks
  projects: SanityProject[]
  testimonials: SanityTestimonial[]
}

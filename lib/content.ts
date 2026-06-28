/**
 * Single source of truth for all portfolio content.
 * Update copy here, or wire Notion in future by replacing these exports.
 */

import { ABOUT_TEXT } from '@/components/sections/about-content'
import { TESTIMONIALS } from '@/components/sections/Testimonials'
import { WORKS_PROJECTS } from '@/components/sections/works/projects'
import { splitLines } from '@/lib/content-utils'

export type SiteSettings = {
  siteName: string
  tagline: string
  email: string
  phone: string
  location: string
  footerCopyright: string
  worksSectionTitle: string
  testimonialsHeading: string
}

export type HeroContent = {
  headline: string
  subtext: string
  badgeText: string
}

export type AboutContent = {
  sectionLabel: string
  bodyText: string
}

export type SocialLinks = {
  instagram?: string
  linkedin?: string
  behance?: string
  dribbble?: string
}

export type HomepageContent = {
  siteSettings: SiteSettings
  hero: HeroContent
  about: AboutContent
  socialLinks: SocialLinks
}

export const SITE_SETTINGS: SiteSettings = {
  siteName: 'Ganesh Das',
  tagline: 'Design & Strategy Partner for Startups',
  email: 'hello@designbyganesh.com',
  phone: '73044 92888',
  location: '3101, Venus, Forest Enclave, Hiranandani\nFortunecity, Maharashtra 410207',
  footerCopyright:
    'All Right Reserved. Ganesh Das.\nAny Reproduction, Distribution, Or Use Of The\nMaterials Without Permission Is Prohibited.',
  worksSectionTitle: 'recent works',
  testimonialsHeading: "Words from the people who've seen me work.",
}

export const HERO: HeroContent = {
  headline: 'You have an idea.\nI know what to do with it.',
  subtext:
    'I think in systems, design in stories, and obsess over why users do what they do. 15 years. Dozens of founders. Zero accidental launches.',
  badgeText: '15 years of not guessing.',
}

export const ABOUT: AboutContent = {
  sectionLabel: 'HOW I GOT HERE',
  bodyText: ABOUT_TEXT,
}

export const SOCIAL_LINKS: SocialLinks = {
  dribbble: 'https://dribbble.com/ganeshdas',
  behance: 'https://behance.net/ganeshdas',
  linkedin: 'https://linkedin.com/in/ganeshdas',
  instagram: '',
}

export const HOMEPAGE_CONTENT: HomepageContent = {
  siteSettings: SITE_SETTINGS,
  hero: HERO,
  about: ABOUT,
  socialLinks: SOCIAL_LINKS,
}

export function getHomepageRenderData() {
  const content = HOMEPAGE_CONTENT
  const headlineLines = splitLines(content.hero.headline, ['You have an idea.', 'I know what to do with it.'])
  const badgeLines = splitLines(content.hero.badgeText, ['15 years of not guessing.'])

  return {
    content,
    projects: WORKS_PROJECTS,
    testimonials: TESTIMONIALS,
    headlineLines,
    badgeLines,
  }
}

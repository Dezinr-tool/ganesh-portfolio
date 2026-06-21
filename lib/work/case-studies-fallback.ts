import { WORKS_PROJECTS } from '@/components/sections/works/projects'
import type { CaseStudy } from '@/lib/work/case-studies'

const DUMMY = {
  bg: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=85&auto=format&fit=crop',
  screen1:
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=85&auto=format&fit=crop',
  screen2:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=85&auto=format&fit=crop',
  screen3:
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600&q=85&auto=format&fit=crop',
  screen4:
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1600&q=85&auto=format&fit=crop',
  screen5:
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1600&q=85&auto=format&fit=crop',
  mobile:
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=900&q=85&auto=format&fit=crop',
  detail:
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1600&q=85&auto=format&fit=crop',
}

function baseCase(
  slug: string,
  title: string,
  mainImage: string,
  industry: string,
  year: string,
  overview: string[],
  solution: string[],
  extras: Partial<CaseStudy> = {},
): CaseStudy {
  return {
    slug,
    title,
    mainImage,
    services: ['website', 'web design, UX/UI design', industry, year],
    barcodeTitle: '( india )',
    sections: [
      { label: 'OVERVIEW', paragraphs: overview },
      { label: 'SOLUTION', paragraphs: solution },
    ],
    websiteUrl: 'mailto:hello@designbyganesh.com',
    websiteLabel: 'visit website',
    backgroundMain: DUMMY.bg,
    backgroundTop: { title: '', image: DUMMY.screen1 },
    backgroundMiddle: { title: '', image: DUMMY.screen2 },
    dsgn3: { image: DUMMY.screen3, title: '' },
    dsgn4: { title: title.toLowerCase(), image: DUMMY.screen4, bg: null },
    dsgn5: { title: 'about page', image: DUMMY.screen5 },
    dsgn6: { title: 'adaptive design', image: DUMMY.mobile },
    dsgn7: { title: 'project page', image: DUMMY.detail, bg: DUMMY.bg, video: null },
    ...extras,
  }
}

const CASE_STUDIES: CaseStudy[] = [
  baseCase(
    'anima',
    'anima',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1920&q=85&auto=format&fit=crop',
    'wellness platform',
    '2025',
    [
      'The goal was to design a digital product that feels calm, human, and premium — translating a wellness brand into an interface people trust with their daily routines.',
    ],
    [
      'We built a modular design system around soft contrast, editorial typography, and motion that guides rather than distracts — so the product feels intentional at every touchpoint.',
    ],
  ),
  baseCase(
    'lumex',
    'lumex',
    'https://images.unsplash.com/photo-1614850523459-c2f4c699c84e?w=1400&q=85&auto=format&fit=crop',
    'lighting commerce',
    '2025',
    [
      'LumeX needed a storefront that could showcase technical products without losing the warmth and craft of the brand.',
    ],
    [
      'The solution paired restrained product photography with a flexible grid, clear spec hierarchy, and checkout flows tuned for high-consideration purchases.',
    ],
  ),
  baseCase(
    'planza',
    'planza',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=85&auto=format&fit=crop',
    'collaboration SaaS',
    '2024',
    [
      'Planza required a product experience that makes complex planning feel lightweight for distributed teams.',
    ],
    [
      'We focused on clarity in navigation, progressive disclosure in dashboards, and a visual language that keeps focus on decisions — not chrome.',
    ],
  ),
  baseCase(
    'horizon-atlas',
    'horizon atlas',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&q=85&auto=format&fit=crop',
    'travel editorial',
    '2024',
    [
      'Horizon Atlas needed an editorial site that could carry long-form storytelling while staying fast and immersive on mobile.',
    ],
    [
      'The design uses cinematic imagery, scroll-driven chapter breaks, and typographic rhythm that mirrors print travel magazines.',
    ],
  ),
  baseCase(
    'neurosync',
    'neurosync',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1920&q=85&auto=format&fit=crop',
    'health tech',
    '2023',
    [
      'NeuroSync needed to communicate clinical credibility while remaining approachable for everyday users tracking cognitive wellness.',
    ],
    [
      'We balanced data-rich views with human copy, accessible color contrast, and onboarding that explains value before asking for commitment.',
    ],
  ),
  baseCase(
    'vera',
    'vera studio',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85&auto=format&fit=crop',
    'creative studio',
    '2022',
    [
      'Vera Studio wanted a portfolio that feels like entering a gallery — minimal, confident, and focused on the work itself.',
    ],
    [
      'The site uses generous whitespace, asymmetric layouts, and subtle motion to let each project breathe without losing navigational clarity.',
    ],
  ),
]

function genericCaseFromWorks(slug: string): CaseStudy | undefined {
  const project = WORKS_PROJECTS.find((item) => item.id === slug)
  if (!project) return undefined

  return baseCase(
    project.id,
    project.title,
    project.image,
    project.category.replace('-', ' '),
    project.year,
    [`${project.title} — selected work from the portfolio.`],
    ['Full case study content can be authored in Sanity Studio.'],
    { mainImage: project.image, backgroundMain: project.image },
  )
}

export function getCaseStudyBySlugFallback(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.slug === slug) ?? genericCaseFromWorks(slug)
}

export function getAllCaseSlugsFallback(): string[] {
  return WORKS_PROJECTS.map((project) => project.id)
}
